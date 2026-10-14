import pg from "pg";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const connectionString = process.env.MIGRATION_DATABASE_URL;
if (!connectionString)
  throw new Error("Set MIGRATION_DATABASE_URL; app role cannot run DDL");
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(84541014)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS public.schema_migrations(version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
  );
  const applied = (
    await client.query<{ version: string; checksum: string }>(
      "SELECT version,checksum FROM public.schema_migrations ORDER BY version",
    )
  ).rows;
  const filenames = (await readdir("db/migrations"))
    .filter((name) => name.endsWith(".up.sql"))
    .sort();
  for (const filename of filenames) {
    const version = filename.replace(".up.sql", "");
    const sql = await readFile(`db/migrations/${filename}`, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = applied.find((migration) => migration.version === version);
    if (existing && existing.checksum !== checksum)
      throw new Error(`Changed applied migration: ${version}`);
    if (process.argv[2] === "down" || existing) continue;
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO public.schema_migrations(version,checksum) VALUES($1,$2)",
        [version, checksum],
      );
      await client.query("COMMIT");
      console.log(`Applied ${version}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  if (process.argv[2] === "down") {
    if (process.env.NODE_ENV === "production")
      throw new Error("Production down migration forbidden; follow runbook");
    const latest = applied.at(-1);
    if (latest) {
      await client.query("BEGIN");
      try {
        await client.query(
          await readFile(`db/migrations/${latest.version}.down.sql`, "utf8"),
        );
        await client.query(
          "DELETE FROM public.schema_migrations WHERE version=$1",
          [latest.version],
        );
        await client.query("COMMIT");
        console.log(`Reverted ${latest.version}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(84541014)");
  await client.end();
}
