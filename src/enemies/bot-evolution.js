/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0204__*/
const { BALANCE } = require("./core/balance.js");
const { xpSystem } = require("./progression/xp.js");
const { moteXpSystem } = require("./entities/mote-xp.js");

const botEvolution = {
  behaviorWeights: {
    survival: 10,
    enemyProximity: 8,
    levelDifference: 7,
    health: 6,
    moteDistance: 5,
    moteValue: 4,
    regionRisk: 3,
    killPotential: 2
  },

  assessBotState(bot, player, bots, gameTime) {
    const xpData = xpSystem.getData(bot);
    const botLevel = xpData ? xpData.level : 1;
    const botHealthRatio = bot.health / (bot.maxHealth || 100);

    const nearbyEnemies = this.getNearbyEnemies(bot, bots, 400);
    const nearestEnemy = nearbyEnemies[0];
    const playerDist = Math.hypot(bot.x - player.x, bot.y - player.y);
    const playerLevel = xpSystem.getLevel(player);

    const violetMotes = moteXpSystem.getVioletMotesInRange(bot.x, bot.y, 600);
    const nearestViolet = violetMotes[0];
    const allMotes = moteXpSystem.getMotesInRange(bot.x, bot.y, 800);
    const nearestMote = allMotes[0];

    const regionRisk = this.assessRegionRisk(bot, bots, player);

    return {
      botLevel,
      botHealthRatio,
      nearbyEnemies: nearbyEnemies.length,
      nearestEnemyDist: nearestEnemy ? Math.hypot(bot.x - nearestEnemy.x, bot.y - nearestEnemy.y) : Infinity,
      nearestEnemyLevel: nearestEnemy ? (xpSystem.getData(nearestEnemy)?.level || 1) : 1,
      playerDist,
      playerLevel,
      levelDiff: playerLevel - botLevel,
      violetMotesNearby: violetMotes.length,
      nearestVioletDist: nearestViolet ? Math.hypot(bot.x - nearestViolet.x, bot.y - nearestViolet.y) : Infinity,
      nearestVioletValue: nearestViolet ? nearestViolet.xpValue : 0,
      allMotesNearby: allMotes.length,
      nearestMoteDist: nearestMote ? Math.hypot(bot.x - nearestMote.x, bot.y - nearestMote.y) : Infinity,
      nearestMoteValue: nearestMote ? nearestMote.xpValue : 0,
      regionRisk,
      canFlee: botHealthRatio < BALANCE.bot.fleeHealthThreshold,
      canEngage: botLevel - playerLevel >= BALANCE.bot.engageLevelAdvantage,
      shouldAvoid: playerLevel - botLevel >= BALANCE.bot.avoidLevelDisadvantage
    };
  },

  getNearbyEnemies(bot, bots, radius) {
    const enemies = [];
    for (const other of bots) {
      if (other === bot || other.dead || other.faction === bot.faction || other.boss) continue;
      const dist = Math.hypot(bot.x - other.x, bot.y - other.y);
      if (dist < radius) enemies.push({ bot: other, distance: dist });
    }
    enemies.sort((a, b) => a.distance - b.distance);
    return enemies.map(e => e.bot);
  },

  assessRegionRisk(bot, bots, player) {
    let risk = 0;
    const checkRadius = BALANCE.bot.dangerAssessmentRadius;

    for (const other of bots) {
      if (other === bot || other.dead) continue;
      const dist = Math.hypot(bot.x - other.x, bot.y - other.y);
      if (dist < checkRadius) {
        const xpData = xpSystem.getData(other);
        const otherLevel = xpData ? xpData.level : 1;
        const levelDiff = otherLevel - (xpSystem.getData(bot)?.level || 1);
        risk += Math.max(0, levelDiff + 1) * (1 - dist / checkRadius);
      }
    }

    const playerDist = Math.hypot(bot.x - player.x, bot.y - player.y);
    if (playerDist < checkRadius) {
      const playerLevel = xpSystem.getLevel(player);
      const botLevel = xpSystem.getData(bot)?.level || 1;
      risk += Math.max(0, playerLevel - botLevel + 2) * (1 - playerDist / checkRadius);
    }

    return Math.min(risk, 10);
  },

  calculateActionPriority(state) {
    const weights = this.behaviorWeights;
    let priorities = {};

    priorities.survival = weights.survival * (1 - state.botHealthRatio);
    if (state.canFlee) priorities.survival *= 3;

    priorities.enemyProximity = weights.enemyProximity * (state.nearestEnemyDist < 200 ? 2 : 1) * Math.max(0, 1 - state.nearestEnemyDist / 400);

    priorities.levelDifference = weights.levelDifference * Math.abs(state.levelDiff) * (state.levelDiff > 0 ? 1.5 : 0.5);

    priorities.health = weights.health * (1 - state.botHealthRatio);

    if (state.nearestVioletDist < Infinity) {
      const violetValue = state.nearestVioletValue * BALANCE.bot.violetPriorityMultiplier;
      priorities.moteValue = weights.moteValue * violetValue * Math.max(0, 1 - state.nearestVioletDist / 800);
      priorities.moteDistance = weights.moteDistance * Math.max(0, 1 - state.nearestVioletDist / 800);
    } else if (state.nearestMoteDist < Infinity) {
      priorities.moteValue = weights.moteValue * state.nearestMoteValue * Math.max(0, 1 - state.nearestMoteDist / 800);
      priorities.moteDistance = weights.moteDistance * Math.max(0, 1 - state.nearestMoteDist / 800);
    } else {
      priorities.moteValue = 0;
      priorities.moteDistance = 0;
    }

    priorities.regionRisk = weights.regionRisk * state.regionRisk;

    if (state.nearestEnemyDist < 300 && state.botLevel > state.nearestEnemyLevel) {
      priorities.killPotential = weights.killPotential * (state.botLevel - state.nearestEnemyLevel + 1) * Math.max(0, 1 - state.nearestEnemyDist / 300);
    } else {
      priorities.killPotential = 0;
    }

    return priorities;
  },

  decideAction(bot, player, bots, gameTime) {
    const state = this.assessBotState(bot, player, bots, gameTime);
    const priorities = this.calculateActionPriority(state);

    if (state.canFlee && (priorities.survival > priorities.killPotential + priorities.moteValue)) {
      return this.createFleeAction(bot, state);
    }

    if (state.shouldAvoid && priorities.survival > priorities.moteValue * 2) {
      return this.createAvoidAction(bot, state);
    }

    if (state.nearestEnemyDist < 250 && state.botLevel > state.nearestEnemyLevel + 1 && bot.aggression > 0.5) {
      return this.createEngageAction(bot, state);
    }

    if (state.nearestVioletDist < 500 && priorities.moteValue > priorities.regionRisk * 2) {
      return this.createCollectVioletAction(bot, state);
    }

    if (state.nearestMoteDist < 400 && priorities.moteValue > priorities.regionRisk) {
      return this.createCollectAction(bot, state);
    }

    if (state.playerDist < 400 && bot.aggression > 0.4 && !state.shouldAvoid) {
      return this.createHuntAction(bot, state);
    }

    return this.createWanderAction(bot, state);
  },

  createFleeAction(bot, state) {
    const threats = [...state.nearbyEnemies];
    if (state.playerDist < 500) threats.push({ x: player.x, y: player.y, level: state.playerLevel });

    let fleeX = bot.x;
    let fleeY = bot.y;
    let maxDanger = -1;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const testX = bot.x + Math.cos(angle) * 300;
      const testY = bot.y + Math.sin(angle) * 300;

      let danger = 0;
      for (const threat of threats) {
        const dist = Math.hypot(testX - threat.x, testY - threat.y);
        if (dist < 400) danger += (400 - dist) / 400 * (threat.level || 1);
      }

      if (danger > maxDanger) {
        maxDanger = danger;
        fleeX = testX;
        fleeY = testY;
      }
    }

    return {
      type: "flee",
      targetX: fleeX,
      targetY: fleeY,
      priority: "survival",
      speedMultiplier: 1.3
    };
  },

  createAvoidAction(bot, state) {
    const angle = Math.atan2(bot.y - player.y, bot.x - player.x);
    const avoidX = bot.x + Math.cos(angle) * 400;
    const avoidY = bot.y + Math.sin(angle) * 400;

    return {
      type: "avoid",
      targetX: avoidX,
      targetY: avoidY,
      priority: "survival",
      speedMultiplier: 1.1
    };
  },

  createEngageAction(bot, state) {
    const enemy = state.nearbyEnemies[0];
    return {
      type: "engage",
      targetX: enemy.x,
      targetY: enemy.y,
      targetEntity: enemy,
      priority: "combat",
      speedMultiplier: 1.0
    };
  },

  createCollectVioletAction(bot, state) {
    const violetMotes = moteXpSystem.getVioletMotesInRange(bot.x, bot.y, 600);
    const best = violetMotes.reduce((a, b) => {
      const scoreA = a.xpValue / Math.max(1, Math.hypot(bot.x - a.x, bot.y - a.y));
      const scoreB = b.xpValue / Math.max(1, Math.hypot(bot.x - b.x, bot.y - b.y));
      return scoreA > scoreB ? a : b;
    });

    return {
      type: "collect_violet",
      targetX: best.x,
      targetY: best.y,
      targetMote: best,
      priority: "high_value_resource",
      speedMultiplier: 1.0
    };
  },

  createCollectAction(bot, state) {
    const motes = moteXpSystem.getMotesInRange(bot.x, bot.y, 800);
    const best = motes.reduce((a, b) => {
      const scoreA = a.xpValue / Math.max(1, Math.hypot(bot.x - a.x, bot.y - a.y));
      const scoreB = b.xpValue / Math.max(1, Math.hypot(bot.x - b.x, bot.y - b.y));
      return scoreA > scoreB ? a : b;
    });

    return {
      type: "collect",
      targetX: best.x,
      targetY: best.y,
      targetMote: best,
      priority: "resource",
      speedMultiplier: 0.9
    };
  },

  createHuntAction(bot, state) {
    return {
      type: "hunt",
      targetX: player.x,
      targetY: player.y,
      targetEntity: player,
      priority: "combat",
      speedMultiplier: 1.0
    };
  },

  createWanderAction(bot, state) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 200 + Math.random() * 300;
    return {
      type: "wander",
      targetX: bot.x + Math.cos(angle) * dist,
      targetY: bot.y + Math.sin(angle) * dist,
      priority: "explore",
      speedMultiplier: 0.7
    };
  },

  applyAction(bot, action, dt) {
    if (!action) return;

    const targetX = action.targetX;
    const targetY = action.targetY;
    const dx = targetX - bot.x;
    const dy = targetY - bot.y;
    const dist = Math.hypot(dx, dy) || 1;

    const speed = (bot.baseSpeed || bot.speed || 150) * (action.speedMultiplier || 1);
    bot.vx += (dx / dist) * speed * dt * 0.5;
    bot.vy += (dy / dist) * speed * dt * 0.5;

    const maxSpeed = speed * 1.2;
    const currentSpeed = Math.hypot(bot.vx, bot.vy);
    if (currentSpeed > maxSpeed) {
      bot.vx = (bot.vx / currentSpeed) * maxSpeed;
      bot.vy = (bot.vy / currentSpeed) * maxSpeed;
    }

    bot.currentAction = action;
  },

  updateAllBots(bots, player, gameTime, dt) {
    for (const bot of bots) {
      if (bot.dead || bot.boss) continue;

      const action = this.decideAction(bot, player, bots, gameTime);
      this.applyAction(bot, action, dt);

      const xpData = xpSystem.getData(bot);
      if (xpData) {
        xpSystem.update(bot, dt);
      }
    }
  },

  onBotLevelUp(bot, newLevel) {
    const xpData = xpSystem.getData(bot);
    if (!xpData) return;

    const scale = xpData.scale;
    bot.radius = (bot.baseRadius || bot.radius) * scale;
    bot.maxHealth = xpData.currentStats.health;
    bot.attackDamage = Math.floor(xpData.currentStats.damage);
    bot.speed = xpData.currentStats.speed;
    bot.baseSpeed = bot.speed;
    bot.idealRange = xpData.currentStats.range;

    if (bot.health > bot.maxHealth) bot.health = bot.maxHealth;

    this.showLevelUpEffect(bot, newLevel);
  },

  showLevelUpEffect(bot, level) {
    if (typeof window.spawnWave === "function") {
      window.spawnWave(bot.x, bot.y, bot.hue, 60, 0.6);
    }
    if (typeof window.burst === "function") {
      window.burst(bot.x, bot.y, bot.hue, 12);
    }
    if (typeof window.sound === "function") {
      window.sound(330 + level * 20, 0.08, "triangle", 0.06);
    }
  },

  getBotCompetitorsForMote(bot, mote, bots, maxDistance = 400) {
    const competitors = [];
    for (const other of bots) {
      if (other === bot || other.dead || other.boss) continue;
      const dist = Math.hypot(other.x - mote.x, other.y - mote.y);
      if (dist < maxDistance) {
        competitors.push({ bot: other, distance: dist });
      }
    }
    return competitors.sort((a, b) => a.distance - b.distance);
  },

  shouldContestVioletMote(bot, mote, competitors) {
    if (competitors.length === 0) return true;

    const xpData = xpSystem.getData(bot);
    const botLevel = xpData ? xpData.level : 1;
    const botHealthRatio = bot.health / (bot.maxHealth || 100);

    const strongestCompetitor = competitors[0];
    const compXpData = xpSystem.getData(strongestCompetitor.bot);
    const compLevel = compXpData ? compXpData.level : 1;
    const compHealthRatio = strongestCompetitor.bot.health / (strongestCompetitor.bot.maxHealth || 100);

    const ourAdvantage = botLevel - compLevel;
    const healthAdvantage = botHealthRatio - compHealthRatio;
    const distanceAdvantage = 1 - strongestCompetitor.distance / (Math.hypot(bot.x - mote.x, bot.y - mote.y) + 1);

    const score = ourAdvantage * 0.5 + healthAdvantage * 0.3 + distanceAdvantage * 0.2;

    return score >= BALANCE.bot.purpleMoteContestThreshold;
  }
};

module.exports = Object.freeze({ botEvolution });
/*__ECHO_SECTION_END:0204__*/