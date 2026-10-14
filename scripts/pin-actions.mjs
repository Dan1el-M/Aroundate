import { mkdir, writeFile } from "node:fs/promises";
const targets = [
  ["actions/checkout", "v4"],
  ["actions/setup-node", "v4"],
  ["actions/upload-artifact", "v4"],
  ["github/codeql-action", "v3"],
  ["aquasecurity/trivy-action", "latest"],
];
const pins = {};
for (const [repo, requested] of targets) {
  let tag = requested;
  if (tag === "latest") {
    const release = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
    );
    if (!release.ok) throw new Error("Release lookup failed");
    tag = (await release.json()).tag_name;
  }
  const response = await fetch(
    `https://api.github.com/repos/${repo}/git/ref/tags/${tag}`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!response.ok)
    throw new Error(`Action lookup ${repo}: ${response.status}`);
  let object = (await response.json()).object;
  while (object.type === "tag") {
    const nested = await fetch(
      `https://api.github.com/repos/${repo}/git/tags/${object.sha}`,
    );
    if (!nested.ok) throw new Error("Annotated tag lookup failed");
    object = (await nested.json()).object;
  }
  if (!object.sha.match(/^[0-9a-f]{40}$/) || object.type !== "commit")
    throw new Error("Invalid action SHA");
  pins[repo] = { sha: object.sha, tag, checked_at: new Date().toISOString() };
}
await mkdir("infra", { recursive: true });
await writeFile(
  "infra/actions.lock.json",
  JSON.stringify(pins, null, 2) + "\n",
);
console.log(JSON.stringify(pins));
