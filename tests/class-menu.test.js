"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("menu concentra preparação e JOGAR inicia sem telas obrigatórias", () => {
  const html = read("index.html");
  const input = read("src/core/input.js");
  for (const tab of ["class", "skin", "abilities", "mode", "settings", "progress"]) {
    assert.match(html, new RegExp(`data-prep-tab="${tab}"`));
    assert.match(html, new RegExp(`data-prep-panel="${tab}"`));
  }
  assert.match(html, /id="character-preview"/);
  assert.match(html, /id="training-mode"/);
  assert.match(html, /id="start-submit"[\s\S]*?<span>JOGAR<\/span>/);
  assert.doesNotMatch(input, /else showLoadoutScreen\(\)/);
  assert.match(input, /else startSoloGame\(\)/);
  assert.match(input, /startTrainingGame\(\)/);
  assert.ok(html.indexOf('data-prep-tab="mode"') < html.indexOf('data-prep-tab="class"'));
  assert.match(html, /class="is-selected" data-prep-tab="mode"/);
  assert.match(html, /class="prep-panel is-active" data-prep-panel="mode"/);
});

test("preferências e fallback local cobrem classe, skin, habilidades, modo e configurações", () => {
  const menu = read("src/menu/main-menu.js");
  assert.match(menu, /const PREPARATION_KEY = "echo\.preparation"/);
  assert.match(menu, /classId: selectedClassId/);
  assert.match(menu, /skinId: getSelectedSkin\(\)\.id/);
  assert.match(menu, /skillIds: selectedSkillIds/);
  assert.match(menu, /difficulty: selectedDifficulty/);
  assert.match(menu, /requestJson\("\/api\/preferences"/);
  assert.match(menu, /activeMode = "training"/);
  assert.doesNotMatch(menu, /saveRun\([^)]*training/);
});

test("HUD expõe classe, nível, recurso, especial e quatro habilidades", () => {
  const html = read("index.html");
  const hud = read("src/ui/hud.js");
  for (const id of ["hud-class-name", "hud-class-level", "hud-resource-name", "hud-resource-value", "hud-resource-fill", "hud-class-special", "class-special-button"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(hud, /function updateClassHud\(/);
  assert.match(read("src/combat/active-skills.js"), /selectedSkillIds/);
});

test("textos de preparação usam nomes diretos e progresso separado", () => {
  const html = read("index.html");
  const menu = read("src/menu/main-menu.js");
  for (const forbidden of ["OFICINA DE FREQUÊNCIAS", "OFICINA DE MUTAÇÕES", "CONFIGURAR MUTAÇÕES DA RUN", "RUPTURAS"]) {
    assert.doesNotMatch(html, new RegExp(forbidden));
  }
  assert.match(html, /MELHORIAS PERMANENTES/);
  assert.match(html, /id="challenge-progress-grid"/);
  assert.match(menu, /RECOMPENSA RECEBIDA/);
  assert.match(menu, /ELIMINAÇÕES/);
});

test("skins usam o mesmo registro e desenho principal no mobile e desktop", () => {
  const skinSystem = require("../shared/skin-definitions.js");
  const renderer = read("src/rendering/entities.js");
  const skinRenderer = read("src/rendering/player-skins.js");
  const html = read("index.html");
  assert.equal(skinSystem.SKIN_DEFINITIONS.length, 10);
  assert.equal(new Set(skinSystem.SKIN_DEFINITIONS.map((skin) => skin.style)).size, 10);
  assert.match(renderer, /if \(!MOBILE_QUALITY\)/);
  assert.match(renderer, /drawPlayerSkin\(entity, radius, renderHue, time\)/);
  assert.doesNotMatch(renderer, /isPlayer && !spectral && !MOBILE_QUALITY/);
  assert.match(skinRenderer, /style === "toxic"/);
  assert.ok(html.indexOf("shared/skin-definitions.js") < html.indexOf("game.js"));
});

test("habilidades exibem custo, recarga e o mesmo efeito executado", () => {
  const definitions = require("../src/classes/class-definitions.js");
  const active = read("src/combat/active-skills.js");
  assert.equal(definitions.EQUIPPABLE_SKILLS.length, 10);
  for (const skill of definitions.EQUIPPABLE_SKILLS) {
    assert.ok(skill.effect.length >= 35, `${skill.id} precisa explicar o efeito`);
    assert.match(active, new RegExp(`(?:^|\\n)\\s*(?:"${skill.id}"|${skill.id})\\(owner\\)`));
  }
  assert.doesNotMatch(active, /SKILL_DEFS|const aliases/);
  assert.match(read("src/menu/main-menu.js"), /ENERGIA[\s\S]*RECARGA/);
});
