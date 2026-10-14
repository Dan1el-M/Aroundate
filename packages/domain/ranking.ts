export const CRITERIA = [
  "price",
  "distance",
  "type_match",
  "rating",
  "popularity",
] as const;
export type Criterion = (typeof CRITERIA)[number];
export type Strategy = "lexicographic" | "weighted";
export interface RankCandidate {
  id: string;
  utilities: Record<Criterion, number | null>;
}
export interface RankedCandidate extends RankCandidate {
  score: number;
  known: number;
  rank: number;
  contributions: Record<Criterion, number>;
}
export function fullPriority(input: readonly Criterion[]): Criterion[] {
  if (
    !input.length ||
    input.some((key) => !CRITERIA.includes(key)) ||
    new Set(input).size !== input.length
  )
    throw new Error("Invalid priority");
  return [...input, ...CRITERIA.filter((key) => !input.includes(key))];
}
export function rank(
  candidates: readonly RankCandidate[],
  priority: readonly Criterion[],
  strategy: Strategy,
): RankedCandidate[] {
  const order = fullPriority(priority);
  if (!["lexicographic", "weighted"].includes(strategy))
    throw new Error("Invalid strategy");
  if (
    new Set(candidates.map((candidate) => candidate.id)).size !==
    candidates.length
  )
    throw new Error("Duplicate candidate");
  const quantize = (value: number | null) => {
    if (value === null) return 0;
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new Error("Invalid utility");
    return Math.floor(value * 1_000_000 + 0.5);
  };
  const results = candidates.map((candidate) => {
    const contributions = Object.fromEntries(
      order.map((key, index) => [
        key,
        quantize(candidate.utilities[key]) * (5 - index),
      ]),
    ) as Record<Criterion, number>;
    return {
      ...candidate,
      utilities: { ...candidate.utilities },
      contributions,
      score: Object.values(contributions).reduce(
        (sum, value) => sum + value,
        0,
      ),
      known: order.filter((key) => candidate.utilities[key] !== null).length,
      rank: 0,
    };
  });
  results.sort((a, b) => {
    if (strategy === "weighted") {
      const difference = b.score - a.score || b.known - a.known;
      if (difference) return difference;
    }
    for (const key of order) {
      const knownDifference =
        Number(b.utilities[key] !== null) - Number(a.utilities[key] !== null);
      const difference =
        knownDifference ||
        quantize(b.utilities[key]) - quantize(a.utilities[key]);
      if (difference) return difference;
    }
    return a.id < b.id ? -1 : 1;
  });
  return results.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  for (const point of [a, b])
    if (
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      Math.abs(point.latitude) > 90 ||
      Math.abs(point.longitude) > 180
    )
      throw new Error("Invalid coordinate");
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitude = radians(b.latitude - a.latitude);
  const longitude = radians(b.longitude - a.longitude);
  const value = Math.min(
    1,
    Math.max(
      0,
      Math.sin(latitude / 2) ** 2 +
        Math.cos(radians(a.latitude)) *
          Math.cos(radians(b.latitude)) *
          Math.sin(longitude / 2) ** 2,
    ),
  );
  return 2 * 6371.0088 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
