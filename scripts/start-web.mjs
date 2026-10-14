import { spawn } from "node:child_process";
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "apps/web",
    "--hostname",
    "127.0.0.1",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_DIST_DIR: ".next-production",
    },
  },
);
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
