import { z } from "zod";
import { CRITERIA } from "../domain/ranking.js";
import { PURPOSES } from "../domain/consent.js";
export const uuidSchema = z.uuid();
export const localeSchema = z.enum(["es-CR", "en"]);
const ids = z
  .array(uuidSchema)
  .max(20)
  .refine((value) => new Set(value).size === value.length, "Duplicate ID");
const money = z.string().regex(/^(0|[1-9][0-9]{0,13})(\.[0-9]{1,4})?$/);
const coordinates = z.strictObject({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(["manual", "geolocation"]),
  accuracy_m: z.number().min(0).max(100000).optional(),
});
export const centerSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("city"),
    city_id: z.string().min(1).max(80),
  }),
  z.strictObject({ kind: z.literal("coordinates"), coordinates }),
  z.strictObject({
    kind: z.literal("address"),
    address: z.string().min(1).max(300),
    country: z.string().regex(/^[A-Z]{2}$/),
  }),
]);
export const filtersSchema = z.strictObject({
  categories: ids.default([]),
  cuisines: ids.default([]),
  price: z
    .strictObject({
      currency: z.enum(["CRC", "USD"]),
      levels: z.array(z.number().int().min(0).max(4)).max(5).optional(),
      min_amount: money.optional(),
      max_amount: money.optional(),
      basis: z.enum(["per_person", "activity"]).optional(),
    })
    .refine(
      (value) =>
        value.min_amount === undefined ||
        value.max_amount === undefined ||
        Number(value.min_amount) <= Number(value.max_amount),
      "Minimum price exceeds maximum",
    )
    .optional(),
  radius_km: z.number().min(0.1).max(50).default(5),
  min_rating: z.number().min(0).max(5).optional(),
  rating_source: z.enum(["google", "aroundate"]).default("google"),
  open_now: z.boolean().default(false),
  accessibility: ids.default([]),
  dietary: ids.default([]),
  tags: ids.default([]),
});
export const searchSchema = z.strictObject({
  q: z.string().max(200).default(""),
  locale: localeSchema.default("es-CR"),
  center: centerSchema,
  filters: filtersSchema.default(() => filtersSchema.parse({})),
  priority: z
    .array(z.enum(CRITERIA))
    .min(1)
    .max(5)
    .refine(
      (value) => new Set(value).size === value.length,
      "Duplicate priority",
    )
    .default([...CRITERIA]),
  strategy: z.enum(["lexicographic", "weighted"]).default("lexicographic"),
  page_size: z.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(8192).optional(),
});
export type SearchRequest = z.infer<typeof searchSchema>;
export const consentSchema = z.strictObject({
  policy_version: z.literal("2026-10-14"),
  choices: z
    .array(
      z.strictObject({
        purpose: z.enum(PURPOSES),
        decision: z.enum(["grant", "reject", "withdraw"]),
      }),
    )
    .min(1)
    .max(6)
    .refine(
      (value) =>
        new Set(value.map((choice) => choice.purpose)).size === value.length,
      "Duplicate purpose",
    ),
});
export const presetSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  search: searchSchema,
  save_location: z.boolean(),
  location_consent_event_id: uuidSchema.optional(),
});
export const profilePatchSchema = z
  .strictObject({
    display_name: z.string().trim().min(1).max(80).optional(),
    locale: localeSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export const reportSchema = z.strictObject({
  target_kind: z.enum(["place", "opinion", "media", "tag", "other"]),
  target_id: z.string().min(1).max(200),
  reason: z.enum([
    "copyright",
    "abuse",
    "inaccurate",
    "suspicious_review",
    "accessibility",
    "other",
  ]),
  details: z.string().min(1).max(3000),
  contact_email: z.email().max(254).optional(),
});
export const dsrSchema = z.strictObject({
  kind: z.enum([
    "access",
    "export",
    "rectification",
    "erasure",
    "restriction",
    "objection",
  ]),
  details: z.string().max(2000).optional(),
});
