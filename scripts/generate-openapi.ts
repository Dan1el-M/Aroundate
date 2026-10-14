import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import {
  searchSchema,
  consentSchema,
  presetSchema,
  profilePatchSchema,
  reportSchema,
  dsrSchema,
} from "../packages/contracts/index.js";
const source = JSON.parse(await readFile("docs/phase-0/openapi.json", "utf8"));
const text = await readFile("apps/api/src/main.ts", "utf8");
const entries = [
  ...text.matchAll(/@(Get|Post|Put|Patch|Delete)\(["']([^"']+)["']\)/g),
];
const paths: Record<string, Record<string, unknown>> = {};
for (const [, verb, route] of entries) {
  const apiPath = "/v1/" + route!.replace(/:([a-z_]+)/g, "{$1}");
  const method = verb!.toLowerCase();
  if (!source.paths[apiPath]?.[method])
    throw new Error(`Undocumented endpoint: ${method} ${apiPath}`);
  paths[apiPath] ??= {};
  paths[apiPath][method] = source.paths[apiPath][method];
}
const schemas = source.components.schemas;
for (const [name, schema] of Object.entries({
  SearchRequest: searchSchema,
  ConsentEventRequest: consentSchema,
  PresetInput: presetSchema,
  ProfilePatch: profilePatchSchema,
  ReportInput: reportSchema,
  DSRInput: dsrSchema,
}))
  schemas[name] = z.toJSONSchema(schema);
const str = { type: "string" },
  num = { type: "number" },
  nullable = (value: unknown) => ({ anyOf: [value, { type: "null" }] }),
  ids = { type: "array", items: str };
const strict = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", additionalProperties: false, properties, required });
const placeProperties = {
  id: str,
  name: str,
  address: str,
  latitude: num,
  longitude: num,
  categories: ids,
  cuisines: ids,
  dietary: ids,
  accessibility: ids,
  tags: ids,
  priceLevel: nullable(num),
  prices: strict({ CRC: num, USD: num }, []),
  rating: nullable(num),
  reviews: num,
  hours: nullable(strict({ start: num, end: num })),
  description: strict({ es: str, en: str }),
  tone: str,
};
schemas.RankFact = strict({
  criterion: str,
  known: { type: "boolean" },
  value: nullable(num),
  utility_micros: num,
  raw_weight: num,
  weighted_numerator: num,
});
schemas.RankExplanation = strict({
  ordinal: num,
  strategy: str,
  algorithm_version: str,
  full_priority: ids,
  weighted_numerator: num,
  facts: { type: "array", items: { $ref: "#/components/schemas/RankFact" } },
  warnings: { type: "array", items: strict({ code: str, message: str }) },
});
schemas.PlaceSummary = strict({
  ...placeProperties,
  distance_km: num,
  open_now: nullable({ type: "boolean" }),
  rating_source: str,
  demo: { type: "boolean" },
  rank: { $ref: "#/components/schemas/RankExplanation" },
  provenance: {
    type: "array",
    items: { $ref: "#/components/schemas/Provenance" },
  },
});
delete schemas.SearchResponse.properties.rating_source;
delete schemas.SearchResponse.properties.correlation_id;
schemas.SearchResponse.required = schemas.SearchResponse.required.filter(
  (value: string) => !["rating_source", "correlation_id"].includes(value),
);
schemas.PlaceDetail = strict({
  ...placeProperties,
  open_now: nullable({ type: "boolean" }),
  source_links: ids,
  provenance: {
    type: "array",
    items: { $ref: "#/components/schemas/Provenance" },
  },
  opinions: { type: "array", items: {} },
  media: { type: "array", items: {} },
  demo: { type: "boolean" },
});
schemas.TaxonomyEntry = strict({
  id: str,
  parent_id: nullable(str),
  slug: str,
  es: str,
  en: str,
});
schemas.ConsentState = strict({
  policy_version: str,
  choices: {
    type: "array",
    items: strict({ purpose: str, allowed: { type: "boolean" } }),
  },
  gpc: { type: "boolean" },
  dnt: { type: "boolean" },
  expires_at: { type: "string", format: "date-time" },
  has_choice: { type: "boolean" },
});
schemas.Profile = strict(
  {
    id: str,
    display_name: nullable(str),
    locale: str,
    verified_account: { type: "boolean" },
    created_at: { type: "string", format: "date-time" },
    version: num,
    email: nullable(str),
  },
  ["id", "display_name", "locale", "verified_account", "created_at", "version"],
);
schemas.Preset.properties.version = { type: "integer", minimum: 1 };
schemas.Preset.required.push("version");
source.paths = paths;
source.info.version = "0.1.0-sandbox";
source.info.description =
  "Implemented sandbox API only. Live startup blocked. Planned full contract remains in docs/phase-0/openapi.json. Additional semantic validation is implemented with Zod.";
source.servers = [
  {
    url: "http://127.0.0.1:3001",
    description: "Local sandbox; no live providers or production service.",
  },
];
source["x-status"] = "Implemented sandbox; Phase 1 and initial Phase 2";
await writeFile("docs/openapi.json", JSON.stringify(source, null, 2) + "\n");
console.log(`Generated ${entries.length} implemented operations`);
