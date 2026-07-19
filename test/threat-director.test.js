const test = require("node:test");
const assert = require("node:assert/strict");
const director = require("../combat/threat-director.js");

test("ameaça cresce com tempo, estágio e desempenho", () => {
  const early = director.evaluate({ runTime: 10, stage: 0, score: 20, kills: 0, healthRatio: 1 });
  const late = director.evaluate({ runTime: 260, stage: 3, score: 1200, kills: 30, healthRatio: 1 });
  assert.ok(late.tier > early.tier);
  assert.ok(late.healthScale > early.healthScale);
  assert.ok(late.maxConcurrentAttackers >= early.maxConcurrentAttackers);
});

test("modo de recuperação reduz pressão ofensiva", () => {
  const healthy = director.evaluate({ runTime: 180, stage: 2, score: 700, kills: 18, healthRatio: 0.9 });
  const danger = director.evaluate({ runTime: 180, stage: 2, score: 700, kills: 18, healthRatio: 0.2 });
  assert.equal(danger.recoveryMode, true);
  assert.ok(danger.damageScale < healthy.damageScale);
  assert.equal(danger.maxConcurrentAttackers, 1);
  assert.ok(danger.respawnDelayScale > healthy.respawnDelayScale);
});

test("composição inicial evita ameaças avançadas", () => {
  const wave = director.composeWave({ tier: 0, count: 12, random: () => 0.5 });
  assert.equal(wave.length, 12);
  assert.equal(wave.includes("sniper"), false);
  assert.equal(wave.includes("bruiser"), false);
});
