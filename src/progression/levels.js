/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0118__*/
  const LEVEL_CONFIG = Object.freeze({
    maxLevel: 25,
    baseExperience: 28,
    experienceGrowth: 1.24,
    player: Object.freeze({
      radiusPerLevel: 0.042,
      maxRadiusScale: 1.82,
      healthPerLevel: 0.055,
      damagePerLevel: 0.062,
      reachPerLevel: 0.018,
      speedLossPerLevel: 0.006,
      minimumSpeedScale: 0.84
    }),
    bot: Object.freeze({
      radiusPerLevel: 0.038,
      maxRadiusScale: 1.7,
      healthPerLevel: 0.047,
      damagePerLevel: 0.055,
      speedLossPerLevel: 0.0045,
      minimumSpeedScale: 0.87
    }),
    moteExperience: Object.freeze({ cyan: 4, violet: 13, gold: 20, red: 8 }),
    rareBoostDuration: 6,
    rareBoostMultiplier: 1.12,
    dropFraction: 0.34,
    maxDropMotes: 18,
    botThinkInterval: 0.34,
    botDangerRadius: 310,
    botHuntRadius: 390
  });

  const BOSS_SIZE_SCALES = Object.freeze({
    "coroa-vazia": 1.85,
    "espectro-decisivo": 1.72,
    "tremor-deep": 2.05,
    necrostro: 1.76,
    vortice: 1.82,
    cicatriz: 1.68,
    mimico: 1.62,
    prisma: 1.7,
    silenciador: 1.76
  });

  let levelHud = null;

  function experienceForLevel(level) {
    return Math.max(1, Math.round(LEVEL_CONFIG.baseExperience * LEVEL_CONFIG.experienceGrowth ** Math.max(0, level - 1)));
  }

  function experienceValueForMote(type, spectral = false) {
    const base = LEVEL_CONFIG.moteExperience[type] || LEVEL_CONFIG.moteExperience.cyan;
    return Math.max(1, Math.round(base * (spectral ? 0.78 : 1)));
  }

  function initializeLevelProgression(entity, kind = "bot") {
    if (!entity || entity.levelInitialized) return entity;
    const baseDamage = kind === "player"
      ? Number(entity.trailDamage || 1)
      : Number(entity.baseAttackDamage || entity.attackDamage || 1);
    Object.assign(entity, {
      levelInitialized: true,
      levelKind: kind,
      level: 1,
      experience: 0,
      experienceToNext: experienceForLevel(1),
      levelBaseRadius: Number(entity.radius || 16),
      levelBaseMaxHealth: Number(entity.maxHealth || entity.health || 1),
      levelBaseDamage: Math.max(1, baseDamage),
      levelBasePhaseSpeed: Number(entity.phaseSpeed || 0),
      levelScale: 1,
      levelSpeedScale: 1,
      rareBoostTimer: 0,
      rareBoostMultiplier: 1,
      levelPulseTimer: 0,
      resourceThinkTimer: 0,
      resourceMode: null
    });
    applyLevelGrowth(entity, false);
    return entity;
  }

  function applyLevelGrowth(entity, healDifference = true) {
    if (!entity?.levelInitialized || entity.boss) return entity;
    const config = entity.levelKind === "player" ? LEVEL_CONFIG.player : LEVEL_CONFIG.bot;
    const steps = Math.max(0, entity.level - 1);
    const oldMaxHealth = Math.max(1, Number(entity.maxHealth) || entity.levelBaseMaxHealth);
    const scale = Math.min(config.maxRadiusScale, 1 + steps * config.radiusPerLevel);
    const healthScale = 1 + steps * config.healthPerLevel;
    const damageScale = 1 + steps * config.damagePerLevel;
    const speedScale = Math.max(config.minimumSpeedScale, 1 - steps * config.speedLossPerLevel);
    const nextMaxHealth = Math.max(1, Math.round(entity.levelBaseMaxHealth * healthScale));

    entity.levelScale = scale;
    entity.levelSpeedScale = speedScale;
    entity.radius = entity.levelBaseRadius * scale;
    entity.maxHealth = nextMaxHealth;
    if (healDifference && nextMaxHealth > oldMaxHealth) entity.health += nextMaxHealth - oldMaxHealth;
    entity.health = clamp(entity.health, 0, nextMaxHealth);

    if (entity.levelKind === "player") {
      entity.trailDamage = entity.levelBaseDamage * damageScale;
      entity.phaseSpeed = entity.levelBasePhaseSpeed * (1 + steps * config.reachPerLevel);
      entity.pickupRadius = Math.max(entity.pickupRadius || 0, steps * 1.2 + playerUpgrades.collection * 5);
    } else {
      entity.baseAttackDamage = Math.max(1, entity.levelBaseDamage * damageScale);
      entity.attackDamage = entity.baseAttackDamage;
    }
    return entity;
  }

  function emitLevelEvent(name, entity, extra = {}) {
    try {
      window.EchoCore?.events?.emit(name, {
        id: entity.id,
        level: entity.level,
        experience: entity.experience,
        ...extra
      });
    } catch (_error) {}
  }

  function gainExperience(entity, amount, source = "mote") {
    if (!entity || entity.boss || entity.dead) return 0;
    initializeLevelProgression(entity, entity === player ? "player" : "bot");
    if (entity.level >= LEVEL_CONFIG.maxLevel) {
      entity.experience = 0;
      return 0;
    }
    const boost = entity.rareBoostTimer > 0 ? entity.rareBoostMultiplier : 1;
    const granted = Math.max(0, Math.round(Number(amount || 0) * boost));
    entity.experience += granted;
    emitLevelEvent("progression:experience", entity, { amount: granted, source });

    let levelsGained = 0;
    while (entity.level < LEVEL_CONFIG.maxLevel && entity.experience >= entity.experienceToNext) {
      entity.experience -= entity.experienceToNext;
      entity.level += 1;
      entity.experienceToNext = experienceForLevel(entity.level);
      levelsGained += 1;
    }
    if (entity.level >= LEVEL_CONFIG.maxLevel) entity.experience = 0;

    if (levelsGained > 0) {
      applyLevelGrowth(entity, true);
      entity.levelPulseTimer = 1.1;
      emitLevelEvent("progression:level-up", entity, { levelsGained, source });
      if (entity === player) {
        showToast(`NÍVEL ${entity.level} ALCANÇADO`, 1700);
        spawnWave(entity.x, entity.y, entity.hue, 105 + entity.radius, 0.7);
        burst(entity.x, entity.y, entity.hue, 18);
        sound(330 + Math.min(220, entity.level * 8), 0.3, "triangle", 0.05);
      } else {
        spawnWave(entity.x, entity.y, entity.hue, 55 + entity.radius, 0.4);
        burst(entity.x, entity.y, entity.hue, 7);
      }
    }
    return granted;
  }

  function updateLevelProgression(entity, dt) {
    if (!entity || entity.boss || entity.dead) return;
    initializeLevelProgression(entity, entity === player ? "player" : "bot");
    entity.rareBoostTimer = Math.max(0, entity.rareBoostTimer - dt);
    entity.rareBoostMultiplier = entity.rareBoostTimer > 0 ? LEVEL_CONFIG.rareBoostMultiplier : 1;
    entity.levelPulseTimer = Math.max(0, entity.levelPulseTimer - dt);
  }

  function entityPower(entity) {
    const level = Number(entity?.level || 1);
    const healthRatio = clamp(Number(entity?.health || 0) / Math.max(1, Number(entity?.maxHealth || 1)), 0, 1);
    const damage = Number(entity?.attackDamage || entity?.trailDamage || 1);
    return level * 16 + damage * 0.7 + healthRatio * 24 + (entity?.boss ? 300 : 0);
  }

  function hostileEntitiesFor(bot) {
    return [player, ...bots].filter((entity) => (
      entity
      && entity !== bot
      && !entity.dead
      && (entity === player || entity.boss || entity.faction !== bot.faction)
    ));
  }

  function nearestDanger(bot, hostiles = hostileEntitiesFor(bot)) {
    let danger = null;
    let bestDistance = Infinity;
    const ownPower = entityPower(bot);
    const dangerRadiusSq = LEVEL_CONFIG.botDangerRadius * LEVEL_CONFIG.botDangerRadius;
    for (const entity of hostiles) {
      const distanceSquared = distanceSq(entity.x, entity.y, bot.x, bot.y);
      if (distanceSquared > dangerRadiusSq || entityPower(entity) < ownPower * 1.22) continue;
      if (distanceSquared < bestDistance) {
        bestDistance = distanceSquared;
        danger = entity;
      }
    }
    return danger ? { entity: danger, distance: Math.sqrt(bestDistance) } : null;
  }

  function weakestHuntTarget(bot, hostiles = hostileEntitiesFor(bot)) {
    if (bot.health < bot.maxHealth * 0.48) return null;
    const ownPower = entityPower(bot);
    let target = null;
    let bestUtility = -Infinity;
    const huntRadiusSq = LEVEL_CONFIG.botHuntRadius * LEVEL_CONFIG.botHuntRadius;
    for (const entity of hostiles) {
      if (entity.boss) continue;
      const distanceSquared = distanceSq(entity.x, entity.y, bot.x, bot.y);
      if (distanceSquared > huntRadiusSq) continue;
      const targetPower = entityPower(entity);
      if (targetPower > ownPower * 0.78) continue;
      const distance = Math.sqrt(distanceSquared);
      const utility = (ownPower - targetPower) * 2.2 - distance * 0.14;
      if (utility > bestUtility) {
        bestUtility = utility;
        target = entity;
      }
    }
    return target ? { target, utility: bestUtility } : null;
  }

  function chooseBotResourceTarget(bot) {
    if (!bot || bot.dead || bot.boss || bot.phasing) return null;
    const healthRatio = bot.health / Math.max(1, bot.maxHealth);
    const hostiles = hostileEntitiesFor(bot);
    const danger = nearestDanger(bot, hostiles);
    if ((healthRatio < 0.28 || danger?.distance < 175) && danger) {
      const dx = bot.x - danger.entity.x;
      const dy = bot.y - danger.entity.y;
      const distance = Math.hypot(dx, dy) || 1;
      return {
        mode: "flee",
        x: clamp(bot.x + dx / distance * 420, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
        y: clamp(bot.y + dy / distance * 420, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
        utility: 1000
      };
    }

    const hunt = weakestHuntTarget(bot, hostiles);
    if (hunt && bot.aggression > 0.52) {
      return {
        mode: "hunt",
        x: hunt.target.x + (hunt.target.vx || 0) * 0.55,
        y: hunt.target.y + (hunt.target.vy || 0) * 0.55,
        target: hunt.target,
        utility: hunt.utility
      };
    }

    if (motes.length === 0) return null;
    let best = null;
    let bestUtility = -Infinity;
    const ownPower = entityPower(bot);
    for (const mote of queryMotes(bot.x, bot.y, 900)) {
      const distance = Math.hypot(mote.x - bot.x, mote.y - bot.y);
      const value = experienceValueForMote(mote.type);
      let utility = value * 24 - distance * 0.12;
      if (mote.type === "violet") utility += 125;
      if (mote.type === "gold") utility += 82;
      if (mote.type === "red" && healthRatio < 0.55) utility -= 160;
      if (danger) {
        const moteDangerDistance = Math.hypot(mote.x - danger.entity.x, mote.y - danger.entity.y);
        if (moteDangerDistance < 230 && entityPower(danger.entity) > ownPower) utility -= 220;
      }
      if (utility > bestUtility) {
        bestUtility = utility;
        best = mote;
      }
    }
    return best ? { mode: "forage", x: best.x, y: best.y, mote: best, utility: bestUtility } : null;
  }

  function updateBotProgression(dt) {
    for (const bot of bots) {
      if (bot.dead || bot.boss || bot.bossClone || bot.noRespawn) continue;
      updateLevelProgression(bot, dt);
      const speedBoost = bot.rareBoostTimer > 0 ? 1.06 : 1;
      if (!bot.swarmer && bot.archetype !== "berserker") {
        bot.speed = (bot.baseSpeed || bot.speed) * (bot.levelSpeedScale || 1) * speedBoost;
      }
      bot.resourceThinkTimer = Math.max(0, (bot.resourceThinkTimer || 0) - dt);
      if (bot.resourceThinkTimer > 0 || bot.phasing) continue;
      bot.resourceThinkTimer = LEVEL_CONFIG.botThinkInterval + Math.random() * 0.18;
      const decision = chooseBotResourceTarget(bot);
      if (!decision) continue;
      bot.resourceMode = decision.mode;
      bot.targetX = clamp(decision.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.targetY = clamp(decision.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.factionTarget = decision.mode === "hunt" && decision.target !== player ? decision.target : null;
      bot.thinkTimer = Math.max(bot.thinkTimer, decision.mode === "flee" ? 0.48 : 0.28);
      if (decision.mode === "flee") bot.cooldown = Math.max(bot.cooldown, 0.35);
    }
  }

  function dropExperienceMotes(entity, multiplier = 1) {
    if (!entity || entity.prismaIllusion) return 0;
    const stored = Number(entity.experience || 0) + Math.max(0, Number(entity.level || 1) - 1) * 18;
    const budget = Math.max(0, Math.round(stored * LEVEL_CONFIG.dropFraction * multiplier));
    const minimum = entity.boss ? 10 : 2;
    const count = Math.round(clamp(Math.ceil(budget / 7), minimum, LEVEL_CONFIG.maxDropMotes));
    for (let index = 0; index < count; index += 1) {
      const mote = createMote();
      mote.x = clamp(entity.x + random(-58, 58), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      mote.y = clamp(entity.y + random(-58, 58), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      const ratio = index / Math.max(1, count - 1);
      mote.type = ratio < 0.18 ? "gold" : ratio < 0.52 ? "violet" : "cyan";
      mote.droppedExperience = true;
      appendIndexedMote(mote);
    }
    return count;
  }

  function averageCombatLevel() {
    const living = bots.filter((bot) => !bot.dead && !bot.boss && !bot.bossClone);
    const levels = [Number(player.level || 1), ...living.map((bot) => Number(bot.level || 1))];
    return levels.reduce((sum, level) => sum + level, 0) / Math.max(1, levels.length);
  }

  function scaleBossForRun(boss) {
    const averageLevel = averageCombatLevel();
    const livingLevels = bots.filter((bot) => !bot.dead).map((bot) => Number(bot.level || 1));
    const highestLevel = Math.max(Number(player.level || 1), ...livingLevels);
    const levelPressure = Math.max(0, averageLevel - 1) * 0.045 + Math.max(0, highestLevel - averageLevel) * 0.018;
    const stagePressure = Math.max(0, Number(soloStage || 0)) * 0.08;
    const healthScale = 1 + levelPressure + stagePressure;
    const damageScale = 1 + levelPressure * 0.62 + stagePressure * 0.7;
    boss.health = Math.round(boss.health * healthScale);
    boss.maxHealth = boss.health;
    boss.attackDamage = Math.max(1, Math.round(boss.attackDamage * damageScale));
    boss.baseAttackDamage = boss.attackDamage;
    boss.encounterLevel = Math.max(1, Math.round(averageLevel + Number(soloStage || 0)));
    return boss;
  }

  function ensureLevelHud() {
    if (levelHud?.root?.isConnected) return levelHud;
    const vitals = document.querySelector(".vitals");
    if (!vitals) return null;
    const root = document.createElement("div");
    root.className = "level-progress";
    root.innerHTML = '<div class="metric-row"><span>NÍVEL</span><strong data-level>1</strong></div><div class="meter level-meter"><i data-level-fill></i></div><small data-level-copy>0 / 28 XP</small>';
    const style = document.createElement("style");
    style.textContent = ".level-progress{margin-top:10px}.level-progress small{display:block;margin-top:5px;font-size:10px;letter-spacing:.12em;color:rgba(222,250,255,.7)}.level-meter i{background:linear-gradient(90deg,#45e6ff,#8b5cf6,#ff4fd8)}";
    document.head.append(style);
    const chargeMeter = vitals.querySelector(".charge-meter");
    if (chargeMeter) chargeMeter.insertAdjacentElement("afterend", root);
    else vitals.prepend(root);
    levelHud = {
      root,
      level: root.querySelector("[data-level]"),
      fill: root.querySelector("[data-level-fill]"),
      copy: root.querySelector("[data-level-copy]")
    };
    return levelHud;
  }

  function updateLevelHud() {
    const hud = ensureLevelHud();
    if (!hud || !player?.levelInitialized) return;
    const ratio = player.level >= LEVEL_CONFIG.maxLevel ? 1 : clamp(player.experience / Math.max(1, player.experienceToNext), 0, 1);
    setTextIfChanged(hud.level, player.level);
    setStyleIfChanged(hud.fill, "width", `${Math.round(ratio * 1000) / 10}%`);
    setTextIfChanged(hud.copy, player.level >= LEVEL_CONFIG.maxLevel
      ? "NÍVEL MÁXIMO"
      : `${Math.floor(player.experience)} / ${player.experienceToNext} XP${player.rareBoostTimer > 0 ? " // IMPULSO ROXO" : ""}`);
  }

  for (const template of bossTemplates) {
    if (template.levelSizeApplied) continue;
    const scale = BOSS_SIZE_SCALES[template.id] || 1.7;
    template.levelSizeApplied = true;
    template.sizeScale = scale;
    template.radius = Math.round((template.radius || template.phases[0].radius) * scale);
    for (const phase of template.phases) phase.radius = Math.round(phase.radius * scale);
  }

  const spawnSoloBossWithoutLevelScaling = spawnSoloBoss;
  spawnSoloBoss = function spawnSoloBossWithLevelScaling(templateId = null) {
    const previousBoss = activeBoss;
    const result = spawnSoloBossWithoutLevelScaling(templateId);
    if (activeBoss && activeBoss !== previousBoss) scaleBossForRun(activeBoss);
    return result;
  };

  const killBotWithoutExperienceDrops = killBot;
  killBot = function killBotWithExperienceDrops(bot, owner = null) {
    const wasDead = Boolean(bot?.dead);
    const prismaShellSplit = Boolean(bot?.archetype === "prisma" && bot?.boss && !bot?.prismaFragment && !bot?.prismaSplit);
    const result = killBotWithoutExperienceDrops(bot, owner);
    if (!wasDead && bot?.dead && !bot.prismaIllusion && !prismaShellSplit) {
      dropExperienceMotes(bot, bot.boss ? 1.45 : 1);
      if (owner && owner !== bot && !owner.dead && !owner.boss) {
        const killExperience = bot.boss ? 80 : Math.max(8, 8 + Number(bot.level || 1) * 3);
        gainExperience(owner, killExperience, bot.boss ? "boss:defeated" : "enemy:defeated");
      }
    }
    return result;
  };

/*__ECHO_SECTION_END:0118__*/
