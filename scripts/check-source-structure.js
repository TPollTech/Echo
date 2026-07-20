"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const MANIFEST = path.join(SRC, "build-order.json");
const MAX_LINES = 320;
const REQUIRED_DOMAINS = [
  "core",
  "entities",
  "combat",
  "enemies",
  "bosses",
  "progression",
  "rendering",
  "audio",
  "ui"
];

function fail(message) {
  throw new Error(message);
}

function main() {
  if (!fs.existsSync(path.join(SRC, "main.js"))) fail("src/main.js não existe.");
  if (!fs.existsSync(MANIFEST)) fail("src/build-order.json não existe.");
  for (const domain of REQUIRED_DOMAINS) {
    if (!fs.existsSync(path.join(SRC, domain))) fail(`Domínio ausente: src/${domain}`);
  }

  const order = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  if (!Array.isArray(order) || order.length < 20) fail("A separação gerou poucos fragmentos; revise a classificação.");

  let bossDefinitions = 0;
  let enemyDefinitions = 0;
  let bossMechanics = 0;
  const seen = new Set();

  for (const relativePath of order) {
    if (seen.has(relativePath)) fail(`Fragmento repetido no build-order: ${relativePath}`);
    seen.add(relativePath);
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) fail(`Fragmento ausente: ${relativePath}`);
    const source = fs.readFileSync(absolutePath, "utf8");
    const lineCount = source.split("\n").length;
    if (lineCount > MAX_LINES + 1) fail(`${relativePath} possui ${lineCount} linhas; limite: ${MAX_LINES}.`);
    if (source.includes("const bossTemplates = [")) {
      bossDefinitions += 1;
      if (!relativePath.includes("src/bosses/boss-definitions/")) fail("bossTemplates saiu do módulo de definições de bosses.");
    }
    if (source.includes("const botArchetypes = [")) {
      enemyDefinitions += 1;
      if (!relativePath.includes("src/enemies/archetypes/")) fail("botArchetypes saiu do módulo de arquétipos.");
    }
    if (source.includes("bot.boss && bot.bossTemplate")) {
      bossMechanics += 1;
      if (!relativePath.includes("src/bosses/mechanics/")) fail("Mecânica de boss ficou espalhada fora de src/bosses/mechanics.");
    }
  }

  if (bossDefinitions !== 1) fail(`Esperado um módulo de bossTemplates; encontrados: ${bossDefinitions}.`);
  if (enemyDefinitions !== 1) fail(`Esperado um módulo de botArchetypes; encontrados: ${enemyDefinitions}.`);
  if (bossMechanics < 1) fail("Nenhum fragmento de mecânicas de boss foi identificado.");

  const bundleCheck = spawnSync(process.execPath, [path.join(__dirname, "build-game.js"), "--check"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (bundleCheck.status !== 0) fail(bundleCheck.stderr || bundleCheck.stdout || "Falha ao validar o bundle.");

  console.log(`Estrutura aprovada: ${order.length} fragmentos, todos com até ${MAX_LINES} linhas.`);
}

main();
