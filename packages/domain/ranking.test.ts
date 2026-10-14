import { describe, it, expect } from "vitest";
import {
  CRITERIA,
  fullPriority,
  rank,
  distanceKm,
  type RankCandidate,
  type Criterion,
  type Strategy,
} from "./ranking.js";
const candidate = (
  id: string,
  values: Partial<RankCandidate["utilities"]> = {},
): RankCandidate => ({
  id,
  utilities: {
    price: null,
    distance: null,
    type_match: null,
    rating: null,
    popularity: null,
    ...values,
  },
});
describe("Deterministic ranking strategies", () => {
  const fixtures = [
    candidate("A", { price: 0.75, distance: 0.8, type_match: 1, rating: 0.8 }),
    candidate("B", { price: 0.5, distance: 0.9, type_match: 1, rating: 0.96 }),
    candidate("C", { price: 0.75, distance: 0.6, type_match: 1, rating: 0.9 }),
  ];
  it("matches approved worked vector without mutating input", () => {
    const before = structuredClone(fixtures);
    expect(rank(fixtures, CRITERIA, "lexicographic").map((p) => p.id)).toEqual([
      "A",
      "C",
      "B",
    ]);
    const weighted = rank(fixtures, CRITERIA, "weighted");
    expect(weighted.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(weighted.map((p) => p.score)).toEqual([
      11550000, 11020000, 10950000,
    ]);
    expect(fixtures).toEqual(before);
  });
  it("supports empty and single sets", () => {
    expect(rank([], CRITERIA, "weighted")).toEqual([]);
    expect(rank([candidate("A")], CRITERIA, "lexicographic")[0]?.rank).toBe(1);
  });
  it("appends omitted criteria but rejects invalid priorities", () => {
    expect(fullPriority(["rating"])).toEqual([
      "rating",
      "price",
      "distance",
      "type_match",
      "popularity",
    ]);
    expect(() => fullPriority([])).toThrow();
    expect(() => fullPriority(["price", "price"])).toThrow();
    expect(() => fullPriority(["unknown" as Criterion])).toThrow();
  });
  it.each(["lexicographic", "weighted"] as const)(
    "%s distinguishes known zero and unknown and uses IDs for ties",
    (strategy) => {
      expect(
        rank(
          [candidate("B"), candidate("A"), candidate("Z", { price: 0 })],
          CRITERIA,
          strategy,
        ).map((p) => p.id),
      ).toEqual(["Z", "A", "B"]);
      expect(
        rank(
          [candidate("Z", { price: 1 }), candidate("A", { price: 1 })],
          CRITERIA,
          strategy,
        ).map((p) => p.id),
      ).toEqual(["A", "Z"]);
    },
  );
  it("weighted completeness precedes lexicographic keys on equal scores", () => {
    const one = candidate("A", { price: 0.2 });
    const two = candidate("B", { rating: 0.5, popularity: 0 });
    expect(rank([one, two], CRITERIA, "weighted").map((p) => p.id)).toEqual([
      "B",
      "A",
    ]);
  });
  it("rejects duplicate IDs invalid strategy and invalid numeric facts", () => {
    expect(() =>
      rank([candidate("A"), candidate("A")], CRITERIA, "weighted"),
    ).toThrow();
    expect(() => rank([], CRITERIA, "other" as Strategy)).toThrow();
    for (const price of [NaN, Infinity, -0.1, 1.1])
      expect(() =>
        rank([candidate("A", { price })], CRITERIA, "weighted"),
      ).toThrow();
  });
  it("is stable for all permutations and changed priorities", () => {
    const permutations = [
      fixtures,
      [...fixtures].reverse(),
      [fixtures[1]!, fixtures[2]!, fixtures[0]!],
    ];
    for (const strategy of ["lexicographic", "weighted"] as const) {
      const expected = rank(fixtures, CRITERIA, strategy);
      for (const input of permutations)
        expect(rank(input, CRITERIA, strategy)).toEqual(expected);
    }
    expect(
      rank(fixtures, ["distance"], "lexicographic").map((p) => p.id),
    ).toEqual(["B", "A", "C"]);
  });
  it("normalizes exact endpoints and submicro rounding", () => {
    expect(
      rank(
        [
          candidate("A", { price: 0, distance: 1 }),
          candidate("B", { price: 0.00000049 }),
          candidate("C", { price: 0.0000005 }),
        ],
        CRITERIA,
        "lexicographic",
      ).map((p) => p.id),
    ).toEqual(["C", "A", "B"]);
  });
  it("sorts equal facts from already sorted input", () => {
    expect(
      rank([candidate("A"), candidate("Z")], CRITERIA, "weighted").map(
        (p) => p.id,
      ),
    ).toEqual(["A", "Z"]);
  });
});
describe("Great-circle distance", () => {
  it("handles same poles antimeridian and antipodes", () => {
    expect(
      distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }),
    ).toBe(0);
    expect(
      distanceKm(
        { latitude: 0, longitude: 179.9 },
        { latitude: 0, longitude: -179.9 },
      ),
    ).toBeCloseTo(22.239, 2);
    expect(
      distanceKm(
        { latitude: 90, longitude: 0 },
        { latitude: 90, longitude: 180 },
      ),
    ).toBeCloseTo(0, 5);
    expect(
      distanceKm(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 180 },
      ),
    ).toBeCloseTo(20015.114, 2);
  });
  it.each([
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: 181 },
    { latitude: NaN, longitude: 0 },
    { latitude: 0, longitude: Infinity },
  ])("rejects invalid point", (point) => {
    expect(() => distanceKm(point, { latitude: 0, longitude: 0 })).toThrow();
    expect(() => distanceKm({ latitude: 0, longitude: 0 }, point)).toThrow();
  });
});
