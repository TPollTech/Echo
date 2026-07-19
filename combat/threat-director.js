(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EchoThreatDirector = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const EARLY = Object.freeze(["hunter", "warden", "drainer", "swarmer"]);
  const MID = Object.freeze(["hunter", "warden", "drainer", "swarmer", "weaver", "berserker", "sprinter"]);
  const LATE = Object.freeze(["hunter", "warden", "drainer", "swarmer", "weaver", "berserker", "sprinter", "sniper", "bruiser", "bulwark", "phantom"]);

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function evaluate(context = {}) {
    const runTime = Math.max(0, Number(context.runTime) || 0);
    const stage = Math.max(0, Number(context.stage) || 0);
    const score = Math.max(0, Number(context.score) || 0);
    const kills = Math.max(0, Number(context.kills) || 0);
    const healthRatio = clamp(Number(context.healthRatio ?? 1), 0, 1);
    const bossActive = Boolean(context.bossActive);
    const momentum = clamp(runTime / 130 + stage * 0.72 + score / 520 + kills / 12 + (bossActive ? 0.8 : 0), 0, 7.5);
    const tier = clamp(Math.floor(momentum / 1.45), 0, 4);
    const recoveryMode = healthRatio < 0.34 && !bossActive;
    const domination = healthRatio > 0.78 && kills >= 10 && runTime > 75;
    const healthScale = 1 + tier * 0.075 + (domination ? 0.06 : 0);
    const damageScale = (1 + tier * 0.065 + (domination ? 0.05 : 0)) * (recoveryMode ? 0.82 : 1);
    const speedScale = (1 + tier * 0.022) * (recoveryMode ? 0.93 : 1);
    const cooldownScale = recoveryMode ? 1.18 : Math.max(0.82, 1 - tier * 0.035);
    const respawnDelayScale = recoveryMode ? 1.4 : Math.max(0.74, 1 - tier * 0.055);
    const eliteChance = recoveryMode || tier < 2 ? 0 : clamp(0.045 + (tier - 2) * 0.055 + (domination ? 0.035 : 0), 0, 0.2);
    const maxConcurrentAttackers = recoveryMode ? 1 : clamp(1 + Math.floor((tier + 1) / 2), 1, 3);
    return Object.freeze({
      tier,
      momentum,
      recoveryMode,
      domination,
      healthScale,
      damageScale,
      speedScale,
      cooldownScale,
      respawnDelayScale,
      eliteChance,
      maxConcurrentAttackers
    });
  }

  function poolForTier(tier) {
    if (tier <= 0) return EARLY;
    if (tier === 1) return MID;
    return LATE;
  }

  function pickArchetype(tier, random = Math.random) {
    const pool = poolForTier(Math.max(0, Number(tier) || 0));
    return pool[Math.floor(clamp(random(), 0, 0.999999) * pool.length)];
  }

  function composeWave({ tier = 0, count = 10, random = Math.random } = {}) {
    const total = Math.max(1, Math.floor(Number(count) || 1));
    const result = [];
    const core = tier <= 0
      ? ["hunter", "warden", "drainer", "swarmer"]
      : tier === 1
        ? ["hunter", "weaver", "sprinter", "swarmer", "warden"]
        : ["hunter", "sniper", "bruiser", "bulwark", "phantom", "weaver"];
    for (let index = 0; index < total; index += 1) {
      result.push(index < core.length ? core[index] : pickArchetype(tier, random));
    }
    return result;
  }

  function createThreatDirector() {
    let lastTier = -1;
    let snapshot = evaluate();
    return Object.freeze({
      update(context) {
        snapshot = evaluate(context);
        const tierChanged = snapshot.tier !== lastTier;
        const previousTier = lastTier;
        lastTier = snapshot.tier;
        return { snapshot, tierChanged, previousTier };
      },
      getSnapshot() {
        return snapshot;
      },
      reset() {
        lastTier = -1;
        snapshot = evaluate();
        return snapshot;
      }
    });
  }

  return Object.freeze({ evaluate, pickArchetype, composeWave, createThreatDirector, poolForTier });
});
