import { writeFile, mkdir } from "node:fs/promises";
const images = [
  ["node", "registry-1.docker.io", "library/node", "24-alpine"],
  ["postgres", "registry-1.docker.io", "postgis/postgis", "17-3.5"],
  ["redis", "registry-1.docker.io", "library/redis", "8-alpine"],
  ["keycloak", "quay.io", "keycloak/keycloak", "latest"],
];
const pins = {};
for (const [name, registry, repo, tag] of images) {
  const url = `https://${registry}/v2/${repo}/manifests/${tag}`;
  const headers = {
    Accept:
      "application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json",
  };
  let response = await fetch(url, { headers });
  if (response.status === 401) {
    const challenge = response.headers.get("www-authenticate") ?? "";
    const realm = challenge.match(/realm="([^"]+)"/)?.[1];
    if (
      !realm ||
      !["auth.docker.io", "quay.io"].includes(new URL(realm).hostname)
    )
      throw new Error("Unexpected auth host");
    const auth = new URL(realm);
    for (const key of ["service", "scope"]) {
      const value = challenge.match(new RegExp(`${key}="([^"]+)"`))?.[1];
      if (value) auth.searchParams.set(key, value);
    }
    const tokenResponse = await fetch(auth);
    if (!tokenResponse.ok) throw new Error("Registry auth failed");
    const tokens = await tokenResponse.json();
    response = await fetch(url, {
      headers: {
        ...headers,
        Authorization: `Bearer ${tokens.token ?? tokens.access_token}`,
      },
    });
  }
  if (!response.ok) throw new Error(`Image lookup ${name}: ${response.status}`);
  const digest = response.headers.get("docker-content-digest");
  if (!digest?.match(/^sha256:[a-f0-9]{64}$/))
    throw new Error("Invalid image digest");
  const image = `${registry === "registry-1.docker.io" ? "docker.io" : registry}/${repo}:${tag}@${digest}`;
  pins[name] = { image, checked_at: new Date().toISOString(), source: tag };
}
await mkdir("infra", { recursive: true });
await writeFile("infra/images.lock.json", JSON.stringify(pins, null, 2) + "\n");
await writeFile(
  "infra/images.env",
  Object.entries(pins)
    .map(([name, value]) => `${name.toUpperCase()}_IMAGE=${value.image}`)
    .join("\n") + "\n",
);
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(pins).map(([name, value]) => [name, value.image]),
    ),
  ),
);
