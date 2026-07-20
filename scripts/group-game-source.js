"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const MANIFEST = path.join(SRC, "build-order.json");
const TEMP = path.join(ROOT, ".src-grouped");
const MAX_LINES = 320;

function lineCount(source) {
  return source.match(/.*(?:\n|$)/g)?.filter(Boolean).length || 0;
}

function domainOf(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  return path.posix.dirname(normalized.replace(/^src\//, ""));
}

function slug(domain) {
  return domain.split("/").pop().replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function main() {
  const order = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const groups = [];

  for (const relativePath of order) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
    const domain = domainOf(relativePath);
    const lines = lineCount(source);
    const previous = groups.at(-1);
    if (previous && previous.domain === domain && previous.lines + lines <= MAX_LINES) {
      previous.source += source;
      previous.lines += lines;
      previous.inputs.push(relativePath);
    } else {
      groups.push({ domain, source, lines, inputs: [relativePath] });
    }
  }

  fs.rmSync(TEMP, { recursive: true, force: true });
  fs.mkdirSync(TEMP, { recursive: true });
  const counters = new Map();
  const groupedOrder = [];

  for (const group of groups) {
    const count = (counters.get(group.domain) || 0) + 1;
    counters.set(group.domain, count);
    const relativePath = path.posix.join("src", group.domain, `${slug(group.domain)}-${String(count).padStart(2, "0")}.part.js`);
    const target = path.join(TEMP, relativePath.replace(/^src\//, ""));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, group.source);
    groupedOrder.push(relativePath);
  }

  for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
    if (["README.md", "main.js", "build-order.json"].includes(entry.name)) continue;
    fs.rmSync(path.join(SRC, entry.name), { recursive: true, force: true });
  }

  for (const entry of fs.readdirSync(TEMP, { withFileTypes: true })) {
    fs.cpSync(path.join(TEMP, entry.name), path.join(SRC, entry.name), { recursive: true });
  }
  fs.rmSync(TEMP, { recursive: true, force: true });
  fs.writeFileSync(MANIFEST, `${JSON.stringify(groupedOrder, null, 2)}\n`);

  console.log(`Fonte compactada de ${order.length} para ${groupedOrder.length} fragmentos.`);
}

main();
