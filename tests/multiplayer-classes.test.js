"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ArenaRoom } = require("../server/multiplayer.js");
const { CLASS_IDS } = require("../src/classes/class-definitions.js");

const database = { createRoom() {}, finishRoom() {}, saveRun() {} };
const socket = () => ({ readyState: 1, send() {} });

function createDuel(classId) {
  const room = new ArenaRoom(`T${classId.slice(0, 5)}`.toUpperCase(), database);
  room.players.clear();
  const actor = room.addPlayer(socket(), `A-${classId}`, { classId });
  const target = room.addPlayer(socket(), `B-${classId}`, { classId: "cutter" });
  actor.x = 1000; actor.y = 1000; actor.targetX = 1080; actor.targetY = 1000;
  target.x = 1080; target.y = 1000; target.hitTimer = 0;
  actor.hitTimer = 0; actor.classCooldown = 0; actor.specialCooldown = 0; actor.classResource = actor.classResourceMax;
  return { room, actor, target };
}

test("cada classe entra no snapshot com recurso, nível e identidade", () => {
  for (const classId of CLASS_IDS) {
    const { room, actor } = createDuel(classId);
    const serialized = room.serializePlayer(actor);
    assert.equal(serialized.classId, classId);
    assert.ok(serialized.className);
    assert.ok(serialized.classLevel >= 1);
    assert.ok(serialized.classResourceMax > 0);
    assert.ok(serialized.classResourceName);
  }
});

test("ataques principais das dez classes alteram estado autoritativo", () => {
  for (const classId of CLASS_IDS) {
    const { room, actor, target } = createDuel(classId);
    const before = { health: target.health, projectiles: room.projectiles.length, traps: room.traps.length, resource: actor.classResource };
    room.beginPrimary(actor);
    if (classId === "cutter") {
      assert.equal(actor.phasing, true);
      actor.phase.points.push({ x: target.x, y: target.y }); actor.phase.distance = 80; actor.phase.x = target.x; actor.phase.y = target.y;
      room.endPrimary(actor);
    } else if (classId === "marksman") {
      assert.equal(actor.classCharging, true);
      actor.classCharge = 0.8; room.endPrimary(actor);
    }
    const changed = target.health < before.health
      || room.projectiles.length > before.projectiles
      || room.traps.length > before.traps
      || actor.classActionTimer > 0
      || actor.classResource < before.resource;
    assert.equal(changed, true, `${classId} precisa executar uma mecânica principal`);
  }
});

test("especiais das dez classes consomem recurso ou criam efeito próprio", () => {
  for (const classId of CLASS_IDS) {
    const { room, actor } = createDuel(classId);
    if (classId === "cutter") actor.lastCutterPath = [{ x: 1000, y: 1000 }, { x: 1080, y: 1000 }];
    const before = { resource: actor.classResource, projectiles: room.projectiles.length, traps: room.traps.length, fields: room.fields.length };
    room.useClassSpecial(actor);
    const changed = actor.classResource < before.resource
      || room.projectiles.length > before.projectiles
      || room.traps.length > before.traps
      || room.fields.length > before.fields
      || actor.classShieldTimer > 0
      || actor.classStealthTimer > 0;
    assert.equal(changed, true, `${classId} precisa ter especial funcional`);
  }
});

test("projéteis, armadilhas e campos são simulados no servidor", () => {
  const { room, actor, target } = createDuel("marksman");
  room.fireProjectile(actor, 0, { speed: 500, damage: 20, radius: 8, life: 1 });
  for (let step = 0; step < 10; step += 1) room.updateProjectiles(1 / 30);
  assert.ok(target.health < target.maxHealth);

  target.hitTimer = 0;
  const trapper = createDuel("trapper");
  trapper.actor.x = trapper.target.x; trapper.actor.y = trapper.target.y;
  trapper.room.placeTrap(trapper.actor);
  trapper.room.traps[0].armed = 0;
  trapper.room.updateTraps(1 / 30);
  assert.ok(trapper.target.health < trapper.target.maxHealth);

  const controller = createDuel("controller");
  controller.actor.targetX = controller.target.x; controller.actor.targetY = controller.target.y;
  controller.room.createGravityField(controller.actor);
  controller.room.fields[0].tick = 0;
  controller.room.updateFields(1 / 30);
  assert.ok(controller.target.health < controller.target.maxHealth);
});
