(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EchoCombatRuntime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const Contracts = root?.EchoEnemyContracts;
  const Threat = root?.EchoThreatDirector;
  const events = root?.EchoCore?.events;
  const tracked = new Set();
  const records = new WeakMap();
  const earlyIds = ["hunter", "warden", "drainer", "swarmer"];
  const earlyStats = Object.freeze({
    hunter: ["CAÇADOR", 82, 151, 10, 0.9, 0, false],
    warden: ["SENTINELA", 145, 98, 13, 0.58, 0, false],
    drainer: ["PARASITA", 92, 128, 8, 0.72, 16, false],
    swarmer: ["ENXAME", 55, 145, 6, 0.65, 0, true]
  });

  const state = {
    installed: false,
    player: null,
    previousPlayerHealth: null,
    runActive: false,
    mutationNames: new Set(),
    director: Threat?.createThreatDirector?.() || null,
    threat: Threat?.evaluate?.() || { tier: 0, recoveryMode: false, maxConcurrentAttackers: 1 },
    recovery: false,
    lastFrame: 0
  };

  function emit(name, payload = {}) {
    try { events?.emit(name, payload); } catch (_error) {}
  }

  function isBot(value) {
    return Boolean(value && typeof value === "object" && value.id !== "player"
      && typeof value.archetype === "string" && Number.isFinite(value.health)
      && Number.isFinite(value.maxHealth));
  }

  function clock() {
    const text = root?.document?.querySelector("#time-value")?.textContent || "00:00";
    const [minutes, seconds] = text.split(":").map((value) => Number(value) || 0);
    return minutes * 60 + seconds;
  }

  function hudNumber(selector) {
    const text = root?.document?.querySelector(selector)?.textContent || "0";
    const number = Number(text.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(number) ? number : 0;
  }

  function setRecordBase(record, bot) {
    record.baseHealth = Math.max(1, Number(bot.maxHealth) || 1);
    record.baseDamage = Math.max(1, Number(bot.baseAttackDamage || bot.attackDamage) || 1);
    record.baseSpeed = Math.max(1, Number(bot.baseSpeed || bot.speed) || 1);
    record.appliedTier = -1;
    record.appliedRecovery = null;
  }

  function remapForTier(bot, record, tier) {
    if (bot.boss || bot.bossClone || bot.noRespawn) return;
    const contract = Contracts?.getContract?.(bot.archetype);
    if (!contract || contract.tier <= tier) return;
    const id = earlyIds[Math.floor(Math.random() * earlyIds.length)];
    const [label, health, speed, damage, aggression, drain, swarmer] = earlyStats[id];
    const ratio = bot.maxHealth > 0 ? bot.health / bot.maxHealth : 1;
    Object.assign(bot, {
      archetype: id,
      roleLabel: label,
      maxHealth: health,
      health: Math.max(1, Math.round(health * ratio)),
      speed,
      baseSpeed: speed,
      attackDamage: damage,
      baseAttackDamage: damage,
      aggression,
      energyDrain: drain,
      swarmer,
      sniper: false,
      longRange: false,
      heavyHit: false
    });
    Contracts?.applyContract?.(bot);
    setRecordBase(record, bot);
    emit("enemy:remapped", { id: bot.id, archetype: id, tier });
  }

  function register(bot, force = false) {
    if (!isBot(bot)) return bot;
    tracked.add(bot);
    let record = records.get(bot);
    const generation = `${bot.archetype}:${bot.maxHealth}:${bot.baseSpeed || bot.speed}:${bot.dead ? 1 : 0}`;
    if (record && !force && record.generation === generation) return bot;
    record ||= {};
    Object.assign(record, {
      generation,
      health: bot.health,
      dead: Boolean(bot.dead),
      role: bot.roleLabel,
      phasing: Boolean(bot.phasing),
      stealthed: Boolean(bot.stealthed),
      cooldown: Number(bot.cooldown) || 0,
      dashCount: 0,
      elite: false,
      bossSpawned: false
    });
    setRecordBase(record, bot);
    records.set(bot, record);
    bot.homeX ??= bot.x;
    bot.homeY ??= bot.y;
    bot.runtimeStunTimer ??= 0;
    bot.runtimeFleeTimer ??= 0;
    bot.runtimeRestTimer ??= 0;
    bot.runtimeExposedTimer ??= 0;
    Contracts?.applyContract?.(bot);
    remapForTier(bot, record, state.threat.tier || 0);
    emit(bot.boss && !bot.bossClone ? "boss:registered" : "enemy:registered", {
      id: bot.id,
      archetype: bot.archetype,
      role: bot.contractRole || bot.roleLabel
    });
    return bot;
  }

  function installCollectionHooks() {
    const nativeFrom = Array.from;
    if (!nativeFrom.__echoCombatWrapped) {
      const wrapped = function (...args) {
        const result = nativeFrom.apply(this, args);
        const roster = result.filter(isBot);
        if (roster.length >= 5 && roster.length === result.length) {
          tracked.clear();
          emit("combat:roster-reset", { count: roster.length });
        }
        roster.forEach((bot) => register(bot));
        return result;
      };
      Object.defineProperty(wrapped, "__echoCombatWrapped", { value: true });
      Array.from = wrapped;
    }

    const nativePush = Array.prototype.push;
    if (!nativePush.__echoCombatWrapped) {
      const wrapped = function (...items) {
        items.forEach((item) => register(item));
        return nativePush.apply(this, items);
      };
      Object.defineProperty(wrapped, "__echoCombatWrapped", { value: true });
      Array.prototype.push = wrapped;
    }

    const nativeAssign = Object.assign;
    if (!nativeAssign.__echoCombatWrapped) {
      const wrapped = function (target, ...sources) {
        const result = nativeAssign(target, ...sources);
        if (isBot(result)) register(result, true);
        return result;
      };
      Object.defineProperty(wrapped, "__echoCombatWrapped", { value: true });
      Object.assign = wrapped;
    }
  }

  function wrapSimulation(api) {
    if (!api || typeof api.steerVelocity !== "function" || api.__echoCombatWrapped) return api;
    const nativeSteer = api.steerVelocity;
    return Object.freeze({
      ...api,
      steerVelocity(entity, ...args) {
        if (entity?.id === "player" && state.player !== entity) {
          state.player = entity;
          state.previousPlayerHealth = entity.health;
          emit("player:registered", { id: entity.id, maxHealth: entity.maxHealth });
        }
        return nativeSteer(entity, ...args);
      },
      __echoCombatWrapped: true
    });
  }

  function installSimulationCapture() {
    let current = root.EchoSimulation ? wrapSimulation(root.EchoSimulation) : null;
    Object.defineProperty(root, "EchoSimulation", {
      configurable: true,
      enumerable: true,
      get: () => current,
      set: (value) => { current = wrapSimulation(value); }
    });
  }

  function applyThreat(bot, record, snapshot) {
    if (bot.boss || bot.bossClone || bot.noRespawn || bot.dead) return;
    remapForTier(bot, record, snapshot.tier);
    if (record.appliedTier === snapshot.tier && record.appliedRecovery === snapshot.recoveryMode) return;
    if (!record.elite && snapshot.eliteChance > 0 && Math.random() < snapshot.eliteChance) {
      record.elite = true;
      bot.elite = true;
      bot.name = `ELITE ${bot.name}`;
      bot.roleLabel = `ELITE // ${bot.roleLabel}`;
      emit("enemy:elite", { id: bot.id, archetype: bot.archetype });
    }
    const healthRatio = bot.maxHealth > 0 ? Math.max(0, bot.health / bot.maxHealth) : 1;
    bot.maxHealth = Math.round(record.baseHealth * snapshot.healthScale * (record.elite ? 1.42 : 1));
    bot.health = Math.max(1, Math.min(bot.maxHealth, Math.round(bot.maxHealth * healthRatio)));
    bot.baseAttackDamage = Math.max(1, Math.round(record.baseDamage * snapshot.damageScale * (record.elite ? 1.22 : 1)));
    bot.attackDamage = bot.baseAttackDamage;
    bot.baseSpeed = record.baseSpeed * snapshot.speedScale * (record.elite ? 1.08 : 1);
    if (bot.archetype !== "berserker" && bot.archetype !== "swarmer") bot.speed = bot.baseSpeed;
    bot.cooldown = Math.max(Number(bot.cooldown) || 0, snapshot.recoveryMode ? 0.8 : 0.2);
    record.appliedTier = snapshot.tier;
    record.appliedRecovery = snapshot.recoveryMode;
  }

  function behavior(bot, record, dt) {
    const player = state.player;
    if (!player || bot.dead || bot.boss || bot.bossClone || bot.phasing) return;
    for (const key of ["runtimeStunTimer", "runtimeFleeTimer", "runtimeRestTimer", "runtimeExposedTimer"]) {
      bot[key] = Math.max(0, (bot[key] || 0) - dt);
    }
    if (bot.archetype !== "berserker" && bot.archetype !== "swarmer") bot.speed = bot.baseSpeed;
    if (bot.runtimeStunTimer > 0 || bot.runtimeRestTimer > 0) {
      bot.targetX = bot.x;
      bot.targetY = bot.y;
      bot.vx *= 0.72;
      bot.vy *= 0.72;
      bot.cooldown = Math.max(bot.cooldown, 0.18);
      return;
    }
    const dx = bot.x - player.x;
    const dy = bot.y - player.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (bot.archetype === "hunter" && distance < 620) {
      bot.targetX = player.x + (player.vx || 0) * 1.05;
      bot.targetY = player.y + (player.vy || 0) * 1.05;
    }
    if (bot.archetype === "warden") {
      const homeDistance = Math.hypot(bot.x - bot.homeX, bot.y - bot.homeY);
      bot.runtimeGuarding = homeDistance < 135;
      if (homeDistance > 260) [bot.targetX, bot.targetY] = [bot.homeX, bot.homeY];
      if (bot.runtimeGuarding) bot.speed = bot.baseSpeed * 0.72;
    }
    if (bot.archetype === "drainer" && bot.runtimeFleeTimer > 0) {
      bot.targetX = bot.x + (dx / distance) * 360;
      bot.targetY = bot.y + (dy / distance) * 360;
      bot.speed = bot.baseSpeed * 1.22;
      bot.cooldown = Math.max(bot.cooldown, 0.5);
    }
    if (bot.archetype === "phantom" && bot.runtimeExposedTimer > 0) {
      bot.speed = bot.baseSpeed * 0.82;
      bot.stealthed = false;
    }
  }

  function observeBot(bot, record) {
    if (bot.health < record.health) {
      const damage = record.health - bot.health;
      if (bot.archetype === "warden" && bot.runtimeGuarding && bot.health > 1) {
        bot.health = Math.min(bot.maxHealth, bot.health + damage * 0.2);
      }
      if (bot.archetype === "phantom" && bot.runtimeExposedTimer > 0 && bot.health > 2) {
        bot.health = Math.max(1, bot.health - damage * 0.22);
      }
      emit("enemy:damaged", { id: bot.id, archetype: bot.archetype, amount: damage, health: bot.health });
    }
    if (!record.dead && bot.dead) {
      emit(bot.boss && !bot.bossClone ? "boss:defeated" : "enemy:killed", {
        id: bot.id, archetype: bot.archetype, name: bot.name
      });
    }
    if (bot.boss && !bot.bossClone && !bot.dead && !record.bossSpawned) {
      record.bossSpawned = true;
      emit("boss:spawned", { id: bot.id, archetype: bot.archetype, name: bot.name });
    }
    if (bot.boss && record.role && bot.roleLabel !== record.role) {
      emit("boss:phase-changed", { id: bot.id, name: bot.name, phase: bot.roleLabel });
    }
    if (record.phasing && !bot.phasing) {
      if (bot.archetype === "bruiser" || bot.archetype === "bulwark") bot.runtimeStunTimer = 0.72;
      if (bot.archetype === "drainer") bot.runtimeFleeTimer = 1.55;
      if (bot.archetype === "weaver") bot.runtimeStunTimer = 0.42;
    }
    if (bot.archetype === "sprinter" && record.cooldown <= 0 && bot.cooldown > 0.7) {
      record.dashCount += 1;
      if (record.dashCount >= 3) {
        record.dashCount = 0;
        bot.runtimeRestTimer = 1.2;
        emit("enemy:resting", { id: bot.id, archetype: bot.archetype });
      }
    }
    if (bot.archetype === "phantom" && record.stealthed && !bot.stealthed) {
      bot.runtimeExposedTimer = 1.35;
      emit("enemy:exposed", { id: bot.id, archetype: bot.archetype, duration: 1.35 });
    }
    Object.assign(record, {
      health: bot.health,
      dead: Boolean(bot.dead),
      role: bot.roleLabel,
      phasing: Boolean(bot.phasing),
      stealthed: Boolean(bot.stealthed),
      cooldown: Number(bot.cooldown) || 0
    });
  }

  function attackerBudget(snapshot) {
    if (!state.player) return;
    const living = [...tracked].filter((bot) => !bot.dead && !bot.boss);
    const active = living.filter((bot) => bot.phasing).length;
    let available = Math.max(0, snapshot.maxConcurrentAttackers - active);
    const candidates = living.filter((bot) => !bot.phasing && (bot.cooldown || 0) <= 0.12)
      .sort((a, b) => Math.hypot(a.x - state.player.x, a.y - state.player.y)
        - Math.hypot(b.x - state.player.x, b.y - state.player.y));
    for (const bot of candidates) {
      if (available > 0) available -= 1;
      else bot.cooldown = Math.max(bot.cooldown, snapshot.recoveryMode ? 0.9 : 0.38);
    }
  }

  function observePlayer() {
    if (!state.player) return;
    if (state.player.health < state.previousPlayerHealth) {
      emit("player:damaged", {
        amount: state.previousPlayerHealth - state.player.health,
        health: state.player.health,
        maxHealth: state.player.maxHealth
      });
    }
    state.previousPlayerHealth = state.player.health;
  }

  function observeRun() {
    const playing = Boolean(root?.document?.body?.classList.contains("is-playing"));
    const gameover = !root?.document?.querySelector("#gameover-screen")?.classList.contains("is-hidden");
    const active = playing && !gameover;
    if (active && !state.runActive) emit("run:started", { seed: root.EchoCore?.seed || null });
    if (!active && state.runActive) emit("run:finished", {
      score: state.player?.score || hudNumber("#score-value"),
      kills: state.player?.kills || hudNumber("#kill-value"),
      time: clock()
    });
    state.runActive = active;
  }

  function installMutationObserver() {
    const target = root?.document?.querySelector("#mutation-slots");
    if (!target || typeof MutationObserver === "undefined") return;
    const sync = () => {
      const names = new Set([...target.querySelectorAll(".mutation-chip")].map((node) => node.textContent.trim()));
      names.forEach((name) => { if (!state.mutationNames.has(name)) emit("mutation:selected", { name }); });
      state.mutationNames = names;
    };
    new MutationObserver(sync).observe(target, { childList: true, subtree: true, characterData: true });
    sync();
  }

  function updateBuildLabels() {
    if (!root?.document) return;
    const walker = root.document.createTreeWalker(root.document.body, 4);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      node.nodeValue = node.nodeValue?.replace(/BUILD 0\.[34]/g, "BUILD 0.5");
    }
  }

  function frame(now = 0) {
    const dt = Math.min(0.05, Math.max(0.001, state.lastFrame ? (now - state.lastFrame) / 1000 : 0.016));
    state.lastFrame = now;
    observeRun();
    observePlayer();
    const runTime = clock();
    const update = state.director?.update?.({
      runTime,
      stage: Math.floor(runTime / 85),
      score: state.player?.score || hudNumber("#score-value"),
      kills: state.player?.kills || hudNumber("#kill-value"),
      healthRatio: state.player ? state.player.health / Math.max(1, state.player.maxHealth) : 1,
      bossActive: [...tracked].some((bot) => bot.boss && !bot.bossClone && !bot.dead)
    });
    if (update?.snapshot) state.threat = update.snapshot;
    if (update?.tierChanged && update.previousTier >= 0) {
      emit("threat:tier-changed", { tier: state.threat.tier, previousTier: update.previousTier });
    }
    if (state.threat.recoveryMode !== state.recovery) {
      state.recovery = state.threat.recoveryMode;
      emit("threat:recovery-changed", { active: state.recovery });
    }
    for (const bot of tracked) {
      if (!isBot(bot)) continue;
      const record = records.get(bot) || (register(bot), records.get(bot));
      applyThreat(bot, record, state.threat);
      behavior(bot, record, dt);
      observeBot(bot, record);
    }
    attackerBudget(state.threat);
    root.requestAnimationFrame?.(frame);
  }

  function install() {
    if (state.installed || !root) return false;
    state.installed = true;
    installCollectionHooks();
    installSimulationCapture();
    if (root.document) {
      updateBuildLabels();
      installMutationObserver();
      root.requestAnimationFrame?.(frame);
    }
    emit("combat:runtime-ready", { version: "0.5.0" });
    return true;
  }

  install();
  return Object.freeze({
    version: "0.5.0",
    install,
    isBot,
    initializeBot: register,
    getSnapshot: () => state.threat,
    getTrackedBotCount: () => tracked.size
  });
});
