"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  clamp,
  pointToSegmentDistance,
  sanitizeName,
  sanitizeRoomCode,
  steerVelocity
} = require("../shared/simulation.js");

test("geometria compartilhada limita posições e calcula colisão com rastro", () => {
  assert.equal(clamp(12, 0, 10), 10);
  assert.equal(clamp(-2, 0, 10), 0);
  assert.equal(pointToSegmentDistance(5, 4, 0, 0, 10, 0), 4);
  assert.equal(pointToSegmentDistance(14, 0, 0, 0, 10, 0), 4);
});

test("identidades e códigos são normalizados no contrato compartilhado", () => {
  assert.equal(sanitizeName("  <Nara>  "), "Nara");
  assert.equal(sanitizeName(""), "Viajante");
  assert.equal(sanitizeRoomCode(" ab-12 çz9 "), "AB12Z9");
});

test("direção compartilhada converge sem ultrapassar o contrato de velocidade", () => {
  const entity = { x: 0, y: 0, vx: 0, vy: 0 };
  steerVelocity(entity, 100, 0, 200, 1 / 30, 6);
  assert.ok(entity.vx > 0);
  assert.equal(entity.vy, 0);
  assert.ok(entity.vx < 200);
});
