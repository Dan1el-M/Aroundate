import { randomBytes } from "node:crypto";
import { z } from "zod";
const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  WEB_ORIGIN: z.url().default("http://127.0.0.1:3000"),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  DATA_ENCRYPTION_KEY: z.string().optional(),
  OIDC_ISSUER: z.url().optional(),
  OIDC_AUDIENCE: z.string().default("aroundate-api"),
});
export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const sanitized = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value !== ""),
  );
  const parsed = environmentSchema.parse(sanitized);
  if (parsed.NODE_ENV === "production" && parsed.APP_MODE === "sandbox")
    throw new Error("Sandbox is forbidden in production");
  const secret =
    parsed.SESSION_SECRET ??
    (parsed.NODE_ENV !== "production"
      ? randomBytes(32).toString("base64url")
      : "");
  if (Buffer.from(secret, "base64url").length < 32)
    throw new Error("SESSION_SECRET must contain at least 256 random bits");
  if (
    parsed.APP_MODE === "live" &&
    (!parsed.DATABASE_URL || !parsed.OIDC_ISSUER || !parsed.DATA_ENCRYPTION_KEY)
  )
    throw new Error(
      "Live mode requires database, identity and encryption configuration",
    );
  if (parsed.NODE_ENV === "production") {
    if (
      !parsed.WEB_ORIGIN.startsWith("https://") ||
      !parsed.OIDC_ISSUER?.startsWith("https://") ||
      !parsed.DATABASE_URL?.includes("sslmode=verify-full")
    )
      throw new Error("Production TLS configuration required");
    for (const key of [
      "CONTROLLER_LEGAL_NAME",
      "CONTROLLER_EMAIL",
      "SECURITY_CONTACT",
    ])
      if (!env[key]) throw new Error(`Production requires ${key}`);
  }
  return { ...parsed, secret };
}
