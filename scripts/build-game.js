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

function validatePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.startsWith("src/") || relativePath.includes("..")) {
    throw new Error(`Caminho inválido no build-order: ${relativePath}`);
  }
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Módulo ausente: ${relativePath}`);
  return absolutePath;
}

function extractSection(relativePath, section) {
  const source = normalize(fs.readFileSync(validatePath(relativePath), "utf8"));
  const start = `/*__ECHO_SECTION:${section}__*/\n`;
  const end = `/*__ECHO_SECTION_END:${section}__*/`;
  const startIndex = source.indexOf(start);
  if (startIndex < 0) throw new Error(`Seção ${section} ausente em ${relativePath}.`);
  const contentStart = startIndex + start.length;
  const endIndex = source.indexOf(end, contentStart);
  if (endIndex < 0) throw new Error(`Fim da seção ${section} ausente em ${relativePath}.`);
  return source.slice(contentStart, endIndex);
}

function buildBundle() {
  return readBuildOrder().map((entry) => {
    if (typeof entry === "string") return normalize(fs.readFileSync(validatePath(entry), "utf8"));
    if (!entry || typeof entry !== "object" || typeof entry.path !== "string" || typeof entry.section !== "string") {
      throw new Error("Entrada inválida em src/build-order.json.");
    }
    return extractSection(entry.path, entry.section);
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
