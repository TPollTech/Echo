"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createEchoServer, isPublicAsset, resolvePublicAsset, validateBrowserAssets } = require("../server/index.js");

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

test("servidor responde 200 para os módulos fundamentais que causavam 404", async (context) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "echo-static-"));
  const app = createEchoServer({ databasePath: path.join(temporaryDirectory, "echo.sqlite") });
  context.after(async () => {
    await app.close();
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });
  const address = await app.start(0, "127.0.0.1");
  const port = address.port;
  for (const asset of ["core/events.js", "core/random.js", "core/runtime.js", "core/qa-panel.js"]) {
    const response = await fetch(`http://127.0.0.1:${port}/${asset}`);
    assert.equal(response.status, 200, `${asset} retornou ${response.status}`);
    assert.match(response.headers.get("content-type") || "", /javascript/);
    assert.ok((await response.text()).length > 20, `${asset} retornou conteúdo vazio`);
  }
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

test("soundtrack possui dez temas, estados completos e evita repetição imediata", () => {
  const combatSource = read("src/audio/soundtrack.js");
  const stateSource = read("src/audio/state-soundtrack.js");
  const expectedCombatTracks = [
    "signal-drift",
    "glass-current",
    "violet-engine",
    "fracture-run",
    "crownfall",
    "deep-quake",
    "terminal-light"
  ];
  const expectedStateTracks = ["menu-echo", "victory-rise", "defeat-fall"];
  for (const track of expectedCombatTracks) assert.ok(combatSource.includes(track), `faixa ausente: ${track}`);
  for (const track of expectedStateTracks) assert.ok(stateSource.includes(track), `faixa de estado ausente: ${track}`);
  assert.match(combatSource, /ids\.filter\(\(id\) => id !== currentId\)/);
  assert.match(combatSource, /bossSoundtrackId/);
  assert.match(combatSource, /rotateAt/);
  assert.match(stateSource, /finishSoloWithStateSoundtrack/);
  assert.match(stateSource, /returnToMenuWithStateSoundtrack/);
  assert.match(stateSource, /enableInitialMenuSoundtrack/);
});

test("multiplayer deriva nível visual do placar autoritativo", () => {
  const source = read("src/core/multiplayer-levels.js");
  assert.match(source, /progressionFromScore/);
  assert.match(source, /applyMultiplayerLevelPresentation/);
  assert.match(source, /applyMultiplayerSnapshotWithLevels/);
  assert.match(source, /updateMultiplayerWithLevelPresentation/);
  assert.match(source, /entity\.radius = entity\.multiplayerBaseRadius \* entity\.levelScale/);
});

test("novos módulos são montados antes do fechamento do runtime", () => {
  const order = JSON.parse(read("src/build-order.json"));
  const closingIndex = order.findIndex((entry) => entry.section === "0113");
  assert.ok(closingIndex >= 0, "seção de fechamento 0113 não encontrada");
  for (const required of [
    "src/progression/levels.js",
    "src/audio/soundtrack.js",
    "src/ui/level-presentation.js",
    "src/audio/state-soundtrack.js",
    "src/core/multiplayer-levels.js"
  ]) {
    const index = order.findIndex((entry) => entry.path === required);
    assert.ok(index >= 0, `${required} não está no build-order`);
    assert.ok(index < closingIndex, `${required} foi montado fora do runtime principal`);
  }

  const bundle = read("game.js");
  const closingPosition = bundle.lastIndexOf("}());");
  assert.ok(closingPosition > 0, "fechamento do runtime ausente no bundle");
  for (const token of [
    "const LEVEL_CONFIG",
    "const SOUNDTRACK_LIBRARY",
    "const STATE_SOUNDTRACK_LIBRARY",
    "EchoRunProgression",
    "EchoMultiplayerLevels"
  ]) {
    const position = bundle.indexOf(token);
    assert.ok(position >= 0, `${token} ausente do bundle`);
    assert.ok(position < closingPosition, `${token} está fora do runtime principal`);
  }
  assert.equal(bundle.slice(closingPosition + 5).trim(), "", "há código executável após o fechamento do runtime");
});
