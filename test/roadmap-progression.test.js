"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { isPublicAsset, resolvePublicAsset, validateBrowserAssets } = require("../server/index.js");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("servidor publica os módulos do navegador sem liberar travessia de diretórios", () => {
  assert.equal(isPublicAsset("/core/events.js"), true);
  assert.equal(isPublicAsset("/src/progression/levels.js"), true);
  assert.equal(isPublicAsset("/audio/theme.ogg"), true);
  assert.equal(isPublicAsset("/server/database.js"), false);
  assert.equal(resolvePublicAsset("/../../etc/passwd"), null);
  assert.doesNotThrow(() => validateBrowserAssets());
});

test("fonte modular inclui progressão compartilhada, IA de coleta e drops", () => {
  const source = read("src/progression/levels.js");
  for (const token of [
    "LEVEL_CONFIG",
    "maxLevel: 25",
    "gainExperience",
    "applyLevelGrowth",
    "chooseBotResourceTarget",
    "weakestHuntTarget",
    "dropExperienceMotes",
    "scaleBossForRun",
    "BOSS_SIZE_SCALES"
  ]) assert.match(source, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(source, /radiusPerLevel:\s*0\.042/);
  assert.match(source, /moteExperience: Object\.freeze\(\{ cyan: 4, violet: 13/);
});

test("jogador e bots recebem experiência ao coletar fragmentos", () => {
  const playerSource = read("src/entities/mote.js");
  const botSource = read("src/entities/bot.js");
  assert.match(playerSource, /gainExperience\(player, experienceValueForMote/);
  assert.match(botSource, /gainExperience\(bot, experienceValueForMote/);
  assert.match(playerSource, /rareBoostTimer = LEVEL_CONFIG\.rareBoostDuration/);
  assert.match(botSource, /rareBoostTimer = LEVEL_CONFIG\.rareBoostDuration/);
});

test("soundtrack possui sete temas e evita repetição imediata", () => {
  const source = read("src/audio/soundtrack.js");
  const expectedTracks = [
    "signal-drift",
    "glass-current",
    "violet-engine",
    "fracture-run",
    "crownfall",
    "deep-quake",
    "terminal-light"
  ];
  for (const track of expectedTracks) assert.ok(source.includes(track), `faixa ausente: ${track}`);
  assert.match(source, /ids\.filter\(\(id\) => id !== currentId\)/);
  assert.match(source, /bossSoundtrackId/);
  assert.match(source, /rotateAt/);
});

test("ordem de build registra os novos módulos antes de gerar game.js", () => {
  const order = JSON.parse(read("src/build-order.json"));
  const paths = order.map((entry) => entry.path);
  for (const required of [
    "src/progression/levels.js",
    "src/audio/soundtrack.js",
    "src/ui/level-presentation.js"
  ]) assert.ok(paths.includes(required), `${required} não está no build-order`);
});
