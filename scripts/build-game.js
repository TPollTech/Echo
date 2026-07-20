"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "src", "build-order.json");
const OUTPUT = path.join(ROOT, "game.js");

function normalize(value) {
  return String(value).replace(/\r\n/g, "\n");
}

function readBuildOrder() {
  if (!fs.existsSync(MANIFEST)) {
    throw new Error("Fonte modular ausente. Execute: npm run refactor:game");
  }
  const order = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  if (!Array.isArray(order) || !order.length) throw new Error("src/build-order.json está vazio ou inválido.");
  return order;
}

function buildBundle() {
  return readBuildOrder().map((relativePath) => {
    if (typeof relativePath !== "string" || !relativePath.startsWith("src/") || relativePath.includes("..")) {
      throw new Error(`Caminho inválido no build-order: ${relativePath}`);
    }
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`Fragmento ausente: ${relativePath}`);
    return normalize(fs.readFileSync(absolutePath, "utf8"));
  }).join("");
}

function main() {
  const check = process.argv.includes("--check");
  const bundle = buildBundle();
  if (check) {
    const current = fs.existsSync(OUTPUT) ? normalize(fs.readFileSync(OUTPUT, "utf8")) : "";
    if (current !== bundle) {
      throw new Error("game.js divergiu da fonte modular. Execute: npm run build");
    }
    console.log("Bundle sincronizado com src/.");
    return;
  }
  fs.writeFileSync(OUTPUT, bundle);
  console.log(`game.js gerado com ${bundle.split("\n").length} linhas.`);
}

main();
