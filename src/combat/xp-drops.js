/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0206__*/
const { BALANCE, getXpForLevel, getScaleForLevel } = require("./core/balance.js");
const { xpSystem } = require("./progression/xp.js");
const { moteXpSystem } = require("./entities/mote-xp.js");

const xpDropSystem = {
  xpDrops: [],
  pendingDrops: [],

  init() {
    this.xpDrops = [];
    this.pendingDrops = [];
  },

  queueXpDrop(entity, killer) {
    const xpData = xpSystem.getData(entity);
    if (!xpData) return;

    const totalXp = xpData.totalXp || 0;
    const dropAmount = Math.floor(totalXp * BALANCE.xpDrop.dropPercentage);
    if (dropAmount <= 0) return;

    this.pendingDrops.push({
      x: entity.x,
      y: entity.y,
      amount: dropAmount,
      entityLevel: xpData.level,
      killer: killer,
      timestamp: Date.now()
    });
  },

  processPendingDrops(worldSize, worldMargin) {
    for (const drop of this.pendingDrops) {
      this.createXpDrops(drop.x, drop.y, drop.amount, drop.entityLevel, worldSize, worldMargin);
    }
    this.pendingDrops = [];
  },

  createXpDrops(x, y, totalXp, entityLevel, worldSize, worldMargin) {
    const { minMotes, maxMotes, blueMoteRatio, violetMoteRatio, spreadRadius } = BALANCE.xpDrop;
    const moteCount = Math.min(maxMotes, Math.max(minMotes, Math.floor(totalXp / (BALANCE.xp.blueMoteXp * 2))));

    const blueCount = Math.floor(moteCount * blueMoteRatio);
    const violetCount = moteCount - blueCount;

    for (let i = 0; i < blueCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = spreadRadius * Math.sqrt(Math.random());
      const mx = Math.max(worldMargin, Math.min(worldSize - worldMargin, x + Math.cos(angle) * dist));
      const my = Math.max(worldMargin, Math.min(worldSize - worldMargin, y + Math.sin(angle) * dist));
      this.xpDrops.push(moteXpSystem.createXpMote(mx, my, moteXpSystem.MOTE_TYPES.BLUE));
    }

    for (let i = 0; i < violetCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = spreadRadius * Math.sqrt(Math.random());
      const mx = Math.max(worldMargin, Math.min(worldSize - worldMargin, x + Math.cos(angle) * dist));
      const my = Math.max(worldMargin, Math.min(worldSize - worldMargin, y + Math.sin(angle) * dist));
      this.xpDrops.push(moteXpSystem.createXpMote(mx, my, moteXpSystem.MOTE_TYPES.VIOLET));
    }
  },

  dropXpOnDeath(entity, killer) {
    this.queueXpDrop(entity, killer);
  },

  updateXpDrops(dt, player, bots, worldSize, worldMargin) {
    for (let i = this.xpDrops.length - 1; i >= 0; i--) {
      const drop = this.xpDrops[i];
      if (drop.collected) {
        this.xpDrops.splice(i, 1);
        continue;
      }
    }

    moteXpSystem.xpMotes.push(...this.xpDrops);
    this.xpDrops = [];
  },

  getXpDropsInRange(x, y, radius) {
    return this.xpDrops.filter(drop => {
      const dx = drop.x - x;
      const dy = drop.y - y;
      return dx * dx + dy * dy < radius * radius && !drop.collected;
    });
  }
};

module.exports = Object.freeze({ xpDropSystem });
/*__ECHO_SECTION_END:0206__*/