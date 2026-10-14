import { describe, it, expect } from "vitest";
import pg from "pg";
import { v7 as uuid } from "uuid";
describe.skipIf(process.env.RUN_DB_TESTS !== "true")(
  "Real PostgreSQL ownership and geospatial integration",
  () => {
    it("supports PostGIS and enforces deny-default RLS without pool context leakage", async () => {
      const admin = new pg.Client({
          connectionString: process.env.MIGRATION_DATABASE_URL,
        }),
        app = new pg.Client({ connectionString: process.env.DATABASE_URL });
      await admin.connect();
      await app.connect();
      try {
        expect(
          (await admin.query("SELECT PostGIS_Version() AS version")).rows[0]
            .version,
        ).toBeTruthy();
        const first = uuid(),
          second = uuid();
        await admin.query(
          "INSERT INTO privacy.users(id,oidc_issuer,oidc_subject) VALUES($1,$2,$3),($4,$2,$5)",
          [first, "db-test", "a", second, "b"],
        );
        expect((await app.query("SELECT id FROM privacy.users")).rowCount).toBe(
          0,
        );
        await app.query("BEGIN");
        await app.query(
          "SELECT set_config('app.issuer','db-test',true),set_config('app.subject','a',true),set_config('app.user_id',$1,true)",
          [first],
        );
        expect(
          (await app.query("SELECT id FROM privacy.users")).rows.map(
            (row) => row.id,
          ),
        ).toEqual([first]);
        await app.query("COMMIT");
        expect((await app.query("SELECT id FROM privacy.users")).rowCount).toBe(
          0,
        );
        await expect(app.query("DROP TABLE privacy.users")).rejects.toThrow();
        await expect(
          app.query("UPDATE privacy.users SET locale='en' WHERE id=$1", [
            second,
          ]),
        ).resolves.toMatchObject({ rowCount: 0 });
      } finally {
        await app.end();
        await admin.end();
      }
    }, 20000);
  },
);
