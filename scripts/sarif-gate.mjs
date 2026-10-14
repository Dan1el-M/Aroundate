import { readFile, readdir } from "node:fs/promises";
const folder = process.argv[2];
if (!folder) throw new Error("Provide SARIF folder");
const files = (await readdir(folder)).filter((file) => file.endsWith(".sarif"));
if (!files.length) throw new Error("Missing SAST evidence");
let findings = 0;
for (const file of files) {
  const sarif = JSON.parse(await readFile(`${folder}/${file}`, "utf8"));
  for (const run of sarif.runs ?? [])
    for (const result of run.results ?? [])
      if (result.level !== "note" && result.level !== "none") findings++;
}
if (findings) throw new Error(`Blocking SAST findings: ${findings}`);
console.log("SARIF gate passed");
