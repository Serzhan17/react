// Build helper: lists everything in dist/, injects the list + a content hash into the SW template.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function listFiles(dir, base = "") {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(path.join(dir, entry.name), rel) : [rel];
  });
}

// api/* is cached at runtime (network-first); ping.txt must always hit the network.
const skip = (rel) => rel === "sw.js" || rel === "ping.txt" || rel.startsWith("api/") || rel.endsWith(".map");

export function generateServiceWorker({ root, outDir }) {
  const files = listFiles(outDir).filter((rel) => !skip(rel)).sort();
  const hash = crypto.createHash("sha1");
  for (const rel of files) {
    hash.update(rel);
    hash.update(fs.readFileSync(path.join(outDir, rel)));
  }
  const version = hash.digest("hex").slice(0, 10);
  const urls = files.map((rel) => "/" + rel);

  const template = fs.readFileSync(path.join(root, "sw-src", "sw.template.js"), "utf8");
  const output = template
    .split("__PRECACHE_MANIFEST__")
    .join(JSON.stringify(urls, null, 2))
    .split("__VERSION__")
    .join(version);
  fs.writeFileSync(path.join(outDir, "sw.js"), output);
  return { version, count: urls.length };
}
