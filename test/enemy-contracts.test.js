const test = require("node:test");
const assert = require("node:assert/strict");
const contracts = require("../combat/enemy-contracts.js");

test("todos os arquétipos principais possuem contrato", () => {
  const ids = ["hunter", "warden", "drainer", "weaver", "sniper", "swarmer", "bruiser", "berserker", "sprinter", "bulwark", "phantom"];
  for (const id of ids) {
    const contract = contracts.getContract(id);
    assert.ok(contract, id);
    assert.ok(contract.role.length > 3);
    assert.ok(contract.weakness.length > 3);
    assert.ok(contract.telegraphMs >= 300);
  }
});

test("applyContract anexa identidade sem trocar o arquétipo", () => {
  const bot = { archetype: "sniper" };
  contracts.applyContract(bot);
  assert.equal(bot.archetype, "sniper");
  assert.equal(bot.contractRole, "PRESSÃO À DISTÂNCIA");
  assert.equal(bot.contractTier, 2);
});
