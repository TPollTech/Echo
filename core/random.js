(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EchoRandom = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function normalizeSeed(seed) {
    const value = String(seed ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    return value.slice(0, 32) || "ECHO-00000000";
  }

  function hashSeed(seed) {
    const text = normalizeSeed(seed);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(initialState) {
    let state = initialState >>> 0;
    return function random() {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createSeededRandom(seed) {
    return mulberry32(hashSeed(seed));
  }

  function createSeed() {
    const values = new Uint32Array(2);
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      crypto.getRandomValues(values);
    } else {
      values[0] = Date.now() >>> 0;
      values[1] = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
    }
    return `ECHO-${values[0].toString(36)}${values[1].toString(36)}`.toUpperCase().slice(0, 18);
  }

  function installGlobalRandom(seed, target = globalThis) {
    const normalized = normalizeSeed(seed);
    const random = createSeededRandom(normalized);
    const original = target.Math.random;
    target.Math.random = random;
    return Object.freeze({
      seed: normalized,
      random,
      restore() {
        if (target.Math.random === random) target.Math.random = original;
      }
    });
  }

  return Object.freeze({ normalizeSeed, hashSeed, createSeededRandom, createSeed, installGlobalRandom });
});
