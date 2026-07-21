/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0046__*/
  function runLevelConfig() {
    return {
      maxLevel: 20,
      baseExperience: 14,
      experienceExponent: 1.32,
      scalePerLevel: 0.045,
      maxScale: 1.72,
      healthPerLevel: 0.075,
      damagePerLevel: 0.055,
      rangePerLevel: 0.02,
      speedPenaltyPerLevel: 0.006,
      maxSpeedPenalty: 0.12,
      pickupPerLevel: 1.6,
      dropFraction: 0.32,
      maxDropValue: 72,
      maxDropMotes: 18
    };
  }

  function clampRunValue(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function runExperienceForLevel(level) {
    const config = runLevelConfig();
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return Math.max(1, Math.floor(config.baseExperience * safeLevel ** config.experienceExponent));
  }

  function moteRunExperience(type) {
    if (type === "gold") return 12;
    if (type === "violet") return 7;
    if (type === "red") return 4;
    return 2;
  }

  function initializeRunProgression(entity, options = {}) {
    if (!entity) return entity;
    const enabled = options.enabled !== false && !entity.boss;
    const startLevel = clampRunValue(Math.floor(Number(options.level) || 1), 1, runLevelConfig().maxLevel);
    entity.runProgressionEnabled = enabled;
    entity.level = startLevel;
    entity.experience = Math.max(0, Number(options.experience) || 0);
    entity.totalExperience = Math.max(entity.experience, Number(options.totalExperience) || 0);
    entity.experienceToNext = enabled && startLevel < runLevelConfig().maxLevel ? runExperienceForLevel(startLevel) : 0;
    entity.baseRadius = Number(options.baseRadius ?? entity.baseRadius ?? entity.radius) || 1;
    entity.baseMaxHealth = Number(options.baseMaxHealth ?? entity.baseMaxHealth ?? entity.maxHealth) || 1;
    entity.baseRunDamage = Number(options.baseDamage ?? entity.baseRunDamage ?? entity.trailDamage ?? entity.attackDamage) || 0;
    entity.baseRunSpeed = Number(options.baseSpeed ?? entity.baseRunSpeed ?? entity.moveSpeed ?? entity.speed) || 0;
    entity.baseRunPhaseSpeed = Number(options.basePhaseSpeed ?? entity.baseRunPhaseSpeed ?? entity.phaseSpeed) || 0;
    entity.baseRunPickupRadius = Number(options.basePickupRadius ?? entity.baseRunPickupRadius ?? entity.pickupRadius) || 0;
    entity.growthScale = 1;
    entity.powerScale = 1;
    entity.rangeScale = 1;
    entity.runSpeedScale = 1;
    entity.levelPulse = 0;
    if (enabled) applyRunLevelStats(entity, { preserveHealthRatio: false });
    return entity;
  }

  function applyRunLevelStats(entity, options = {}) {
    if (!entity?.runProgressionEnabled) return entity;
    const config = runLevelConfig();
    const preserveHealthRatio = options.preserveHealthRatio !== false;
    const healOnLevel = Boolean(options.healOnLevel);
    const levelOffset = Math.max(0, entity.level - 1);
    const previousMaxHealth = Math.max(1, Number(entity.maxHealth) || entity.baseMaxHealth || 1);
    const previousHealth = clampRunValue(Number(entity.health) || previousMaxHealth, 0, previousMaxHealth);
    const healthRatio = previousHealth / previousMaxHealth;
    const scale = clampRunValue(1 + levelOffset * config.scalePerLevel, 1, config.maxScale);
    const healthScale = 1 + levelOffset * config.healthPerLevel;
    const damageScale = 1 + levelOffset * config.damagePerLevel;
    const rangeScale = 1 + levelOffset * config.rangePerLevel;
    const speedPenalty = Math.min(config.maxSpeedPenalty, levelOffset * config.speedPenaltyPerLevel);
    const speedScale = 1 - speedPenalty;
    const nextMaxHealth = Math.max(1, entity.baseMaxHealth * healthScale);

    entity.growthScale = scale;
    entity.powerScale = damageScale;
    entity.rangeScale = rangeScale;
    entity.runSpeedScale = speedScale;
    entity.radius = entity.baseRadius * scale;
    entity.maxHealth = nextMaxHealth;
    if (preserveHealthRatio) {
      const preserved = healthRatio * nextMaxHealth;
      const levelHeal = healOnLevel ? Math.max(0, nextMaxHealth - previousMaxHealth) * 0.7 : 0;
      entity.health = clampRunValue(Math.max(preserved, previousHealth + levelHeal), 0, nextMaxHealth);
    } else {
      entity.health = nextMaxHealth;
    }
    if (Object.prototype.hasOwnProperty.call(entity, "trailDamage")) entity.trailDamage = entity.baseRunDamage * damageScale;
    if (Object.prototype.hasOwnProperty.call(entity, "attackDamage")) entity.attackDamage = entity.baseRunDamage * damageScale;
    if (Object.prototype.hasOwnProperty.call(entity, "moveSpeed")) entity.moveSpeed = entity.baseRunSpeed * speedScale;
    if (Object.prototype.hasOwnProperty.call(entity, "speed")) entity.speed = entity.baseRunSpeed * speedScale;
    if (Object.prototype.hasOwnProperty.call(entity, "phaseSpeed")) entity.phaseSpeed = entity.baseRunPhaseSpeed * speedScale * Math.sqrt(rangeScale);
    if (Object.prototype.hasOwnProperty.call(entity, "pickupRadius")) entity.pickupRadius = entity.baseRunPickupRadius + levelOffset * config.pickupPerLevel;
    entity.experienceToNext = entity.level < config.maxLevel ? runExperienceForLevel(entity.level) : 0;
    return entity;
  }

  function grantRunExperience(entity, amount) {
    const gained = Math.max(0, Number(amount) || 0);
    const config = runLevelConfig();
    const result = {
      amount: gained,
      levelsGained: 0,
      previousLevel: Number(entity?.level) || 1,
      level: Number(entity?.level) || 1,
      experience: Number(entity?.experience) || 0,
      experienceToNext: Number(entity?.experienceToNext) || 0
    };
    if (!entity?.runProgressionEnabled || gained <= 0) return result;

    entity.totalExperience = Math.max(0, Number(entity.totalExperience) || 0) + gained;
    entity.experience = Math.max(0, Number(entity.experience) || 0) + gained;
    while (entity.level < config.maxLevel) {
      const needed = runExperienceForLevel(entity.level);
      if (entity.experience < needed) break;
      entity.experience -= needed;
      entity.level += 1;
      result.levelsGained += 1;
    }
    if (entity.level >= config.maxLevel) entity.experience = 0;
    if (result.levelsGained > 0) {
      applyRunLevelStats(entity, { preserveHealthRatio: true, healOnLevel: true });
      entity.levelPulse = 1;
    } else {
      entity.experienceToNext = runExperienceForLevel(entity.level);
    }
    result.level = entity.level;
    result.experience = entity.experience;
    result.experienceToNext = entity.experienceToNext;
    return result;
  }

  function notifyRunLevelGain(entity, result) {
    if (!result?.levelsGained) return;
    const isPlayer = entity === player;
    if (isPlayer) {
      showToast(`NÍVEL ${entity.level} // SINAL AMPLIFICADO`, 1800);
      sound(520, 0.18, "triangle", 0.045);
      window.setTimeout(() => sound(780, 0.22, "sine", 0.035), 70);
      spawnWave(entity.x, entity.y, entity.hue, 92 + entity.level * 3, 0.55);
      burst(entity.x, entity.y, entity.hue, 14);
    } else {
      burst(entity.x, entity.y, entity.hue, 8);
      spawnWave(entity.x, entity.y, entity.hue, 48 + entity.level * 2, 0.35);
    }
  }

  function runExperienceDropTypes(totalExperience, level = 1) {
    const config = runLevelConfig();
    let budget = Math.min(
      config.maxDropValue,
      Math.floor(Math.max(0, Number(totalExperience) || 0) * config.dropFraction) + Math.max(0, Number(level) - 1) * 2
    );
    const drops = [];
    while (budget >= 12 && drops.length < config.maxDropMotes) {
      drops.push("gold");
      budget -= 12;
    }
    while (budget >= 7 && drops.length < config.maxDropMotes) {
      drops.push("violet");
      budget -= 7;
    }
    while (budget >= 2 && drops.length < config.maxDropMotes) {
      drops.push("cyan");
      budget -= 2;
    }
    if (drops.length === 0 && Number(level) > 1) drops.push("cyan");
    return drops;
  }

  function spawnRunExperienceDrops(entity, x = entity.x, y = entity.y) {
    const types = runExperienceDropTypes(entity.totalExperience, entity.level);
    for (const type of types) {
      const mote = createMote();
      mote.x = clamp(x + random(-52, 52), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      mote.y = clamp(y + random(-52, 52), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      mote.type = type;
      motes.push(mote);
    }
    return types.length;
  }

  function runEntityPower(entity) {
    if (!entity || entity.dead) return 0;
    const level = Math.max(1, Number(entity.level) || 1);
    const healthRatio = clampRunValue((Number(entity.health) || 0) / Math.max(1, Number(entity.maxHealth) || 1), 0, 1);
    const bossBonus = entity.boss ? 8 : 0;
    return level * 1.8 + healthRatio * 4 + (Number(entity.powerScale) || 1) * 2 + bossBonus;
  }

  function chooseBotTacticalIntent(bot) {
    if (!bot || bot.dead || bot.boss) return null;
    const botPower = runEntityPower(bot);
    const healthRatio = clampRunValue(bot.health / Math.max(1, bot.maxHealth), 0, 1);
    const threats = [player, ...bots.filter((other) => other !== bot && !other.dead && other.faction !== bot.faction)];
    let nearestThreat = null;
    let nearestThreatDistance = Infinity;
    let bestOpportunity = null;
    let bestOpportunityDistance = Infinity;

    for (const threat of threats) {
      if (!threat || threat.dead) continue;
      const threatDistance = Math.hypot(bot.x - threat.x, bot.y - threat.y);
      const threatPower = runEntityPower(threat);
      if (threatDistance < nearestThreatDistance && threatPower > botPower * 1.12) {
        nearestThreat = threat;
        nearestThreatDistance = threatDistance;
      }
      const threatHealthRatio = clampRunValue(threat.health / Math.max(1, threat.maxHealth), 0, 1);
      if (threatDistance < bestOpportunityDistance && (threatPower < botPower * 0.82 || threatHealthRatio < 0.3)) {
        bestOpportunity = threat;
        bestOpportunityDistance = threatDistance;
      }
    }

    if (nearestThreat && nearestThreatDistance < (healthRatio < 0.35 ? 560 : 360)) {
      const dx = bot.x - nearestThreat.x;
      const dy = bot.y - nearestThreat.y;
      const distance = Math.hypot(dx, dy) || 1;
      return {
        type: "flee",
        x: clamp(bot.x + dx / distance * 420 + random(-70, 70), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
        y: clamp(bot.y + dy / distance * 420 + random(-70, 70), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
        target: nearestThreat
      };
    }

    if (bestOpportunity && bestOpportunityDistance < 430 && bot.aggression > 0.48 && healthRatio > 0.38) {
      return {
        type: "attack",
        x: bestOpportunity.x + (bestOpportunity.vx || 0) * 0.55,
        y: bestOpportunity.y + (bestOpportunity.vy || 0) * 0.55,
        target: bestOpportunity
      };
    }

    let bestMote = null;
    let bestScore = -Infinity;
    const stride = Math.max(1, Math.floor(motes.length / 72));
    const start = Math.floor(Math.random() * stride);
    for (let index = start; index < motes.length; index += stride) {
      const mote = motes[index];
      if (!mote) continue;
      const distance = Math.hypot(bot.x - mote.x, bot.y - mote.y);
      let score = moteRunExperience(mote.type) * 92 - distance * 0.14;
      if (mote.type === "violet") score += 90;
      if (mote.type === "gold") score += 120;
      if (mote.type === "red" && healthRatio < 0.72) score -= 150;
      for (const threat of threats.slice(0, 10)) {
        if (!threat || threat.dead) continue;
        const threatDistance = Math.hypot(threat.x - mote.x, threat.y - mote.y);
        if (threatDistance < 260) score -= (260 - threatDistance) * Math.max(0.25, runEntityPower(threat) / Math.max(1, botPower)) * 0.7;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMote = mote;
      }
    }
    if (bestMote) return { type: "resource", x: bestMote.x, y: bestMote.y, target: bestMote };
    return null;
  }

  function calculateBossRunScaling(template, entities = [], stage = 0, elapsed = 0) {
    const candidates = entities.filter((entity) => entity && !entity.dead && !entity.boss);
    const levels = candidates.map((entity) => Math.max(1, Number(entity.level) || 1));
    const averageLevel = levels.length ? levels.reduce((sum, level) => sum + level, 0) / levels.length : 1;
    const highestLevel = levels.length ? Math.max(...levels) : 1;
    const safeStage = Math.max(0, Number(stage) || 0);
    const bossLevel = clampRunValue(Math.round(2 + averageLevel + safeStage * 1.5), 3, runLevelConfig().maxLevel);
    return {
      level: bossLevel,
      averageLevel,
      highestLevel,
      healthScale: clampRunValue(1 + (averageLevel - 1) * 0.08 + safeStage * 0.12 + Math.min(0.2, Math.max(0, elapsed) / 900), 1, 2.5),
      damageScale: clampRunValue(1 + (averageLevel - 1) * 0.035 + safeStage * 0.04, 1, 1.8),
      speedScale: clampRunValue(1 + (averageLevel - 1) * 0.006, 1, 1.12),
      sizeScale: (Number(template?.scale) || 2) * clampRunValue(1 + (bossLevel - 1) * 0.008, 1, 1.12)
    };
  }

  async function loadProfile() {
    try {
      const profile = await requestJson(`/api/profile?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      ui.profileSummary.innerHTML = `<strong>RECORDE SOLO ${profile.solo.best_score}</strong> · ${profile.solo.runs} RUNS · <strong>${profile.multiplayer.total_kills} RUPTURAS ONLINE</strong> · <strong style="color:#ffd86b">${profile.resonance} ♦</strong> · <strong style="color:#45e6ff">${profile.skillPoints} ◈</strong>`;
      playerSkillPoints = profile.skillPoints || 0;
      playerOwnedMutations = profile.ownedMutations || {};
      playerLoadout = profile.loadout || [null, null, null, null];
    } catch {
      ui.profileSummary.textContent = "Inicie com npm start para ativar banco local e multiplayer.";
    }
  }

  async function loadUpgrades() {
    try {
      const data = await requestJson(`/api/upgrades?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
    } catch {
      playerResonance = 0;
      playerUpgrades = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    }
  }

  async function purchaseUpgrade(type) {
    try {
      const data = await requestJson("/api/upgrades", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), upgradeType: type })
      });
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
      updateWorkshopUI();
      sound(520, 0.25, "triangle", 0.04);
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  const UPGRADE_META = {
    core: { name: "NÚCLEO", symbol: "♥", description: "+5 vida máxima por nível", color: "#ff4fd8" },
    charge: { name: "CARGA", symbol: "⚡", description: "+10 energia máxima por nível", color: "#45e6ff" },
    calibration: { name: "CALIBRAÇÃO", symbol: "◎", description: "-8% cooldown base por nível", color: "#78ffba" },
    collection: { name: "COLETA", symbol: "◉", description: "+5px raio de coleta por nível", color: "#b792ff" },
    regeneration: { name: "REGENERAÇÃO", symbol: "∞", description: "+0.3 HP/s passivo por nível", color: "#ff8cb7" }
  };
  const UPGRADE_COSTS = [15, 30, 50, 80, 120];

  function updateWorkshopUI() {
    if (ui.workshopResonance) ui.workshopResonance.textContent = playerResonance;
    if (!ui.upgradeCards) return;
    ui.upgradeCards.replaceChildren();
    for (const [type, meta] of Object.entries(UPGRADE_META)) {
      const level = playerUpgrades[type];
      const cost = level < 5 ? UPGRADE_COSTS[level] : null;
      const canAfford = cost !== null && playerResonance >= cost;
      const isMaxed = level >= 5;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `upgrade-card${isMaxed ? " is-maxed" : ""}`;
      card.style.setProperty("--card-color", meta.color);
      card.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true" style="--card-color:${meta.color}">${meta.symbol}</span>
        <small style="color:${meta.color}">NÍVEL ${level}/5</small>
        <h3>${meta.name}</h3>
        <p>${meta.description}</p>
        <div class="level-bar">${Array.from({ length: 5 }, (_, i) => `<div class="level-pip${i < level ? " is-filled" : ""}" style="--pip-color:${meta.color}"></div>`).join("")}</div>
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} ♦`}</span>
      `;
      if (!isMaxed && canAfford) {
        card.addEventListener("click", () => purchaseUpgrade(type));
      }
      ui.upgradeCards.append(card);
    }
  }

  const SKILL_MUTATION_COSTS = [8, 12, 12, 10, 14, 10, 8, 10, 14, 12, 14, 12, 10, 16, 14, 14, 16];
  const SKILL_UPGRADE_COSTS = [[20, 35], [28, 48], [28, 48], [22, 38], [32, 55], [22, 38], [18, 30], [22, 38], [32, 55], [28, 48], [32, 55], [28, 48], [22, 38], [36, 62], [32, 55], [32, 55], [36, 62]];

  function openSkillShop() {
    updateSkillShopUI();
    ui.skillShop.classList.remove("is-hidden");
    sound(262, 0.3, "sine", 0.03);
  }

  function closeSkillShop() {
    ui.skillShop.classList.add("is-hidden");
    loadProfile();
  }

  function updateSkillShopUI() {
    if (ui.skillShopPoints) ui.skillShopPoints.textContent = playerSkillPoints;
    if (!ui.skillShopCards) return;
    ui.skillShopCards.replaceChildren();
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      const owned = playerOwnedMutations[mutation.id];
      const isOwned = !!owned;
      const level = owned || 0;
      const isMaxed = level >= 3;
      let cost = 0;
      let canAfford = false;
      let action = "";
      if (!isOwned) {
        cost = SKILL_MUTATION_COSTS[i];
        canAfford = playerSkillPoints >= cost;
        action = "DESBLOQUEAR";
      } else if (!isMaxed) {
        cost = SKILL_UPGRADE_COSTS[i][level - 1];
        canAfford = playerSkillPoints >= cost;
        action = `UPGRADE NÍVEL ${["I", "II", "III"][level]}`;
      }
      const card = document.createElement("button");
      card.type = "button";
      card.className = `skill-card${isMaxed ? " is-maxed" : ""}${!isOwned ? " is-locked" : ""}`;
      card.style.setProperty("--card-color", mutation.color);
      card.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true">${mutation.symbol}</span>
        <small>${mutation.tag}</small>
        <h3>${mutation.name}</h3>
        <p>${isOwned ? mutation.tiers[level - 1]?.desc || mutation.description : mutation.description}</p>
        <div class="level-bar">${Array.from({ length: 3 }, (_, i) => `<div class="level-pip${i < level ? " is-filled" : ""}" style="--pip-color:${mutation.color}"></div>`).join("")}</div>
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} ◈`}</span>
      `;
      if (!isMaxed && canAfford) {
        card.addEventListener("click", () => purchaseSkillMutation(mutation.id));
      }
      ui.skillShopCards.append(card);
    }
  }

  async function purchaseSkillMutation(mutationId) {
    try {
      const endpoint = playerOwnedMutations[mutationId] ? "/api/shop/upgrade" : "/api/shop/purchase";
      const data = await requestJson(endpoint, {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), mutationId })
      });
      playerSkillPoints = data.skillPoints;
      playerOwnedMutations = data.mutations;
      updateSkillShopUI();
      sound(520, 0.25, "triangle", 0.04);
      loadProfile();
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  async function saveLoadoutToServer() {
    try {
      const data = await requestJson("/api/shop/loadout", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), slots: playerLoadout })
      });
      playerLoadout = data.loadout;
      showToast("LOADOUT SALVA", 1200);
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      runLevelConfig,
      runExperienceForLevel,
      moteRunExperience,
      initializeRunProgression,
      applyRunLevelStats,
      grantRunExperience,
      runExperienceDropTypes,
      runEntityPower,
      calculateBossRunScaling
    };
  }

/*__ECHO_SECTION_END:0046__*/
