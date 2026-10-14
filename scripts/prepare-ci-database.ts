import pg from "pg";
if (
  process.env.CI !== "true" ||
  process.env.NODE_ENV !== "test" ||
  !process.env.MIGRATION_DATABASE_URL?.startsWith(
    "postgresql://postgres@127.0.0.1:",
  )
)
  throw new Error("Only ephemeral local CI fixture databases are supported");
const client = new pg.Client({
  connectionString: process.env.MIGRATION_DATABASE_URL,
});
await client.connect();
try {
  await client.query("ALTER ROLE aroundate_app LOGIN");
} finally {
  await client.end();
}
