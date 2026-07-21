/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0202__*/
const XP_CURVE_BASE = 80;
const XP_CURVE_EXPONENT = 1.45;
const MAX_LEVEL = 25;

const BALANCE = Object.freeze({
  xp: Object.freeze({
    base: XP_CURVE_BASE,
    exponent: XP_CURVE_EXPONENT,
    maxLevel: MAX_LEVEL,
    blueMoteXp: 8,
    violetMoteXp: 35,
    violetMoteBonusDuration: 8,
    violetMoteBonusEffect: { damage: 1.15, speed: 1.1, defense: 0.9 },
    dropPercentage: 0.35,
    maxDropMotes: 12,
    minDropMotes: 3
  }),

  growth: Object.freeze({
    scalePerLevel: 0.045,
    maxScale: 2.2,
    minScale: 0.7,
    healthPerLevel: 0.08,
    damagePerLevel: 0.06,
    rangePerLevel: 0.04,
    speedPenaltyPerLevel: 0.008,
    xpDropMultiplierPerLevel: 1.15
  }),

  mote: Object.freeze({
    blueSpawnWeight: 0.65,
    violetSpawnWeight: 0.15,
    goldSpawnWeight: 0.12,
    redSpawnWeight: 0.08,
    spawnRadius: { min: 100, max: 2800 },
    dangerZoneWeight: 0.35,
    safeZoneWeight: 0.65,
    respawnDelay: { min: 0.5, max: 2.0 },
    maxMotes: 330
  }),

  bot: Object.freeze({
    baseXpWeight: 1.0,
    violetPriorityMultiplier: 2.5,
    dangerAssessmentRadius: 400,
    fleeHealthThreshold: 0.35,
    engageLevelDiff: 3,
    avoidLevelDiff: 5,
    collectThinkInterval: { min: 0.8, max: 1.8 },
    maxSimultaneousCollectors: 3
  }),

  boss: Object.freeze({
    baseScaleMultiplier: { min: 1.8, max: 3.0 },
    healthPerAvgLevel: 0.12,
    damagePerAvgLevel: 0.08,
    minHealthMultiplier: 1.0,
    maxHealthMultiplier: 2.5,
    phaseScaleGrowth: 0.08
  }),

  visual: Object.freeze({
    levelUpFlashDuration: 1.2,
    xpGainPopupDuration: 0.8,
    scaleTransitionDuration: 0.4,
    moteCollectEffectDuration: 0.5,
    levelIndicatorDuration: 2.0
  }),

  audio: Object.freeze({
    xpCollectVolume: 0.035,
    xpCollectPitch: { blue: 520, violet: 440 },
    levelUpVolume: 0.08,
    levelUpPitch: 330,
    violetBonusPitch: 370
  }),

  hud: Object.freeze({
    xpBarWidth: 200,
    xpBarHeight: 6,
    levelBadgeSize: 24,
    showLevelOnEntities: true,
    maxLevelIndicators: 10
  }),

  soundtrack: Object.freeze({
    tracks: {
      menu: { weight: 1, layer: "ambient" },
      matchStart: { weight: 1, layer: "stinger" },
      combatLow: { weight: 3, layer: "combat", threat: "low" },
      combatMid: { weight: 3, layer: "combat", threat: "mid" },
      combatHigh: { weight: 2, layer: "combat", threat: "high" },
      exploration: { weight: 2, layer: "ambient", threat: "none" },
      bossPhase1: { weight: 1, layer: "boss", phase: 1 },
      bossPhase2: { weight: 1, layer: "boss", phase: 2 },
      bossPhase3: { weight: 1, layer: "boss", phase: 3 },
      victory: { weight: 1, layer: "stinger" },
      defeat: { weight: 1, layer: "stinger" }
    },
    transitionDuration: 3.0,
    minTrackDuration: 30,
    maxTrackDuration: 120,
    noRepeatWindow: 3
  }),

  xpDrop: Object.freeze({
    blueMoteRatio: 0.7,
    violetMoteRatio: 0.3,
    minMotes: 3,
    maxMotes: 12,
    spreadRadius: 80
  })
});

function getXpForLevel(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(XP_CURVE_BASE * Math.pow(level, XP_CURVE_EXPONENT));
}

function getMaxLevel() {
  return MAX_LEVEL;
}

function getScaleForLevel(level) {
  const { scalePerLevel, maxScale, minScale } = BALANCE.growth;
  return Math.min(maxScale, Math.max(minScale, 1 + (level - 1) * scalePerLevel));
}

function getHealthForLevel(baseHealth, level) {
  return Math.floor(baseHealth * (1 + (level - 1) * BALANCE.growth.healthPerLevel));
}

function getDamageForLevel(baseDamage, level) {
  return baseDamage * (1 + (level - 1) * BALANCE.growth.damagePerLevel);
}

function getRangeForLevel(baseRange, level) {
  return baseRange * (1 + (level - 1) * BALANCE.growth.rangePerLevel);
}

function getSpeedMultiplierForLevel(baseSpeed, level) {
  const penalty = (level - 1) * BALANCE.growth.speedPenaltyPerLevel;
  return Math.max(0.6, 1 - penalty);
}

module.exports = Object.freeze({
  BALANCE,
  getXpForLevel,
  getMaxLevel,
  getScaleForLevel,
  getHealthForLevel,
  getDamageForLevel,
  getRangeForLevel,
  getSpeedMultiplierForLevel
});
/*__ECHO_SECTION_END:0202__*/