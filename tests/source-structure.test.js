"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");

function runScript(script, ...args) {
  return spawnSync(process.execPath, [path.join(ROOT, "scripts", script), ...args], {
    cwd: ROOT,
    encoding: "utf8"
  });
}

test("bundle gerado permanece sincronizado com a fonte modular", () => {
  const result = runScript("build-game.js", "--check");
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("estrutura modular atende os limites e domínios obrigatórios", () => {
  const result = runScript("check-source-structure.js");
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("IA e bosses usam registros de comportamento", () => {
  const enemyAi = fs.readFileSync(path.join(ROOT, "src", "enemies", "enemy-ai.js"), "utf8");
  const bossRuntime = fs.readFileSync(path.join(ROOT, "src", "bosses", "mechanics", "runtime.js"), "utf8");
  assert.match(enemyAi, /const enemyBehaviorRegistry/);
  assert.doesNotMatch(enemyAi, /bot\.archetype\s*===/);
  assert.match(bossRuntime, /const bossMechanicRegistry/);
  assert.doesNotMatch(bossRuntime, /bot\.archetype\s*===/);
});
