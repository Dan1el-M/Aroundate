import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { discover, textMatches } from "../packages/application/discovery.js";
import { searchSchema, consentSchema } from "../packages/contracts/index.js";
import { SandboxCatalog } from "../apps/api/src/infrastructure/catalog.js";
import { fixtureId } from "../packages/catalog/seed.js";
const secret = randomBytes(32).toString("base64url"),
  repository = new SandboxCatalog();
const query = (patch: Record<string, unknown> = {}) =>
  searchSchema.parse({
    center: { kind: "city", city_id: "san-jose" },
    filters: { radius_km: 50, rating_source: "aroundate" },
    ...patch,
  });
describe("Discovery combinations and privacy-safe cursors", () => {
  it("is bilingual accent insensitive and typo tolerant", () => {
    expect(textMatches("Café italiano", "cafe")).toBe(true);
    expect(textMatches("Jardín de papel", "jardin")).toBe(true);
    expect(textMatches("sushi", "suhsi")).toBe(false);
    expect(textMatches("sushi", "sushi")).toBe(true);
    expect(textMatches("chocolate", "chocolat")).toBe(true);
    expect(textMatches("café", "adventure")).toBe(false);
  });
  it("combines categories cuisines dietary and accessibility with AND semantics", async () => {
    const result = await discover(
      repository,
      query({
        filters: {
          radius_km: 50,
          categories: [fixtureId(1)],
          cuisines: [fixtureId(15)],
          dietary: [fixtureId(24)],
          accessibility: [fixtureId(22)],
        },
      }),
      secret,
    );
    expect(result.items.map((p) => p.id)).toEqual([fixtureId(104)]);
  });
  it("does not treat unknown price or an unavailable Google rating as valid", async () => {
    const result = await discover(
      repository,
      query({
        filters: {
          radius_km: 50,
          price: { currency: "CRC", max_amount: "5500" },
        },
      }),
      secret,
    );
    expect(result.items.some((p) => p.priceLevel === null)).toBe(false);
    expect(result.items.every((p) => (p.prices.CRC ?? Infinity) <= 5500)).toBe(
      true,
    );
    expect(
      (
        await discover(
          repository,
          query({
            filters: { radius_km: 50, min_rating: 4, rating_source: "google" },
          }),
          secret,
        )
      ).items,
    ).toEqual([]);
  });
  it("supports bounded signed cursor pages without encoding a coordinate", async () => {
    const q = query({ page_size: 2 });
    const first = await discover(
      repository,
      q,
      secret,
      new Date("2026-10-14T16:00:00Z"),
    );
    expect(first.next_cursor).toBeTruthy();
    const second = await discover(
      repository,
      { ...q, cursor: first.next_cursor! },
      secret,
      new Date("2026-10-14T16:00:01Z"),
    );
    expect(second.items[0]?.rank.ordinal).toBe(3);
    expect(
      first.items
        .map((p) => p.id)
        .some((id) => second.items.some((p) => p.id === id)),
    ).toBe(false);
    expect(
      Buffer.from(first.next_cursor!.split(".")[0]!, "base64url").toString(),
    ).not.toContain("latitude");
    await expect(
      discover(repository, { ...q, cursor: `${first.next_cursor}x` }, secret),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      discover(
        repository,
        { ...q, q: "changed", cursor: first.next_cursor! },
        secret,
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("rejects unsupported center rather than silently choosing one", async () => {
    await expect(
      discover(
        repository,
        query({ center: { kind: "city", city_id: "unknown" } }),
        secret,
      ),
    ).rejects.toMatchObject({ status: 422 });
    await expect(
      discover(
        repository,
        query({
          center: { kind: "address", address: "fixture", country: "CR" },
        }),
        secret,
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
  it("rejects unknown fields invalid bounds and duplicate criteria/purposes", () => {
    expect(() => query({ unknown: true })).toThrow();
    expect(() => query({ priority: ["price", "price"] })).toThrow();
    expect(() => query({ page_size: 51 })).toThrow();
    expect(() =>
      query({
        filters: {
          price: { currency: "CRC", min_amount: "500", max_amount: "1" },
        },
      }),
    ).toThrow();
    expect(() =>
      consentSchema.parse({
        policy_version: "2026-10-14",
        choices: [
          { purpose: "analytics", decision: "grant" },
          { purpose: "analytics", decision: "withdraw" },
        ],
      }),
    ).toThrow();
  });
});
