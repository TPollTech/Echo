/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0201__*/
const { getXpForLevel, getMaxLevel, getScaleForLevel, getHealthForLevel, getDamageForLevel, getRangeForLevel, getSpeedMultiplierForLevel } = require("./core/balance.js");

const xpSystem = {
  entityData: new Map(),
  levelUpCallbacks: [],
  xpGainCallbacks: [],

  initEntity(entity, baseStats = {}) {
    const data = {
      level: 1,
      xp: 0,
      xpToNext: getXpForLevel(1),
      totalXp: 0,
      baseStats: {
        health: baseStats.health || 100,
        damage: baseStats.damage || 10,
        range: baseStats.range || 100,
        speed: baseStats.speed || 200,
        radius: baseStats.radius || 18
      },
      currentStats: { ...baseStats },
      scale: 1,
      pendingLevelUp: false,
      levelUpTimer: 0,
      xpGainTimer: 0,
      lastXpGain: 0
    };
    this.entityData.set(entity.id || entity, data);
    this.applyLevelStats(entity, data);
    return data;
  },

  getData(entity) {
    return this.entityData.get(entity.id || entity);
  },

  addXp(entity, amount, source = "unknown") {
    const data = this.getData(entity);
    if (!data) return false;
    if (data.level >= getMaxLevel()) return false;

    data.xp += amount;
    data.totalXp += amount;
    data.lastXpGain = amount;
    data.xpGainTimer = 0.5;

    this.xpGainCallbacks.forEach(cb => cb(entity, amount, source));

    while (data.xp >= data.xpToNext && data.level < getMaxLevel()) {
      data.xp -= data.xpToNext;
      this.levelUp(entity, data);
    }

    data.xpToNext = getXpForLevel(data.level + 1);
    return true;
  },

  levelUp(entity, data) {
    data.level += 1;
    data.pendingLevelUp = true;
    data.levelUpTimer = BALANCE.visual.levelUpFlashDuration;
    this.applyLevelStats(entity, data);
    this.levelUpCallbacks.forEach(cb => cb(entity, data.level));
  },

  applyLevelStats(entity, data) {
    const growth = BALANCE.growth;
    data.scale = getScaleForLevel(data.level);
    data.currentStats.health = getHealthForLevel(data.baseStats.health, data.level);
    data.currentStats.damage = getDamageForLevel(data.baseStats.damage, data.level);
    data.currentStats.range = getRangeForLevel(data.baseStats.range, data.level);
    data.currentStats.speed = data.baseStats.speed * getSpeedMultiplierForLevel(data.baseStats.speed, data.level);
    data.currentStats.radius = data.baseStats.radius * data.scale;

    entity.maxHealth = data.currentStats.health;
    entity.attackDamage = Math.floor(data.currentStats.damage);
    entity.idealRange = data.currentStats.range;
    entity.baseSpeed = data.currentStats.speed;
    entity.speed = data.currentStats.speed;
    entity.baseRadius = data.currentStats.radius;
    entity.radius = data.currentStats.radius;
    entity.level = data.level;
    entity.xp = data.xp;
    entity.xpToNext = data.xpToNext;
    entity.totalXp = data.totalXp;
    entity.scale = data.scale;

    if (entity.health > entity.maxHealth) entity.health = entity.maxHealth;
  },

  onLevelUp(callback) {
    this.levelUpCallbacks.push(callback);
  },

  onXpGain(callback) {
    this.xpGainCallbacks.push(callback);
  },

  update(entity, dt) {
    const data = this.getData(entity);
    if (!data) return;

    if (data.levelUpTimer > 0) {
      data.levelUpTimer -= dt;
      if (data.levelUpTimer <= 0) data.pendingLevelUp = false;
    }

    if (data.xpGainTimer > 0) data.xpGainTimer -= dt;
  },

  getLevel(entity) {
    const data = this.getData(entity);
    return data ? data.level : 1;
  },

  getXp(entity) {
    const data = this.getData(entity);
    return data ? data.xp : 0;
  },

  getXpToNext(entity) {
    const data = this.getData(entity);
    return data ? data.xpToNext : getXpForLevel(1);
  },

  getTotalXp(entity) {
    const data = this.getData(entity);
    return data ? data.totalXp : 0;
  },

  getScale(entity) {
    const data = this.getData(entity);
    return data ? data.scale : 1;
  },

  isLevelUpPending(entity) {
    const data = this.getData(entity);
    return data ? data.pendingLevelUp : false;
  },

  getLevelUpProgress(entity) {
    const data = this.getData(entity);
    if (!data || data.levelUpTimer <= 0) return 0;
    return 1 - data.levelUpTimer / BALANCE.visual.levelUpFlashDuration;
  },

  resetEntity(entity) {
    const data = this.getData(entity);
    if (data) {
      data.level = 1;
      data.xp = 0;
      data.xpToNext = getXpForLevel(1);
      data.totalXp = 0;
      data.scale = 1;
      data.pendingLevelUp = false;
      data.levelUpTimer = 0;
      this.applyLevelStats(entity, data);
    }
  },

  destroyEntity(entity) {
    this.entityData.delete(entity.id || entity);
  }
};

const BALANCE = require("./core/balance.js").BALANCE;

module.exports = Object.freeze({ xpSystem });
/*__ECHO_SECTION_END:0201__*/