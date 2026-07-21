"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CLASS_IDS,
  classRegistry,
  EQUIPPABLE_SKILLS,
  MUTATION_CLASS_COMPATIBILITY,
  CLASS_CHALLENGES,
  getClassDefinition,
  getClassLevel,
  getClassEvolution,
  createBalancedBotClassComposition,
  compatibleSkills,
  sanitizeSkillLoadout,
  chooseRandomClass,
  decideClassAi
} = require("../src/classes/class-definitions.js");

test("registro central contém dez classes completas, únicas e objetivas", () => {
  assert.equal(CLASS_IDS.length, 10);
  assert.equal(new Set(CLASS_IDS).size, 10);
  assert.equal(Object.keys(classRegistry).length, 10);
  assert.equal(getClassDefinition("desconhecida").id, "cutter");
  for (const classId of CLASS_IDS) {
    const definition = classRegistry[classId];
    assert.equal(definition.id, classId);
    assert.match(definition.name, /^[A-ZÁÉÍÓÚÇ-]+$/);
    assert.ok(definition.primaryAttack);
    assert.ok(definition.activeAbility);
    assert.ok(definition.passiveAbility);
    assert.ok(definition.resource.max > 0);
    assert.ok(definition.attributes.health > 0);
    assert.ok(definition.attributes.preferredRange > 0);
    assert.ok(Object.keys(definition.growth).length >= 4);
    assert.ok(definition.aiBehavior);
    assert.ok(definition.strengths.length);
    assert.ok(definition.weaknesses.length);
    assert.ok(CLASS_CHALLENGES[classId].target > 0);
  }
});

test("composição de bots respeita papéis e limites de repetição", () => {
  const composition = createBalancedBotClassComposition({ botCount: 10, playerClass: "marksman", randomFn: () => 0 });
  assert.equal(composition.length, 10);
  assert.ok(composition.some((id) => classRegistry[id].role === "melee"));
  assert.ok(composition.some((id) => classRegistry[id].role === "long-range"));
  assert.ok(composition.some((id) => classRegistry[id].role === "control"));
  const counts = composition.reduce((result, id) => ({ ...result, [id]: (result[id] || 0) + 1 }), {});
  assert.ok((counts.marksman || 0) <= 1, "o jogador já ocupa uma das duas vagas de Atirador");
  assert.ok((counts.defender || 0) <= 2);
  assert.ok((counts.assassin || 0) <= 1);
});

test("classe aleatória, loadout e mutações respeitam compatibilidade por dados", () => {
  assert.equal(chooseRandomClass(() => 0), "cutter");
  assert.equal(chooseRandomClass(() => 0.9999), "loader");
  const marksmanSkills = compatibleSkills("marksman");
  assert.ok(marksmanSkills.some((skill) => skill.id === "triple-shot"));
  assert.ok(!marksmanSkills.some((skill) => skill.id === "slow-trap"));
  const sanitized = sanitizeSkillLoadout("marksman", ["slow-trap", "triple-shot", "triple-shot", "teleport"]);
  assert.equal(new Set(sanitized).size, sanitized.length);
  assert.equal(sanitized.length, 4);
  assert.ok(sanitized.every((id) => marksmanSkills.some((skill) => skill.id === id)));
  assert.equal(EQUIPPABLE_SKILLS.length, 10);
  assert.ok(MUTATION_CLASS_COMPATIBILITY.blade.includes("cutter"));
  assert.ok(!MUTATION_CLASS_COMPATIBILITY.blade.includes("marksman"));
});

test("nível aplica evolução específica sem trocar o contrato da classe", () => {
  assert.equal(getClassLevel(0), 1);
  assert.ok(getClassLevel(900) > 1);
  const levelOne = getClassEvolution("marksman", 1);
  const levelEight = getClassEvolution("marksman", 8);
  assert.equal(levelOne.chargeSpeed, 1);
  assert.ok(levelEight.chargeSpeed > levelOne.chargeSpeed);
  assert.ok(levelEight.projectileSize > levelOne.projectileSize);
  assert.equal(getClassDefinition("marksman").attributes.health, 85);
});

test("IA registrada toma decisões próprias para cada classe", () => {
  assert.equal(decideClassAi("marksman", { distance: 120, danger: 0.2 }).action, "retreat");
  assert.equal(decideClassAi("charger", { distance: 250, alignment: 0.9 }).action, "charge");
  assert.equal(decideClassAi("trapper", { contested: 0.8, traps: 1 }).action, "trap");
  assert.equal(decideClassAi("defender", { frontalThreat: 0.8 }).action, "block");
  assert.equal(decideClassAi("assassin", { targetHealth: 0.2, isolated: 0.9 }).action, "ambush");
  assert.equal(decideClassAi("controller", { danger: 0.2, clustered: 0.9 }).action, "pull");
  assert.equal(decideClassAi("summoner", { units: 3, distance: 400 }).action, "command");
  assert.equal(decideClassAi("orbiter", { orbs: 1, danger: 0.2 }).action, "preserve");
  assert.equal(decideClassAi("loader", { ammo: 1, surrounded: 0.1 }).action, "collect");
});
