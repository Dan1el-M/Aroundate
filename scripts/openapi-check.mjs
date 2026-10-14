import SwaggerParser from "@apidevtools/swagger-parser";
import { readFile } from "node:fs/promises";
await SwaggerParser.validate("docs/phase-0/openapi.json");
const spec = await SwaggerParser.validate("docs/openapi.json");
const source = await readFile("apps/api/src/main.ts", "utf8"),
  methods = [
    ...source.matchAll(/@(Get|Post|Put|Patch|Delete)\(["']([^"']+)["']\)/g),
  ];
for (const [, method, route] of methods) {
  const path = "/v1/" + route.replace(/:([a-z_]+)/g, "{$1}");
  if (!spec.paths[path]?.[method.toLowerCase()])
    throw new Error(`Shadow endpoint ${path}`);
}
const count = Object.values(spec.paths).reduce(
  (n, path) =>
    n +
    Object.keys(path).filter((key) =>
      ["get", "post", "put", "patch", "delete"].includes(key),
    ).length,
  0,
);
if (count !== methods.length)
  throw new Error("Inventory includes unimplemented operation");
console.log(
  `OpenAPI standards validation passed; ${count} implemented endpoints, no API inventory drift.`,
);
