"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");

test("cliente consome uma única implementação canônica da geometria", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
  assert.match(game, /const simulation = window\.EchoSimulation/);
  assert.doesNotMatch(game, /function clamp\s*\(/);
  assert.doesNotMatch(game, /function pointToSegmentDistance\s*\(/);
  assert.doesNotMatch(game, /function steer\s*\(/);
});

test("módulo compartilhado é carregado uma vez e antes do cliente", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const sharedMatches = html.match(/shared\/simulation\.js/g) || [];
  const gameMatches = html.match(/game\.js/g) || [];
  assert.equal(sharedMatches.length, 1);
  assert.equal(gameMatches.length, 1);
  assert.ok(html.indexOf("shared/simulation.js") < html.indexOf("game.js"));
});
