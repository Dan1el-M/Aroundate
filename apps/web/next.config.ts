import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  logging: { incomingRequests: false },
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  experimental: { serverActions: { bodySizeLimit: "64kb" } },
};
export default config;
