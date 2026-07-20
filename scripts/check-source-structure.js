"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const MANIFEST = path.join(SRC, "build-order.json");
const MAX_MODULE_LINES = 650;
const MAX_MODULES = 70;
const REQUIRED_FILES = [
  "main.js",
  "core/game-state.js",
  "core/game-loop.js",
  "core/input.js",
  "core/camera.js",
  "core/constants.js",
  "core/random.js",
  "core/events.js",
  "entities/player.js",
  "entities/bot.js",
  "entities/mote.js",
  "entities/effects.js",
  "combat/damage.js",
  "combat/collision.js",
  "combat/trail.js",
  "combat/status-effects.js",
  "enemies/archetypes.js",
  "enemies/enemy-ai.js",
  "enemies/sniper.js",
  "enemies/bulwark.js",
  "enemies/phantom.js",
  "bosses/boss-controller.js",
  "bosses/boss-definitions.js",
  "bosses/mechanics/runtime.js",
  "progression/mutations.js",
  "progression/synergies.js",
  "progression/modifiers.js",
  "progression/skins.js",
  "progression/upgrades.js",
  "rendering/renderer.js",
  "rendering/entities.js",
  "rendering/effects.js",
  "rendering/telegraphs.js",
  "audio/audio-engine.js",
  "audio/music.js",
  "audio/sfx.js",
  "ui/hud.js",
  "ui/menus.js",
  "ui/boss-hud.js",
  "ui/accessibility.js"
];

function fail(message) {
  throw new Error(message);
}

function extractSection(relativePath, section) {
  const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8").replace(/\r\n/g, "\n");
  const start = `/*__ECHO_SECTION:${section}__*/\n`;
  const end = `/*__ECHO_SECTION_END:${section}__*/`;
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) fail(`Seção ${section} inválida em ${relativePath}.`);
  return source.slice(startIndex + start.length, endIndex);
}

function assertRegistryArchitecture() {
  const enemyAi = fs.readFileSync(path.join(SRC, "enemies", "enemy-ai.js"), "utf8");
  const bossRuntime = fs.readFileSync(path.join(SRC, "bosses", "mechanics", "runtime.js"), "utf8");
  if (!enemyAi.includes("const enemyBehaviorRegistry")) fail("Registro de comportamento dos inimigos ausente.");
  if (!enemyAi.includes("function getEnemyBehavior")) fail("Despachante de IA dos inimigos ausente.");
  if (/bot\.archetype\s*===/.test(enemyAi)) fail("enemy-ai.js voltou a decidir comportamento por cadeia de arquétipos.");
  if (!bossRuntime.includes("const bossMechanicRegistry")) fail("Registro de mecânicas dos bosses ausente.");
  if (!bossRuntime.includes("function runBossMechanic")) fail("Despachante de mecânicas dos bosses ausente.");
  if (/bot\.archetype\s*===/.test(bossRuntime)) fail("runtime de bosses voltou a decidir mecânicas por cadeia de arquétipos.");
}

function main() {
  if (!fs.existsSync(MANIFEST)) fail("src/build-order.json não existe.");
  for (const relativePath of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(SRC, relativePath))) fail(`Módulo obrigatório ausente: src/${relativePath}`);
  }

  const order = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  if (!Array.isArray(order) || order.length < 20) fail("A ordem de montagem está vazia ou incompleta.");
  if (!order.every((entry) => entry && typeof entry.path === "string" && typeof entry.section === "string")) {
    fail("O build-order ainda usa fragmentos antigos em vez de seções canônicas.");
  }

  const modulePaths = [...new Set(order.map((entry) => entry.path))];
  if (modulePaths.length > MAX_MODULES) fail(`A arquitetura ainda possui ${modulePaths.length} módulos; limite: ${MAX_MODULES}.`);
  if (modulePaths.some((relativePath) => relativePath.endsWith(".part.js"))) fail("Ainda existem fragmentos .part.js na arquitetura final.");

  for (const relativePath of modulePaths) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) fail(`Módulo ausente: ${relativePath}`);
    const lines = fs.readFileSync(absolutePath, "utf8").split("\n").length;
    if (lines > MAX_MODULE_LINES) fail(`${relativePath} possui ${lines} linhas; limite: ${MAX_MODULE_LINES}.`);
  }

  let bossDefinitions = 0;
  let enemyDefinitions = 0;
  const seenSections = new Set();

  for (const entry of order) {
    const key = `${entry.path}#${entry.section}`;
    if (seenSections.has(key)) fail(`Seção repetida no build-order: ${key}`);
    seenSections.add(key);
    const source = extractSection(entry.path, entry.section);
    if (source.includes("const bossTemplates = [")) {
      bossDefinitions += 1;
      if (entry.path !== "src/bosses/boss-definitions.js") fail("bossTemplates saiu de src/bosses/boss-definitions.js.");
    }
    if (source.includes("const botArchetypes = [")) {
      enemyDefinitions += 1;
      if (entry.path !== "src/enemies/archetypes.js") fail("botArchetypes saiu de src/enemies/archetypes.js.");
    }
  }

  if (bossDefinitions !== 1) fail(`Esperado um bossTemplates; encontrados: ${bossDefinitions}.`);
  if (enemyDefinitions !== 1) fail(`Esperado um botArchetypes; encontrados: ${enemyDefinitions}.`);
  assertRegistryArchitecture();

  const bundleCheck = spawnSync(process.execPath, [path.join(__dirname, "build-game.js"), "--check"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (bundleCheck.status !== 0) fail(bundleCheck.stderr || bundleCheck.stdout || "Falha ao validar o bundle.");

  console.log(`Estrutura aprovada: ${modulePaths.length} módulos canônicos e ${order.length} seções ordenadas.`);
}

main();
