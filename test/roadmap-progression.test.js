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

test("novos módulos são montados antes do fechamento do runtime", () => {
  const order = JSON.parse(read("src/build-order.json"));
  const closingIndex = order.findIndex((entry) => entry.section === "0113");
  assert.ok(closingIndex >= 0, "seção de fechamento 0113 não encontrada");
  for (const required of [
    "src/progression/levels.js",
    "src/audio/soundtrack.js",
    "src/ui/level-presentation.js"
  ]) {
    const index = order.findIndex((entry) => entry.path === required);
    assert.ok(index >= 0, `${required} não está no build-order`);
    assert.ok(index < closingIndex, `${required} foi montado fora do runtime principal`);
  }

  const bundle = read("game.js");
  const closingPosition = bundle.lastIndexOf("}());");
  assert.ok(closingPosition > 0, "fechamento do runtime ausente no bundle");
  for (const token of ["const LEVEL_CONFIG", "const SOUNDTRACK_LIBRARY", "EchoRunProgression"]) {
    const position = bundle.indexOf(token);
    assert.ok(position >= 0, `${token} ausente do bundle`);
    assert.ok(position < closingPosition, `${token} está fora do runtime principal`);
  }
  assert.equal(bundle.slice(closingPosition + 5).trim(), "", "há código executável após o fechamento do runtime");
});
