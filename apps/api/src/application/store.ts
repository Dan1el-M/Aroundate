import { v7 as uuid } from "uuid";
import type { ConsentEvent } from "../../../../packages/domain/consent.js";
export interface Principal {
  issuer: string;
  subject: string;
  scopes: string[];
  verified: boolean;
  authTime: number;
}
export interface Profile {
  id: string;
  display_name: string | null;
  locale: "es-CR" | "en";
  verified_account: boolean;
  created_at: string;
  version: number;
}
export interface Preset {
  id: string;
  name: string;
  search: unknown;
  saved_location: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}
export interface UserData {
  profile: Profile;
  saved: { place_id: string; saved_at: string }[];
  presets: Preset[];
}
export interface Store {
  user(principal: Principal): Promise<UserData>;
  saveUser(principal: Principal, data: UserData): Promise<void>;
  consents(proof: string): Promise<ConsentEvent[]>;
  appendConsent(proof: string, events: ConsentEvent[]): Promise<void>;
  receipt(
    proof: string,
    kind: string,
    data: unknown,
  ): Promise<{ id: string; status: string; created_at: string }>;
  idempotent<T>(
    scope: string,
    route: string,
    key: string,
    body: string,
    execute: () => Promise<T>,
  ): Promise<T>;
}
export class Conflict extends Error {}
export class MemoryStore implements Store {
  private users = new Map<string, UserData>();
  private choices = new Map<string, ConsentEvent[]>();
  private receipts: { proof: string; kind: string; data: unknown }[] = [];
  private operations = new Map<
    string,
    { body: string; expires: number; result: Promise<unknown> }
  >();
  private queues = new Map<string, Promise<unknown>>();
  private owner(principal: Principal) {
    return `${principal.issuer}\0${principal.subject}`;
  }
  async user(principal: Principal) {
    const key = this.owner(principal);
    let value = this.users.get(key);
    if (!value) {
      value = {
        profile: {
          id: uuid(),
          display_name: null,
          locale: "es-CR",
          verified_account: principal.verified,
          created_at: new Date().toISOString(),
          version: 1,
        },
        saved: [],
        presets: [],
      };
      this.users.set(key, value);
    }
    return structuredClone(value);
  }
  async saveUser(principal: Principal, data: UserData) {
    const current = await this.user(principal);
    if (current.profile.id !== data.profile.id)
      throw new Error("Owner mismatch");
    this.users.set(this.owner(principal), structuredClone(data));
  }
  async consents(proof: string) {
    return structuredClone(this.choices.get(proof) ?? []);
  }
  async appendConsent(proof: string, events: ConsentEvent[]) {
    this.choices.set(proof, [
      ...(this.choices.get(proof) ?? []),
      ...structuredClone(events),
    ]);
  }
  async receipt(proof: string, kind: string, data: unknown) {
    this.receipts.push({ proof, kind, data: structuredClone(data) });
    return {
      id: uuid(),
      status: "pending",
      created_at: new Date().toISOString(),
    };
  }
  async idempotent<T>(
    scope: string,
    route: string,
    key: string,
    body: string,
    execute: () => Promise<T>,
  ): Promise<T> {
    for (const [id, entry] of this.operations)
      if (entry.expires < Date.now()) this.operations.delete(id);
    const id = `${scope}\0${route}\0${key}`;
    const existing = this.operations.get(id);
    if (existing) {
      if (existing.body !== body) throw new Conflict("idempotency_mismatch");
      return structuredClone(await existing.result) as T;
    }
    const previous = this.queues.get(scope) ?? Promise.resolve();
    const result = previous.catch(() => {}).then(execute);
    this.queues.set(scope, result);
    this.operations.set(id, { body, expires: Date.now() + 86400000, result });
    try {
      return structuredClone(await result);
    } catch (error) {
      this.operations.delete(id);
      throw error;
    } finally {
      if (this.queues.get(scope) === result) this.queues.delete(scope);
    }
  }
}
