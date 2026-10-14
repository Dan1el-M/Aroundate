import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
if (existsSync(".env"))
  throw new Error(".env already exists; retained without changes");
const app = randomBytes(24).toString("hex"),
  migration = randomBytes(24).toString("hex");
let content = readFileSync(".env.example", "utf8")
  .replace(
    "SESSION_SECRET=",
    "SESSION_SECRET=" + randomBytes(32).toString("base64url"),
  )
  .replace(
    "DATA_ENCRYPTION_KEY=",
    "DATA_ENCRYPTION_KEY=" + randomBytes(32).toString("base64url"),
  )
  .replace("REPLACE_LOCAL_APP_PASSWORD", app)
  .replace("REPLACE_LOCAL_MIGRATION_PASSWORD", migration);
content += `\nPOSTGRES_PASSWORD=${migration}\nAPP_DB_PASSWORD=${app}\nKC_BOOTSTRAP_ADMIN_USERNAME=local-admin\nKC_BOOTSTRAP_ADMIN_PASSWORD=${randomBytes(24).toString("hex")}\n`;
writeFileSync(".env", content, { mode: 0o600 });
console.log(
  "Created untracked local .env with generated secrets. No credentials printed.",
);
