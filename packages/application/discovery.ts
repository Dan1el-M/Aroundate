import { createHmac, timingSafeEqual } from "node:crypto";
import type { SearchRequest } from "../contracts/index.js";
import { CRITERIA, distanceKm, fullPriority, rank } from "../domain/ranking.js";
import { TAXONOMIES, type Place } from "../catalog/seed.js";
export interface CatalogRepository {
  all(): Promise<Place[]>;
  byId(id: string): Promise<Place | undefined>;
  taxonomies(): Promise<typeof TAXONOMIES>;
}
export class DiscoveryError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export function normalize(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}
export function textMatches(text: string, query: string): boolean {
  const haystack = normalize(text);
  const needle = normalize(query.trim());
  if (!needle || haystack.includes(needle)) return true;
  return needle.split(/\s+/).every((token) =>
    haystack.split(/\W+/).some((word) => {
      if (token.length < 4 || Math.abs(word.length - token.length) > 1)
        return false;
      const rows = Array.from({ length: word.length + 1 }, (_, index) => index);
      for (let i = 1; i <= token.length; i++) {
        let previous = rows[0] ?? 0;
        rows[0] = i;
        for (let j = 1; j <= word.length; j++) {
          const next = rows[j] ?? 0;
          rows[j] = Math.min(
            (rows[j] ?? 0) + 1,
            (rows[j - 1] ?? 0) + 1,
            previous + Number(token[i - 1] !== word[j - 1]),
          );
          previous = next;
        }
      }
      return (rows.at(-1) ?? Infinity) <= 1;
    }),
  );
}
export const isOpen = (place: Place, now: Date): boolean | null => {
  if (!place.hours) return null;
  const hour = Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "America/Costa_Rica",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  return hour >= place.hours.start && hour < place.hours.end;
};
export const sourceEvidence = (now: Date) => ({
  source: "aroundate" as const,
  source_url: null,
  author_display_name: "Aroundate sandbox",
  published_at: "2026-10-14T00:00:00Z",
  observed_at: now.toISOString(),
  license_policy: "fictional-editorial-fixtures-v1",
});
export async function discover(
  repository: CatalogRepository,
  query: SearchRequest,
  secret: string,
  now = new Date(),
) {
  if (query.center.kind === "address")
    throw new DiscoveryError(503, "geocoding_disabled");
  if (query.center.kind === "city" && query.center.city_id !== "san-jose")
    throw new DiscoveryError(422, "unknown_city");
  const center =
    query.center.kind === "coordinates"
      ? query.center.coordinates
      : { latitude: 9.9325, longitude: -84.0796 };
  const taxonomies = await repository.taxonomies();
  const radius = query.filters.radius_km;
  const categories = new Set(query.filters.categories);
  const descendants = (root: string) => {
    const values = new Set([root]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const entry of taxonomies.categories)
        if (
          entry.parent_id &&
          values.has(entry.parent_id) &&
          !values.has(entry.id)
        ) {
          values.add(entry.id);
          changed = true;
        }
    }
    return values;
  };
  for (const root of query.filters.categories)
    for (const id of descendants(root)) categories.add(id);
  const all = await repository.all();
  const admitted = all
    .map((place) => ({ place, distance: distanceKm(center, place) }))
    .filter(({ place, distance }) => {
      const f = query.filters;
      const money = place.prices[f.price?.currency ?? "CRC"];
      const names = [...taxonomies.cuisines, ...taxonomies.categories]
        .filter((entry) =>
          [...place.cuisines, ...place.categories].includes(entry.id),
        )
        .map((entry) => `${entry.es} ${entry.en}`)
        .join(" ");
      return (
        textMatches(
          `${place.name} ${place.description.es} ${place.description.en} ${names}`,
          query.q,
        ) &&
        distance <= radius &&
        (!categories.size ||
          place.categories.some((id) => categories.has(id))) &&
        (!f.cuisines.length ||
          f.cuisines.some((id) => place.cuisines.includes(id))) &&
        f.accessibility.every((id) => place.accessibility.includes(id)) &&
        f.dietary.every((id) => place.dietary.includes(id)) &&
        f.tags.every((id) => place.tags.includes(id)) &&
        (!f.open_now || isOpen(place, now) === true) &&
        (f.min_rating === undefined ||
          (f.rating_source === "aroundate" &&
            place.rating !== null &&
            place.rating >= f.min_rating)) &&
        (!f.price?.levels?.length ||
          (place.priceLevel !== null &&
            f.price.levels.includes(place.priceLevel))) &&
        (f.price?.min_amount === undefined ||
          (money !== undefined && money >= Number(f.price.min_amount))) &&
        (f.price?.max_amount === undefined ||
          (money !== undefined && money <= Number(f.price.max_amount)))
      );
    })
    .slice(0, 200);
  const candidates = admitted.map(({ place, distance }) => {
    const filters = query.filters;
    let price = place.priceLevel === null ? null : 1 - place.priceLevel / 4;
    if (
      filters.price?.min_amount !== undefined ||
      filters.price?.max_amount !== undefined
    ) {
      const amount = place.prices[filters.price.currency];
      const floor = Number(filters.price.min_amount ?? 0);
      const cap = Number(
        filters.price.max_amount ??
          (filters.price.currency === "CRC" ? 50000 : 100),
      );
      price =
        amount === undefined
          ? null
          : cap === floor
            ? 1
            : 1 - Math.min(1, Math.max(0, (amount - floor) / (cap - floor)));
    }
    return {
      id: place.id,
      utilities: {
        price,
        distance: 1 - distance / radius,
        type_match: filters.cuisines.length
          ? filters.cuisines.filter((id) => place.cuisines.includes(id))
              .length / filters.cuisines.length
          : filters.categories.length
            ? filters.categories.filter((id) =>
                place.categories.some((category) =>
                  descendants(id).has(category),
                ),
              ).length / filters.categories.length
            : 1,
        rating:
          filters.rating_source === "aroundate" && place.rating !== null
            ? place.rating / 5
            : null,
        popularity: null,
      },
    };
  });
  const ranked = rank(candidates, query.priority, query.strategy);
  const fingerprint = createHmac("sha256", secret)
    .update(
      JSON.stringify({ ...query, cursor: undefined, page_size: undefined }),
    )
    .update(
      JSON.stringify(
        ranked.map((entry) => ({ id: entry.id, utilities: entry.utilities })),
      ),
    )
    .digest("base64url");
  let offset = 0;
  if (query.cursor) {
    const [payload, signature] = query.cursor.split(".");
    const expected = createHmac("sha256", secret)
      .update(payload ?? "")
      .digest("base64url");
    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      throw new DiscoveryError(422, "invalid_cursor");
    let decoded: { fingerprint: string; offset: number; expires: number };
    try {
      decoded = JSON.parse(Buffer.from(payload ?? "", "base64url").toString());
    } catch {
      throw new DiscoveryError(422, "invalid_cursor");
    }
    if (
      !Number.isInteger(decoded.offset) ||
      decoded.offset < 0 ||
      decoded.offset > 200
    )
      throw new DiscoveryError(422, "invalid_cursor");
    if (decoded.fingerprint !== fingerprint || decoded.expires < now.getTime())
      throw new DiscoveryError(409, "restart_required");
    offset = decoded.offset;
  }
  const selected = ranked.slice(offset, offset + query.page_size);
  const next = offset + selected.length;
  const cursorPayload = Buffer.from(
    JSON.stringify({
      fingerprint,
      offset: next,
      expires: now.getTime() + 300000,
    }),
  ).toString("base64url");
  return {
    items: selected.map((entry) => {
      const candidate = admitted.find((value) => value.place.id === entry.id)!;
      const place = candidate.place;
      return {
        ...place,
        distance_km: candidate.distance,
        open_now: isOpen(place, now),
        rating_source: "aroundate",
        demo: true,
        rank: {
          ordinal: entry.rank,
          strategy: query.strategy,
          algorithm_version: "aroundate-rank-v1",
          full_priority: fullPriority(query.priority),
          weighted_numerator: entry.score,
          facts: CRITERIA.map((criterion) => ({
            criterion,
            known: entry.utilities[criterion] !== null,
            value: entry.utilities[criterion],
            utility_micros: Math.round(
              (entry.utilities[criterion] ?? 0) * 1000000,
            ),
            raw_weight: 5 - fullPriority(query.priority).indexOf(criterion),
            weighted_numerator: entry.contributions[criterion],
          })),
          warnings: [
            { code: "popularity_unknown", message: "No verified visits." },
          ],
        },
        provenance: [sourceEvidence(now)],
      };
    }),
    next_cursor:
      next < ranked.length
        ? `${cursorPayload}.${createHmac("sha256", secret).update(cursorPayload).digest("base64url")}`
        : null,
    candidate_count: ranked.length,
    candidate_scope: "Fictional sandbox catalog only",
    truncated: admitted.length >= 200,
    evaluated_at: now.toISOString(),
    warnings: [
      {
        code: "sandbox_only",
        message: "Illustrative data; not real places or external ratings.",
      },
    ],
  };
}
