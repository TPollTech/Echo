"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeSeed, hashSeed, createSeededRandom } = require("../core/random.js");

test("a mesma seed gera a mesma sequência", () => {
  const first = createSeededRandom("ECHO-7F42A");
  const second = createSeededRandom("ECHO-7F42A");
  assert.deepEqual(
    Array.from({ length: 8 }, () => first()),
    Array.from({ length: 8 }, () => second())
  );
});

test("seeds diferentes geram sequências diferentes", () => {
  const first = createSeededRandom("ECHO-A");
  const second = createSeededRandom("ECHO-B");
  assert.notDeepEqual(
    Array.from({ length: 4 }, () => first()),
    Array.from({ length: 4 }, () => second())
  );
});

test("normalização mantém a seed compartilhável", () => {
  assert.equal(normalizeSeed(" echo teste!  "), "ECHOTESTE");
  assert.equal(hashSeed("echo-a"), hashSeed("ECHO-A"));
});
