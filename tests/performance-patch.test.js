"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("patch adaptativo preserva o loop e reduz trabalho redundante", () => {
  const loop = read("src/core/game-loop.js");
  const performance = read("src/core/performance.js");
  const camera = read("src/core/camera.js");

  assert.match(loop, /document\.hidden/);
  assert.match(loop, /PERFORMANCE_PROFILE\.hudInterval/);
  assert.match(loop, /updateAdaptiveResolution\(elapsed,/);
  assert.match(performance, /slowSamplesBeforeScale/);
  assert.match(performance, /fastSamplesBeforeScale/);
  assert.match(camera, /targetRenderDpr\(\)/);
  assert.match(camera, /if \(!force && width === nextWidth/);
});

test("fragmentos usam indice espacial em coleta e IA", () => {
  const index = read("src/core/spatial-index.js");
  const playerMotes = read("src/entities/mote.js");
  const botMotes = read("src/entities/bot.js");
  const levels = read("src/progression/levels.js");

  assert.match(index, /const moteCells = new Map\(\)/);
  assert.match(index, /function queryMotes/);
  assert.match(playerMotes, /queryMotes\(entity\.x, entity\.y/);
  assert.match(botMotes, /queryMotes\(bot\.x, bot\.y/);
  assert.match(levels, /queryMotes\(bot\.x, bot\.y, 900\)/);
});

test("indice espacial preserva consultas, coleta e reposicao", () => {
  const context = {
    motes: [
      { id: "near-a", x: 10, y: 10 },
      { id: "far", x: 400, y: 400 },
      { id: "near-b", x: 20, y: 20 }
    ],
    distanceSq: (ax, ay, bx, by) => (ax - bx) ** 2 + (ay - by) ** 2,
    createMote: () => ({ id: "replacement", x: 700, y: 700 })
  };
  vm.createContext(context);
  vm.runInContext(`${read("src/core/spatial-index.js")}
    rebuildMoteSpatialIndex();
    globalThis.api = {
      query: (x, y, radius) => [...queryMotes(x, y, radius)],
      replaceCollectedMote,
      appendIndexedMote
    };`, context);
  const queryIds = (x, y, radius) => Array.from(context.api.query(x, y, radius), (mote) => mote.id);

  assert.deepEqual(queryIds(0, 0, 40).sort(), ["near-a", "near-b"]);
  context.api.replaceCollectedMote(context.motes[0]);
  assert.deepEqual(queryIds(0, 0, 40), ["near-b"]);
  assert.deepEqual(queryIds(700, 700, 5), ["replacement"]);
  context.api.appendIndexedMote({ id: "appended", x: 705, y: 700 });
  assert.deepEqual(queryIds(700, 700, 8).sort(), ["appended", "replacement"]);
});

test("render reutiliza efeitos caros sem remover assinaturas visuais", () => {
  const entities = read("src/rendering/entities.js");
  const effects = read("src/rendering/effects.js");
  const skills = read("src/combat/active-skills.js");
  const renderer = read("src/rendering/renderer.js");

  assert.match(entities, /entityGradientSprites/);
  assert.match(entities, /drawEfficientArchetypeSignature/);
  assert.doesNotMatch(entities, /\{\s*\.\.\.(?:bot|player)/);
  assert.match(effects, /scarSpriteCache/);
  assert.match(skills, /skillHudBaseCache/);
  assert.match(renderer, /backgroundGradient/);
});

test("interface de toque evita filtro de fundo caro", () => {
  const styles = read("styles.css");
  assert.match(styles, /@media \(pointer: coarse\)[\s\S]*backdrop-filter: none/);
});
