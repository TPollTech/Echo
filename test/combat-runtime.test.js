const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("runtime limpa o roster e bloqueia ameaças avançadas no início", () => {
  const root = path.resolve(__dirname, "..");
  const script = String.raw`
    global.EchoCore = { events: { emit() {} } };
    require("./combat/enemy-contracts.js");
    require("./combat/threat-director.js");
    const runtime = require("./combat/runtime.js");
    global.EchoSimulation = Object.freeze({ steerVelocity(entity) { return entity; } });
    const player = { id: "player", health: 100, maxHealth: 100, x: 0, y: 0, vx: 0, vy: 0 };
    global.EchoSimulation.steerVelocity(player, 0, 0, 1, 0.016);
    const makeBot = (index, archetype = "sniper") => ({
      id: "bot-" + index,
      archetype,
      name: "TESTE",
      roleLabel: "TESTE",
      health: 72,
      maxHealth: 72,
      speed: 94,
      baseSpeed: 94,
      attackDamage: 23,
      baseAttackDamage: 23,
      aggression: 0.8,
      x: index,
      y: index,
      cooldown: 1,
      dead: false,
      phasing: false,
      stealthed: false,
      boss: false
    });
    const first = Array.from({ length: 10 }, (_, index) => makeBot(index));
    if (runtime.getTrackedBotCount() !== 10) throw new Error("primeiro roster incorreto");
    if (first.some((bot) => ["sniper", "bruiser", "bulwark", "phantom"].includes(bot.archetype))) {
      throw new Error("ameaça avançada apareceu no tier inicial");
    }
    Array.from({ length: 10 }, (_, index) => makeBot(index + 20, "hunter"));
    if (runtime.getTrackedBotCount() !== 10) throw new Error("roster antigo não foi limpo");
  `;
  const result = spawnSync(process.execPath, ["-e", script], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
