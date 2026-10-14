import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import {
  MemoryStore,
  type Principal,
} from "../apps/api/src/application/store.js";
import { encrypt, decrypt } from "../packages/security/crypto.js";
const principal = (subject: string): Principal => ({
  issuer: "test",
  subject,
  scopes: [],
  verified: true,
  authTime: 0,
});
describe("Ownership and idempotent native writes", () => {
  it("separates accounts and protects snapshots from external mutation", async () => {
    const store = new MemoryStore(),
      a = await store.user(principal("A")),
      b = await store.user(principal("B"));
    expect(a.profile.id).not.toBe(b.profile.id);
    a.saved.push({ place_id: "only-a", saved_at: new Date().toISOString() });
    await store.saveUser(principal("A"), a);
    expect((await store.user(principal("B"))).saved).toEqual([]);
    a.saved.length = 0;
    expect((await store.user(principal("A"))).saved).toHaveLength(1);
    await expect(store.saveUser(principal("B"), a)).rejects.toThrow("Owner");
  });
  it("deduplicates simultaneous POSTs rejects changed payload and retries failed writes", async () => {
    const store = new MemoryStore();
    let executions = 0;
    const execute = async () => ({ count: ++executions });
    const result = await Promise.all([
      store.idempotent("A", "route", "key", "body", execute),
      store.idempotent("A", "route", "key", "body", execute),
    ]);
    expect(result[0]).toEqual(result[1]);
    expect(executions).toBe(1);
    await expect(
      store.idempotent("A", "route", "key", "different", execute),
    ).rejects.toThrow();
    await expect(
      store.idempotent("A", "route", "fail", "body", async () => {
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    expect(
      await store.idempotent("A", "route", "fail", "body", execute),
    ).toEqual({ count: 2 });
  });
  it("separates consent subjects and appends withdrawal", async () => {
    const store = new MemoryStore();
    await store.appendConsent("A", [
      { purpose: "analytics", decision: "grant", version: "v1", at: 1 },
    ]);
    expect(await store.consents("B")).toEqual([]);
    await store.appendConsent("A", [
      { purpose: "analytics", decision: "withdraw", version: "v1", at: 2 },
    ]);
    expect(await store.consents("A")).toHaveLength(2);
  });
});
describe("Authenticated field encryption", () => {
  it("roundtrips and fails on wrong context tampering or bad key", () => {
    const key = randomBytes(32).toString("base64url"),
      cipher = encrypt({ value: "fixture" }, key, "A");
    expect(decrypt(cipher, key, "A")).toEqual({ value: "fixture" });
    expect(() => decrypt(cipher, key, "B")).toThrow();
    cipher[cipher.length - 1] = (cipher[cipher.length - 1] ?? 0) ^ 1;
    expect(() => decrypt(cipher, key, "A")).toThrow();
    expect(() => encrypt({}, "short", "A")).toThrow();
    expect(() => decrypt(Buffer.from([0]), key, "A")).toThrow();
  });
});
