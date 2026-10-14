import { spawnSync } from "node:child_process";
const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_DIST_DIR: ".next-production",
};
for (const args of [
  ["node_modules/typescript/bin/tsc", "-p", "apps/api/tsconfig.json"],
  ["node_modules/next/dist/bin/next", "build", "apps/web", "--webpack"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
