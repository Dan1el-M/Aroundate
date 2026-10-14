import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { fixtureId } from "../packages/catalog/seed.js";
const secret = randomBytes(32).toString("base64url"),
  base = "http://127.0.0.1:3101";
let child: ChildProcess;
const key = Buffer.from(secret, "base64url");
const token = (
  subject: string,
  scopes = "profile:read profile:write saved:read saved:write presets:read presets:write",
) =>
  new SignJWT({ scope: scopes, email_verified: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("aroundate-sandbox")
    .setAudience("aroundate-api")
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
const proof = () =>
  new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("aroundate-purpose")
    .setAudience("aroundate-consent")
    .setSubject("anonymous-fixture")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
async function request(
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
  method = body === undefined ? "GET" : "POST",
) {
  return fetch(`${base}/v1/${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
beforeAll(async () => {
  child = spawn(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "apps/api/src/main.ts"],
    {
      env: {
        ...process.env,
        NODE_ENV: "test",
        APP_MODE: "sandbox",
        API_PORT: "3101",
        SESSION_SECRET: secret,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("API startup timeout")),
      15000,
    );
    child.stdout?.on("data", (data) => {
      if (String(data).includes("api_ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    child.stderr?.on("data", (data) => reject(new Error(String(data))));
    child.on("exit", (code) => {
      if (code) reject(new Error(`API exited ${code}`));
    });
  });
}, 20000);
afterAll(() => child?.kill());
describe("Live HTTP sandbox contract and negative authorization", () => {
  it("serves bounded search and rejects unknown fields with sanitized Problems", async () => {
    const valid = await request("searches", {
      center: { kind: "city", city_id: "san-jose" },
    });
    expect(valid.status).toBe(200);
    expect((await valid.json()).items.length).toBeGreaterThan(0);
    const invalid = await request("searches", {
      center: { kind: "city", city_id: "san-jose" },
      role: "admin",
    });
    expect(invalid.status).toBe(422);
    expect(invalid.headers.get("Content-Type")).toContain(
      "application/problem+json",
    );
    const problem = await invalid.json();
    expect(problem).not.toHaveProperty("stack");
    expect(problem.correlation_id).toBeTruthy();
  });
  it("returns 401 for absent or forged bearer and 403 for missing scope", async () => {
    expect((await request("me")).status).toBe(401);
    expect(
      (await request("me", undefined, { Authorization: "Bearer forged" }))
        .status,
    ).toBe(401);
    expect(
      (
        await request("me", undefined, {
          Authorization: `Bearer ${await token("A", "saved:read")}`,
        })
      ).status,
    ).toBe(403);
  });
  it("deduplicates preset POST and prevents BOLA by another subject", async () => {
    const auth = {
      Authorization: `Bearer ${await token("A")}`,
      "Idempotency-Key": randomUUID(),
    };
    const body = {
      name: "fixture preset",
      search: { center: { kind: "city", city_id: "san-jose" } },
      save_location: false,
    };
    const first = await request("me/presets", body, auth);
    expect(first.status).toBe(201);
    const preset = await first.json();
    const repeat = await request("me/presets", body, auth);
    expect((await repeat.json()).id).toBe(preset.id);
    expect(
      (await request("me/presets", { ...body, name: "changed" }, auth)).status,
    ).toBe(409);
    expect(
      (
        await request(`me/presets/${preset.id}`, undefined, {
          Authorization: `Bearer ${await token("B")}`,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(
          `me/presets/${preset.id}`,
          undefined,
          { Authorization: auth.Authorization, "If-Match": '"2"' },
          "DELETE",
        )
      ).status,
    ).toBe(412);
  });
  it("isolates saved places and validates real place references", async () => {
    const a = { Authorization: `Bearer ${await token("A")}` },
      b = { Authorization: `Bearer ${await token("B")}` };
    expect(
      (await request(`me/saved-places/${fixtureId(101)}`, undefined, a, "PUT"))
        .status,
    ).toBe(200);
    const other = await request("me/saved-places", undefined, b);
    expect((await other.json()).items).toEqual([]);
    expect(
      (await request(`me/saved-places/${fixtureId(999)}`, undefined, a, "PUT"))
        .status,
    ).toBe(404);
  });
  it("logs purpose-specific consent and honors privacy signals", async () => {
    const headers = {
      "X-Purpose-Token": await proof(),
      "Idempotency-Key": randomUUID(),
    };
    const body = {
      policy_version: "2026-10-14",
      choices: [
        { purpose: "analytics", decision: "grant" },
        { purpose: "google_maps", decision: "reject" },
      ],
    };
    const result = await request("consents", body, headers);
    expect(result.status).toBe(200);
    expect(
      (await result.json()).choices.find(
        (choice: { purpose: string }) => choice.purpose === "analytics",
      ).allowed,
    ).toBe(true);
    const gated = await request("consents", undefined, {
      ...headers,
      "Sec-GPC": "1",
    });
    expect(
      (await gated.json()).choices.find(
        (choice: { purpose: string }) => choice.purpose === "analytics",
      ).allowed,
    ).toBe(false);
    expect(
      (await request("consents", body, { "Idempotency-Key": randomUUID() }))
        .status,
    ).toBe(401);
  });
  it("applies strict JSON size cap and invalid JSON Problems", async () => {
    const oversized = await request("searches", { q: "x".repeat(70000) });
    expect(oversized.status).toBe(413);
    const invalid = await fetch(`${base}/v1/searches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid",
    });
    expect(invalid.status).toBe(400);
  });
  it("enforces profile optimistic concurrency without mass assignment", async () => {
    const auth = { Authorization: `Bearer ${await token("C")}` };
    const current = await request("me", undefined, auth);
    expect(current.headers.get("ETag")).toBe('"1"');
    const updated = await request(
      "me",
      { display_name: "Demo" },
      { ...auth, "If-Match": '"1"' },
      "PATCH",
    );
    expect(updated.status).toBe(200);
    expect(
      (
        await request(
          "me",
          { display_name: "Again" },
          { ...auth, "If-Match": '"1"' },
          "PATCH",
        )
      ).status,
    ).toBe(412);
    expect(
      (
        await request(
          "me",
          { role: "admin" },
          { ...auth, "If-Match": '"2"' },
          "PATCH",
        )
      ).status,
    ).toBe(422);
  });
});
