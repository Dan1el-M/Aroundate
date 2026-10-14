import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
const secret =
  process.env.SESSION_SECRET || randomBytes(32).toString("base64url");
const env = {
  ...process.env,
  NODE_ENV: "development",
  APP_MODE: process.env.APP_MODE || "sandbox",
  SESSION_SECRET: secret,
  WEB_ORIGIN: process.env.WEB_ORIGIN || "http://127.0.0.1:3000",
  API_INTERNAL_ORIGIN:
    process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:3001",
  NEXT_TELEMETRY_DISABLED: "1",
};
mkdirSync(".runtime", { recursive: true });
const children = [
  spawn(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "apps/api/src/main.ts"],
    { env, stdio: "inherit" },
  ),
  spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "apps/web",
      "--hostname",
      "127.0.0.1",
      "--webpack",
    ],
    { env, stdio: "inherit" },
  ),
];
const stop = () => {
  children.forEach((child) => child.kill());
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
children.forEach((child) =>
  child.on("exit", (code) => {
    stop();
    process.exitCode = code || 0;
  }),
);
