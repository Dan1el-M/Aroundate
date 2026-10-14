import pg from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
import { v7 as uuid } from "uuid";
import type { ConsentEvent } from "../../../../packages/domain/consent.js";
import {
  encrypt,
  decrypt,
  digest,
} from "../../../../packages/security/crypto.js";
import {
  Conflict,
  type Principal,
  type Store,
  type UserData,
} from "../application/store.js";
export class PostgresStore implements Store {
  private context = new AsyncLocalStorage<pg.PoolClient>();
  readonly pool: pg.Pool;
  constructor(
    connection: string,
    private key: string,
  ) {
    this.pool = new pg.Pool({
      connectionString: connection,
      max: 10,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
    });
  }
  private async transaction<T>(
    principal: Principal | undefined,
    proof: string | undefined,
    work: (client: pg.PoolClient) => Promise<T>,
  ): Promise<T> {
    const existing = this.context.getStore();
    if (existing) {
      await existing.query(
        "SELECT set_config('app.issuer',$1,true),set_config('app.subject',$2,true),set_config('app.proof',$3,true)",
        [principal?.issuer ?? "", principal?.subject ?? "", proof ?? ""],
      );
      return work(existing);
    }
    const client = await this.pool.connect();
    await client.query("BEGIN");
    try {
      await client.query(
        "SELECT set_config('app.issuer',$1,true),set_config('app.subject',$2,true),set_config('app.proof',$3,true)",
        [principal?.issuer ?? "", principal?.subject ?? "", proof ?? ""],
      );
      const result = await this.context.run(client, () => work(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  private async identity(client: pg.PoolClient, principal: Principal) {
    await client.query(
      "INSERT INTO privacy.users(id,oidc_issuer,oidc_subject,verified_account) VALUES($1,$2,$3,$4) ON CONFLICT(oidc_issuer,oidc_subject) DO NOTHING",
      [uuid(), principal.issuer, principal.subject, principal.verified],
    );
    const result = await client.query<{
      id: string;
      display_name_cipher: Buffer | null;
      locale: "es-CR" | "en";
      verified_account: boolean;
      created_at: Date;
    }>(
      "SELECT id,display_name_cipher,locale,verified_account,created_at FROM privacy.users WHERE oidc_issuer=$1 AND oidc_subject=$2 AND deleted_at IS NULL",
      [principal.issuer, principal.subject],
    );
    const user = result.rows[0];
    if (!user) throw new Error("Account unavailable");
    await client.query("SELECT set_config('app.user_id',$1,true)", [user.id]);
    return user;
  }
  async user(principal: Principal): Promise<UserData> {
    return this.transaction(principal, undefined, async (client) => {
      const u = await this.identity(client, principal);
      const saved = (
        await client.query<{ place_id: string; saved_at: Date }>(
          "SELECT place_id,saved_at FROM privacy.saved_places WHERE user_id=$1 ORDER BY saved_at,place_id LIMIT 50",
          [u.id],
        )
      ).rows;
      const presets = (
        await client.query<{
          id: string;
          name: string;
          filters: unknown;
          created_at: Date;
          updated_at: Date;
          version: number;
        }>(
          "SELECT id,name,filters,created_at,updated_at,version FROM privacy.filter_presets WHERE user_id=$1 ORDER BY created_at,id LIMIT 50",
          [u.id],
        )
      ).rows;
      return {
        profile: {
          id: u.id,
          display_name: u.display_name_cipher
            ? decrypt<string>(
                u.display_name_cipher,
                this.key,
                `profile:${u.id}`,
              )
            : null,
          locale: u.locale,
          verified_account: u.verified_account,
          created_at: u.created_at.toISOString(),
          version: 1,
        },
        saved: saved.map((item) => ({
          ...item,
          saved_at: item.saved_at.toISOString(),
        })),
        presets: presets.map((item) => ({
          id: item.id,
          name: item.name,
          search: item.filters,
          saved_location: false,
          created_at: item.created_at.toISOString(),
          updated_at: item.updated_at.toISOString(),
          version: item.version,
        })),
      };
    });
  }
  async saveUser(principal: Principal, data: UserData) {
    await this.transaction(principal, undefined, async (client) => {
      const user = await this.identity(client, principal);
      if (user.id !== data.profile.id) throw new Error("Owner mismatch");
      await client.query(
        "SELECT id FROM privacy.users WHERE id=$1 FOR UPDATE",
        [user.id],
      );
      await client.query(
        "UPDATE privacy.users SET display_name_cipher=$1,locale=$2 WHERE id=$3",
        [
          data.profile.display_name === null
            ? null
            : encrypt(
                data.profile.display_name,
                this.key,
                `profile:${user.id}`,
              ),
          data.profile.locale,
          user.id,
        ],
      );
      await client.query("DELETE FROM privacy.saved_places WHERE user_id=$1", [
        user.id,
      ]);
      for (const item of data.saved)
        await client.query(
          "INSERT INTO privacy.saved_places(user_id,place_id,saved_at) VALUES($1,$2,$3)",
          [user.id, item.place_id, item.saved_at],
        );
      await client.query(
        "DELETE FROM privacy.filter_presets WHERE user_id=$1",
        [user.id],
      );
      for (const item of data.presets) {
        if (item.saved_location)
          throw new Error("Live exact-location presets not enabled");
        await client.query(
          "INSERT INTO privacy.filter_presets(id,user_id,name,filters,version,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            item.id,
            user.id,
            item.name,
            JSON.stringify(item.search),
            item.version,
            item.created_at,
            item.updated_at,
          ],
        );
      }
    });
  }
  async consents(proof: string): Promise<ConsentEvent[]> {
    return this.transaction(undefined, proof, async (client) =>
      (
        await client.query<{
          purpose: ConsentEvent["purpose"];
          decision: ConsentEvent["decision"];
          version: string;
          created_at: Date;
        }>(
          "SELECT purpose,decision,version,created_at FROM privacy.consents WHERE subject_hash=$1 ORDER BY created_at,id",
          [proof],
        )
      ).rows.map((event) => ({
        purpose: event.purpose,
        decision: event.decision,
        version: event.version,
        at: event.created_at.getTime(),
      })),
    );
  }
  async appendConsent(proof: string, events: ConsentEvent[]) {
    await this.transaction(undefined, proof, async (client) => {
      for (const event of events)
        await client.query(
          "INSERT INTO privacy.consents(id,subject_hash,purpose,decision,version,created_at) VALUES($1,$2,$3,$4,$5,$6)",
          [
            uuid(),
            proof,
            event.purpose,
            event.decision,
            event.version,
            new Date(event.at),
          ],
        );
    });
  }
  async receipt(proof: string, kind: string, data: unknown) {
    const id = uuid();
    await this.transaction(undefined, proof, async (client) => {
      await client.query(
        "INSERT INTO trust.reports(id,subject_hash,target_kind,target_id,reason,details_cipher) VALUES($1,$2,$3,$4,$5,$6)",
        [
          id,
          proof,
          "other",
          "request",
          kind,
          encrypt(data, this.key, `receipt:${id}`),
        ],
      );
    });
    return { id, status: "pending", created_at: new Date().toISOString() };
  }
  async idempotent<T>(
    scope: string,
    route: string,
    key: string,
    body: string,
    execute: () => Promise<T>,
  ): Promise<T> {
    return this.transaction(undefined, undefined, async (client) => {
      const scopeHash = digest(scope),
        keyHash = digest(key),
        bodyHash = digest(body);
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [`${scopeHash}:${route}:${keyHash}`],
      );
      const row = (
        await client.query<{ body_hash: string; response: T }>(
          "SELECT body_hash,response FROM ops.idempotency_records WHERE scope_hash=$1 AND route=$2 AND key_hash=$3 AND expires_at>now()",
          [scopeHash, route, keyHash],
        )
      ).rows[0];
      if (row) {
        if (row.body_hash !== bodyHash)
          throw new Conflict("idempotency_mismatch");
        return row.response;
      }
      const result = await execute();
      await client.query(
        "INSERT INTO ops.idempotency_records(scope_hash,route,key_hash,body_hash,response,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '24 hours') ON CONFLICT(scope_hash,route,key_hash) DO UPDATE SET body_hash=excluded.body_hash,response=excluded.response,expires_at=excluded.expires_at",
        [scopeHash, route, keyHash, bodyHash, JSON.stringify(result)],
      );
      return result;
    });
  }
}
