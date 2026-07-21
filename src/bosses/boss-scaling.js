/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0207__*/
const { BALANCE, getScaleForLevel, getHealthForLevel, getDamageForLevel } = require("./core/balance.js");
const { xpSystem } = require("./progression/xp.js");

const bossScaling = {
  bossLevelData: new Map(),
  lastScaleUpdate: 0,
  scaleUpdateInterval: 5,

  initBoss(boss, player, bots, gameTime, isSolo = true) {
    const avgLevel = this.getAveragePlayerLevel(player, bots);
    const maxLevel = this.getMaxPlayerLevel(player, bots);
    const playerCount = this.getActivePlayerCount(player, bots);
    const threatLevel = this.getThreatLevel(bots);

    const baseScale = this.calculateBossScale(boss, avgLevel, maxLevel, playerCount, gameTime, threatLevel);
    const level = this.calculateBossLevel(avgLevel, maxLevel, gameTime, isSolo);

    const xpData = xpSystem.initEntity(boss, {
      health: boss.maxHealth || 500,
      damage: boss.attackDamage || 25,
      range: boss.idealRange || 400,
      speed: boss.baseSpeed || 100,
      radius: boss.baseRadius || 34
    });

    xpData.level = level;
    xpData.xp = 0;
    xpData.xpToNext = Infinity;
    xpData.totalXp = 0;
    xpData.scale = baseScale;
    xpData.currentStats.health = Math.floor(xpData.currentStats.health * baseScale);
    xpData.currentStats.damage = Math.floor(xpData.currentStats.damage * (1 + (level - 1) * 0.1));
    xpData.currentStats.range = xpData.currentStats.range * (1 + (level - 1) * 0.05);
    xpData.currentStats.speed = xpData.currentStats.speed * Math.max(0.7, 1 - (level - 1) * 0.02);
    xpData.currentStats.radius = xpData.currentStats.radius * baseScale;

    this.bossLevelData.set(boss.id || boss, {
      baseLevel: level,
      baseScale: baseScale,
      avgPlayerLevelAtSpawn: avgLevel,
      maxPlayerLevelAtSpawn: maxLevel,
      playerCountAtSpawn: playerCount,
      phaseScales: [],
      lastThreatUpdate: gameTime
    });

    this.applyBossStats(boss, xpData);
    return { level, scale: baseScale };
  },

  calculateBossScale(boss, avgLevel, maxLevel, playerCount, gameTime, threatLevel) {
    const config = BALANCE.bosses;
    let multiplier = (config.baseScaleMultiplier.min + config.baseScaleMultiplier.max) / 2;

    multiplier += avgLevel * config.healthScalePerAvgLevel * 0.01;
    multiplier += maxLevel * config.damageScalePerAvgLevel * 0.01;
    multiplier += playerCount * config.scaleByPlayerCount;
    multiplier += Math.min(gameTime * config.scaleByTime, 0.5);
    multiplier += threatLevel * config.scaleByThreatLevel;

    return Math.max(config.baseScaleMultiplier.min, Math.min(config.baseScaleMultiplier.max, multiplier));
  },

  calculateBossLevel(avgLevel, maxLevel, gameTime, isSolo) {
    const config = BALANCE.bosses;
    let level = Math.floor(avgLevel * 1.2 + maxLevel * 0.3);
    level = Math.max(config.minLevel, Math.min(config.maxLevel, level));
    return level;
  },

  applyBossStats(boss, xpData) {
    boss.level = xpData.level;
    boss.scale = xpData.scale;
    boss.maxHealth = xpData.currentStats.health;
    boss.attackDamage = xpData.currentStats.damage;
    boss.idealRange = xpData.currentStats.range;
    boss.baseSpeed = xpData.currentStats.speed;
    boss.speed = xpData.currentStats.speed;
    boss.baseRadius = xpData.currentStats.radius;
    boss.radius = xpData.currentStats.radius;
    boss.xp = xpData.xp;
    boss.xpToNext = xpData.xpToNext;
    boss.totalXp = xpData.totalXp;

    if (boss.health > boss.maxHealth) boss.health = boss.maxHealth;
  },

  updateBossScaling(boss, player, bots, gameTime, dt) {
    const data = this.bossLevelData.get(boss.id || boss);
    if (!data) return;

    this.lastScaleUpdate += dt;
    if (this.lastScaleUpdate < this.scaleUpdateInterval) return;
    this.lastScaleUpdate = 0;

    const avgLevel = this.getAveragePlayerLevel(player, bots);
    const maxLevel = this.getMaxPlayerLevel(player, bots);
    const threatLevel = this.getThreatLevel(bots);

    const levelDiff = avgLevel - data.avgPlayerLevelAtSpawn;
    if (levelDiff > 2) {
      const newScale = data.baseScale * (1 + levelDiff * 0.05);
      const cappedScale = Math.min(BALANCE.bosses.baseScaleMultiplier.max, newScale);
      if (cappedScale !== boss.scale) {
        this.applyScaleChange(boss, cappedScale / boss.scale);
        boss.scale = cappedScale;
      }
    }

    const threatDiff = threatLevel - (data.lastThreatLevel || 0);
    if (threatDiff > 0.5) {
      const newDamage = Math.floor(boss.attackDamage * (1 + threatDiff * 0.1));
      boss.attackDamage = Math.min(newDamage, boss.baseAttackDamage * 2);
    }

    data.lastThreatLevel = threatLevel;
    data.lastThreatUpdate = gameTime;
  },

  applyScaleChange(boss, scaleFactor) {
    boss.radius *= scaleFactor;
    boss.maxHealth = Math.floor(boss.maxHealth * scaleFactor);
    boss.attackDamage = Math.floor(boss.attackDamage * scaleFactor);
    boss.idealRange *= scaleFactor;
    boss.baseSpeed *= Math.max(0.7, 1 / scaleFactor);
    boss.speed = boss.baseSpeed;

    boss.health = Math.min(boss.maxHealth, Math.floor(boss.health * scaleFactor));

    if (boss.telegraphRadius) boss.telegraphRadius *= scaleFactor;
    if (boss.telegraphProjectiles) boss.telegraphProjectiles = Math.floor(boss.telegraphProjectiles * scaleFactor);
  },

  onBossPhaseTransition(boss, newPhaseIndex) {
    const data = this.bossLevelData.get(boss.id || boss);
    if (!data) return;

    const phaseScale = 1 + newPhaseIndex * BALANCE.bosses.phaseScaleGrowth;
    data.phaseScales[newPhaseIndex] = phaseScale;

    const totalScale = data.baseScale * phaseScale;
    this.applyScaleChange(boss, totalScale / boss.scale);
    boss.scale = totalScale;
  },

  getAveragePlayerLevel(player, bots) {
    let totalLevel = 0;
    let count = 0;

    const playerLevel = xpSystem.getLevel(player);
    if (playerLevel > 0) {
      totalLevel += playerLevel;
      count++;
    }

    for (const bot of bots) {
      if (bot.dead || bot.boss) continue;
      const level = xpSystem.getLevel(bot);
      if (level > 0) {
        totalLevel += level;
        count++;
      }
    }

    return count > 0 ? totalLevel / count : 1;
  },

  getMaxPlayerLevel(player, bots) {
    let maxLevel = xpSystem.getLevel(player);
    for (const bot of bots) {
      if (bot.dead || bot.boss) continue;
      const level = xpSystem.getLevel(bot);
      maxLevel = Math.max(maxLevel, level);
    }
    return maxLevel;
  },

  getActivePlayerCount(player, bots) {
    let count = 1;
    for (const bot of bots) {
      if (!bot.dead && !bot.boss && xpSystem.getLevel(bot) > 0) count++;
    }
    return count;
  },

  getThreatLevel(bots) {
    let threat = 0;
    let count = 0;
    for (const bot of bots) {
      if (bot.dead || bot.boss) continue;
      const level = xpSystem.getLevel(bot);
      const healthRatio = bot.health / (bot.maxHealth || 100);
      threat += level * healthRatio;
      count++;
    }
    return count > 0 ? threat / count : 0;
  },

  getBossEffectiveLevel(boss) {
    const data = this.bossLevelData.get(boss.id || boss);
    return data ? data.baseLevel : 1;
  },

  getBossScale(boss) {
    return boss.scale || 1;
  },

  calculateBossReward(boss) {
    const data = this.bossLevelData.get(boss.id || boss);
    const baseReward = boss.bossTemplate?.score || 1000;
    const levelMultiplier = data ? 1 + (data.baseLevel - 1) * 0.1 : 1;
    const scaleMultiplier = boss.scale || 1;
    return Math.floor(baseReward * levelMultiplier * scaleMultiplier);
  }
};

module.exports = Object.freeze({ bossScaling });
/*__ECHO_SECTION_END:0207__*/