(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EchoCombatRuntime = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const contracts = root?.EchoEnemyContracts || null;
  const Threat = root?.EchoThreatDirector || null;
  const events = root?.EchoCore?.events || null;
  const bots = new Set();
  const records = new WeakMap();
  const advancedFallbacks = ["hunter", "warden", "drainer", "swarmer"];
  const archetypeStats = Object.freeze({
    hunter: { roleLabel: "CAÇADOR", health: 82, speed: 151, damage: 10, aggression: 0.9 },
    warden: { roleLabel: "SENTINELA", health: 145, speed: 98, damage: 13, aggression: 0.58 },
    drainer: { roleLabel: "PARASITA", health: 92, speed: 128, damage: 8, aggression: 0.72, energyDrain: 16 },
    swarmer: { roleLabel: "ENXAME", health: 55, speed: 145, damage: 6, aggression: 0.65, swarmer: true }
  });

  const runtime = {
    player: null,
    threat: Threat?.createThreatDirector?.() || null,
    snapshot: Threat?.evaluate?.() || { tier: 0, recoveryMode: false, maxConcurrentAttackers: 1 },
    runActive: false,
    lastRecoveryMode: false,
    mutationNames: new Set(),
    lastFrameAt: 0,
    installed: false
  };

  function emit(eventName, payload = {}) {
    try { events?.emit(eventName, payload); } catch (_error) {}
  }

  function isBot(value) {
    return Boolean(
      value
      && typeof value === "object"
      && typeof value.archetype === "string"
      && typeof value.health === "number"
      && typeof value.maxHealth === "number"
      && value.id !== "player"
    );
  }

  function readNumber(selector, fallback = 0) {
    const text = root?.document?.querySelector(selector)?.textContent || "";
    const numeric = Number(String(text).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function readClock() {
    const text = root?.document?.querySelector("#time-value")?.textContent || "00:00";
    const [minutes, seconds] = text.split(":").map((part) => Number(part) || 0);
    return minutes * 60 + seconds;
  }

  function updateBuildLabels() {
    if (!root?.document) return;
    const walker = root.document.createTreeWalker(root.document.body, 4);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue?.includes("BUILD 0.3") || node.nodeValue?.includes("BUILD 0.4")) {
        node.nodeValue = node.nodeValue.replace(/BUILD 0\.[34]/g, "BUILD 0.5");
      }
    }
  }

  function remapAdvancedBot(bot, tier) {
    if (bot.boss || bot.bossClone || bot.noRespawn) return;
    const contract = contracts?.getContract?.(bot.archetype);
    if (!contract || contract.tier <= tier) return;
    const index = Math.floor(Math.random() * advancedFallbacks.length);
    const nextId = advancedFallbacks[index];
    const stats = archetypeStats[nextId];
    const ratio = bot.maxHealth > 0 ? bot.health / bot.maxHealth : 1;
    bot.archetype = nextId;
    bot.roleLabel = stats.roleLabel;
    bot.maxHealth = stats.health;
    bot.health = Math.max(1, Math.round(stats.health * ratio));
    bot.speed = stats.speed;
    bot.baseSpeed = stats.speed;
    bot.attackDamage = stats.damage;
    bot.baseAttackDamage = stats.damage;
    bot.aggression = stats.aggression;
    bot.energyDrain = stats.energyDrain || 0;
    bot.swarmer = Boolean(stats.swarmer);
    bot.sniper = false;
    bot.longRange = false;
    bot.heavyHit = false;
    contracts?.applyContract?.(bot);
    emit("enemy:remapped", { id: bot.id, archetype: nextId, tier });
  }

  function initializeBot(bot, force = false) {
    if (!isBot(bot)) return bot;
    bots.add(bot);
    let record = records.get(bot);
    const generation = `${bot.archetype}:${bot.maxHealth}:${bot.baseSpeed || bot.speed}:${bot.dead ? 1 : 0}`;
    if (record && !force && record.generation === generation) return bot;

    if (!record) record = {};
    record.generation = generation;
    record.previousHealth = bot.health;
    record.previousDead = Boolean(bot.dead);
    record.previousRole = bot.roleLabel;
    record.previousPhasing = Boolean(bot.phasing);
    record.previousStealthed = Boolean(bot.stealthed);
    record.previousCooldown = Number(bot.cooldown) || 0;
    record.previousEnergy = Number(bot.energy) || 0;
    record.baseHealth = Math.max(1, Number(bot.maxHealth) || 1);
    record.baseDamage = Math.max(1, Number(bot.baseAttackDamage || bot.attackDamage) || 1);
    record.baseSpeed = Math.max(1, Number(bot.baseSpeed || bot.speed) || 1);
    record.appliedTier = -1;
    record.elite = false;
    record.dashCount = 0;
    record.spawnedEmitted = false;
    records.set(bot, record);

    bot.homeX ??= bot.x;
    bot.homeY ??= bot.y;
    bot.runtimeStunTimer ??= 0;
    bot.runtimeFleeTimer ??= 0;
    bot.runtimeRestTimer ??= 0;
    bot.runtimeExposedTimer ??= 0;
    contracts?.applyContract?.(bot);
    remapAdvancedBot(bot, runtime.snapshot.tier || 0);
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
      const wrappedFrom = function (...args) {
        const result = nativeFrom.apply(this, args);
        for (const item of result) initializeBot(item);
        return result;
      };
      Object.defineProperty(wrappedFrom, "__echoCombatWrapped", { value: true });
      Array.from = wrappedFrom;
    }

    const nativePush = Array.prototype.push;
    if (!nativePush.__echoCombatWrapped) {
      const wrappedPush = function (...items) {
        for (const item of items) initializeBot(item);
        return nativePush.apply(this, items);
      };
      Object.defineProperty(wrappedPush, "__echoCombatWrapped", { value: true });
      Array.prototype.push = wrappedPush;
    }

    const nativeAssign = Object.assign;
    if (!nativeAssign.__echoCombatWrapped) {
      const wrappedAssign = function (target, ...sources) {
        const result = nativeAssign(target, ...sources);
        if (isBot(result)) initializeBot(result, true);
        return result;
      };
      Object.defineProperty(wrappedAssign, "__echoCombatWrapped", { value: true });
      Object.assign = wrappedAssign;
    }
  }

  function wrapSimulation(api) {
    if (!api || typeof api.steerVelocity !== "function" || api.__echoCombatWrapped) return api;
    const nativeSteer = api.steerVelocity;
    const wrapped = Object.freeze({
      ...api,
      steerVelocity(entity, ...args) {
        if (entity?.id === "player") runtime.player = entity;
        return nativeSteer(entity, ...args);
      },
      __echoCombatWrapped: true
    });
    return wrapped;
  }

  function installSimulationCapture() {
    let current = root.EchoSimulation ? wrapSimulation(root.EchoSimulation) : null;
    try {
      Object.defineProperty(root, "EchoSimulation", {
        configurable: true,
        enumerable: true,
        get() { return current; },
        set(value) { current = wrapSimulation(value); }
      });
    } catch (_error) {
      if (root.EchoSimulation) root.EchoSimulation = wrapSimulation(root.EchoSimulation);
    }
  }

  function applyThreat(bot, snapshot) {
    if (bot.boss || bot.bossClone || bot.noRespawn || bot.dead) return;
    const record = records.get(bot);
    if (!record) return;
    remapAdvancedBot(bot, snapshot.tier);
    if (record.appliedTier === snapshot.tier && record.appliedRecovery === snapshot.recoveryMode) return;

    if (!record.elite && snapshot.eliteChance > 0 && Math.random() < snapshot.eliteChance) {
      record.elite = true;
      bot.elite = true;
      bot.name = `ELITE ${bot.name}`;
      bot.roleLabel = `ELITE // ${bot.roleLabel}`;
      emit("enemy:elite", { id: bot.id, archetype: bot.archetype });
    }

    const eliteHealth = record.elite ? 1.42 : 1;
    const eliteDamage = record.elite ? 1.22 : 1;
    const eliteSpeed = record.elite ? 1.08 : 1;
    const healthRatio = bot.maxHealth > 0 ? Math.max(0, bot.health / bot.maxHealth) : 1;
    bot.maxHealth = Math.max(1, Math.round(record.baseHealth * snapshot.healthScale * eliteHealth));
    bot.health = Math.max(1, Math.min(bot.maxHealth, Math.round(bot.maxHealth * healthRatio)));
    bot.baseAttackDamage = Math.max(1, Math.round(record.baseDamage * snapshot.damageScale * eliteDamage));
    bot.attackDamage = bot.baseAttackDamage;
    bot.baseSpeed = Math.max(1, record.baseSpeed * snapshot.speedScale * eliteSpeed);
    if (bot.archetype !== "berserker" && bot.archetype !== "swarmer") bot.speed = bot.baseSpeed;
    bot.cooldown = Math.max(Number(bot.cooldown) || 0, snapshot.recoveryMode ? 0.8 : 0.2);
    record.appliedTier = snapshot.tier;
    record.appliedRecovery = snapshot.recoveryMode;
  }

  function distanceToPlayer(bot) {
    if (!runtime.player) return Number.POSITIVE_INFINITY;
    return Math.hypot(bot.x - runtime.player.x, bot.y - runtime.player.y);
  }

  function applyArchetypeBehavior(bot, record, dt) {
    const player = runtime.player;
    if (!player || bot.dead || bot.boss || bot.bossClone || bot.phasing) return;

    bot.runtimeStunTimer = Math.max(0, (bot.runtimeStunTimer || 0) - dt);
    bot.runtimeFleeTimer = Math.max(0, (bot.runtimeFleeTimer || 0) - dt);
    bot.runtimeRestTimer = Math.max(0, (bot.runtimeRestTimer || 0) - dt);
    bot.runtimeExposedTimer = Math.max(0, (bot.runtimeExposedTimer || 0) - dt);

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
      if (homeDistance > 260) {
        bot.targetX = bot.homeX;
        bot.targetY = bot.homeY;
      }
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

  function enforceAttackerBudget(snapshot) {
    const player = runtime.player;
    if (!player) return;
    const active = [...bots].filter((bot) => !bot.dead && !bot.boss && bot.phasing).length;
    let available = Math.max(0, snapshot.maxConcurrentAttackers - active);
    const candidates = [...bots]
      .filter((bot) => !bot.dead && !bot.boss && !bot.phasing && (bot.cooldown || 0) <= 0.12)
      .sort((a, b) => distanceToPlayer(a) - distanceToPlayer(b));
    for (const bot of candidates) {
      if (available > 0) {
        available -= 1;
      } else {
        bot.cooldown = Math.max(bot.cooldown, snapshot.recoveryMode ? 0.9 : 0.38);
      }
    }
  }

  function observeBot(bot, record) {
    if (bot.health < record.previousHealth) {
      const rawDamage = record.previousHealth - bot.health;
      if (bot.archetype === "warden" && bot.runtimeGuarding && bot.health > 1) {
        bot.health = Math.min(bot.maxHealth, bot.health + rawDamage * 0.2);
      }
      if (bot.archetype === "phantom" && bot.runtimeExposedTimer > 0 && bot.health > 2) {
        bot.health = Math.max(1, bot.health - rawDamage * 0.22);
      }
      emit("enemy:damaged", { id: bot.id, archetype: bot.archetype, amount: rawDamage, health: bot.health });
    }

    if (!record.previousDead && bot.dead) {
      emit(bot.boss && !bot.bossClone ? "boss:defeated" : "enemy:killed", {
        id: bot.id,
        archetype: bot.archetype,
        name: bot.name
      });
    }

    if (bot.boss && !bot.bossClone && !bot.dead && !record.spawnedEmitted) {
      record.spawnedEmitted = true;
      emit("boss:spawned", { id: bot.id, archetype: bot.archetype, name: bot.name });
    }

    if (bot.boss && record.previousRole && bot.roleLabel !== record.previousRole) {
      emit("boss:phase-changed", { id: bot.id, name: bot.name, phase: bot.roleLabel });
    }

    if (record.previousPhasing && !bot.phasing) {
      if (bot.archetype === "bruiser" || bot.archetype === "bulwark") bot.runtimeStunTimer = 0.72;
      if (bot.archetype === "drainer") bot.runtimeFleeTimer = 1.55;
      if (bot.archetype === "weaver") bot.runtimeStunTimer = 0.42;
    }

    if (bot.archetype === "sprinter" && record.previousCooldown <= 0 && bot.cooldown > 0.7) {
      record.dashCount += 1;
      if (record.dashCount >= 3) {
        record.dashCount = 0;
        bot.runtimeRestTimer = 1.2;
        emit("enemy:resting", { id: bot.id, archetype: bot.archetype });
      }
    }

    if (bot.archetype === "phantom" && record.previousStealthed && !bot.stealthed) {
      bot.runtimeExposedTimer = 1.35;
      emit("enemy:exposed", { id: bot.id, archetype: bot.archetype, duration: 1.35 });
    }

    record.previousHealth = bot.health;
    record.previousDead = Boolean(bot.dead);
    record.previousRole = bot.roleLabel;
    record.previousPhasing = Boolean(bot.phasing);
    record.previousStealthed = Boolean(bot.stealthed);
    record.previousCooldown = Number(bot.cooldown) || 0;
    record.previousEnergy = Number(bot.energy) || 0;
  }

  function observePlayer() {
    const player = runtime.player;
    if (!player) return;
    if (runtime.previousPlayerHealth == null) runtime.previousPlayerHealth = player.health;
    if (player.health < runtime.previousPlayerHealth) {
      emit("player:damaged", {
        amount: runtime.previousPlayerHealth - player.health,
        health: player.health,
        maxHealth: player.maxHealth
      });
    }
    runtime.previousPlayerHealth = player.health;
  }

  function observeRunState() {
    const playingClass = Boolean(root?.document?.body?.classList.contains("is-playing"));
    const gameoverVisible = !root?.document?.querySelector("#gameover-screen")?.classList.contains("is-hidden");
    const active = playingClass && !gameoverVisible;
    if (active && !runtime.runActive) {
      emit("run:started", { seed: root.EchoCore?.seed || null });
    } else if (!active && runtime.runActive) {
      emit("run:finished", {
        score: runtime.player?.score || readNumber("#score-value"),
        kills: runtime.player?.kills || readNumber("#kill-value"),
        time: readClock()
      });
    }
    runtime.runActive = active;
  }

  function installMutationObserver() {
    const target = root?.document?.querySelector("#mutation-slots");
    if (!target || typeof MutationObserver === "undefined") return;
    const sync = () => {
      const names = new Set([...target.querySelectorAll(".mutation-chip")].map((node) => node.textContent.trim()));
      for (const name of names) {
        if (!runtime.mutationNames.has(name)) emit("mutation:selected", { name });
      }
      runtime.mutationNames = names;
    };
    new MutationObserver(sync).observe(target, { childList: true, subtree: true, characterData: true });
    sync();
  }

  function tick(now = 0) {
    const dt = Math.min(0.05, Math.max(0.001, runtime.lastFrameAt ? (now - runtime.lastFrameAt) / 1000 : 0.016));
    runtime.lastFrameAt = now;
    observeRunState();
    observePlayer();

    const player = runtime.player;
    const context = {
      runTime: readClock(),
      stage: Math.floor(readClock() / 85),
      score: player?.score || readNumber("#score-value"),
      kills: player?.kills || readNumber("#kill-value"),
      healthRatio: player ? player.health / Math.max(1, player.maxHealth) : 1,
      bossActive: [...bots].some((bot) => bot.boss && !bot.bossClone && !bot.dead)
    };
    const update = runtime.threat?.update?.(context);
    if (update?.snapshot) runtime.snapshot = update.snapshot;
    if (update?.tierChanged && update.previousTier >= 0) {
      emit("threat:tier-changed", { tier: runtime.snapshot.tier, previousTier: update.previousTier });
    }
    if (runtime.snapshot.recoveryMode !== runtime.lastRecoveryMode) {
      runtime.lastRecoveryMode = runtime.snapshot.recoveryMode;
      emit("threat:recovery-changed", { active: runtime.snapshot.recoveryMode });
    }

    for (const bot of bots) {
      if (!isBot(bot)) continue;
      const record = records.get(bot) || (initializeBot(bot), records.get(bot));
      applyThreat(bot, runtime.snapshot);
      applyArchetypeBehavior(bot, record, dt);
      observeBot(bot, record);
    }
    enforceAttackerBudget(runtime.snapshot);

    root.requestAnimationFrame?.(tick);
  }

  function install() {
    if (runtime.installed || !root) return false;
    runtime.installed = true;
    installCollectionHooks();
    installSimulationCapture();
    if (root.document) {
      updateBuildLabels();
      installMutationObserver();
      root.requestAnimationFrame?.(tick);
    }
    emit("combat:runtime-ready", { version: "0.5.0" });
    return true;
  }

  install();

  return Object.freeze({
    version: "0.5.0",
    install,
    isBot,
    initializeBot,
    getSnapshot: () => runtime.snapshot,
    getTrackedBotCount: () => bots.size
  });
});
