import pg from "pg";
import { v7 as uuid } from "uuid";
import { PLACES, TAXONOMIES } from "../packages/catalog/seed.js";
if (process.env.NODE_ENV === "production")
  throw new Error("Fictional seeds forbidden in production");
const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
});
if (!process.env.MIGRATION_DATABASE_URL)
  throw new Error("Set MIGRATION_DATABASE_URL");
await client.connect();
try {
  await client.query("BEGIN");
  const license = uuid(),
    provenance = uuid();
  await client.query(
    "INSERT INTO catalog.licenses(id,code,grant_text) VALUES($1,$2,$3) ON CONFLICT(code) DO NOTHING",
    [
      license,
      "fictional-editorial-fixtures-v1",
      "Synthetic fixtures owned by the project; no external content",
    ],
  );
  const licenseId = (
    await client.query<{ id: string }>(
      "SELECT id FROM catalog.licenses WHERE code=$1",
      ["fictional-editorial-fixtures-v1"],
    )
  ).rows[0]!.id;
  await client.query(
    "INSERT INTO catalog.provenance(id,source,author,license_id,observed_at) VALUES($1,$2,$3,$4,$5)",
    [provenance, "sandbox", "Aroundate sandbox", licenseId, new Date()],
  );
  for (const [table, translations, foreign, items] of [
    [
      "categories",
      "category_translations",
      "category_id",
      TAXONOMIES.categories,
    ],
    ["cuisines", "cuisine_translations", "cuisine_id", TAXONOMIES.cuisines],
    ["features", "feature_translations", "feature_id", TAXONOMIES.features],
    ["tags", "tag_translations", "tag_id", TAXONOMIES.tags],
  ] as const) {
    for (const item of items) {
      const columns =
        table === "categories"
          ? "id,slug,parent_id"
          : table === "features"
            ? "id,slug,kind"
            : "id,slug";
      const values =
        table === "categories"
          ? [item.id, item.slug, item.parent_id]
          : table === "features"
            ? [
                item.id,
                item.slug,
                item.slug.includes("options") ? "dietary" : "accessibility",
              ]
            : [item.id, item.slug];
      await client.query(
        `INSERT INTO catalog.${table}(${columns}) VALUES(${values.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT(id) DO NOTHING`,
        values,
      );
      for (const [locale, label] of [
        ["es-CR", item.es],
        ["en", item.en],
      ])
        await client.query(
          `INSERT INTO catalog.${translations}(${foreign},locale,label) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
          [item.id, locale, label],
        );
    }
  }
  for (const place of PLACES) {
    await client.query(
      "INSERT INTO catalog.places(id,name,address,country,timezone,location,description_es,description_en,price_level,provenance_id,search_text,search_es,search_en) VALUES($1,$2,$3,'CR','America/Costa_Rica',ST_SetSRID(ST_MakePoint($4,$5),4326)::geography,$6,$7,$8,$9,lower(unaccent($2)),to_tsvector('spanish',unaccent($2||' '||$6)),to_tsvector('english',unaccent($2||' '||$7))) ON CONFLICT(id) DO NOTHING",
      [
        place.id,
        place.name,
        place.address,
        place.longitude,
        place.latitude,
        place.description.es,
        place.description.en,
        place.priceLevel,
        provenance,
      ],
    );
    for (const [table, column, items] of [
      ["place_categories", "category_id", place.categories],
      ["place_cuisines", "cuisine_id", place.cuisines],
      ["place_tags", "tag_id", place.tags],
    ] as const)
      for (const item of items)
        await client.query(
          `INSERT INTO catalog.${table}(place_id,${column},provenance_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
          [place.id, item, provenance],
        );
    for (const item of [...place.dietary, ...place.accessibility])
      await client.query(
        "INSERT INTO catalog.place_features(place_id,feature_id,value,provenance_id) VALUES($1,$2,true,$3) ON CONFLICT DO NOTHING",
        [place.id, item, provenance],
      );
    for (const [currency, amount] of Object.entries(place.prices))
      await client.query(
        "INSERT INTO catalog.price_observations(id,place_id,amount,currency,basis,provenance_id,observed_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
        [
          uuid(),
          place.id,
          amount,
          currency,
          place.categories.includes(TAXONOMIES.categories[2]!.id)
            ? "activity"
            : "per_person",
          provenance,
          new Date("2026-10-14T00:00:00Z"),
        ],
      );
  }
  await client.query("COMMIT");
  console.log("Seeded fictional taxonomies and places.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
