import { copyFile, cp, mkdir, rm } from "node:fs/promises";

const outputDir = "dist";
const files = [
  "index.html",
  "style.css",
  "app.js",
  "manifest.webmanifest",
  "service-worker.js"
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(`${outputDir}/icons`, { recursive: true });
await Promise.all(files.map((file) => copyFile(file, `${outputDir}/${file}`)));
await cp("icons", `${outputDir}/icons`, { recursive: true });
