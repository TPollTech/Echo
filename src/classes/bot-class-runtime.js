/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0128__*/
  function initializeBotClass(bot, classId) {
    if (!bot || bot.boss) return bot;
    applyEntityClass(bot, classId || "cutter");
    bot.baseSpeed = bot.classDefinition.attributes.speed;
    bot.speed = bot.baseSpeed;
    bot.classThinkTimer = random(0.2, 0.7);
    bot.roleLabel = `${bot.classDefinition.name} · LV ${bot.classLevel}`;
    bot.classResource = bot.classResourceMax;
    if (bot.classId === "loader") {
      bot.blueAmmo = 8;
      bot.violetAmmo = 2;
      bot.classResource = 10;
    }
    return bot;
  }

  function nearestBotClassTarget(bot) {
    let target = player;
    let distance = Math.hypot(player.x - bot.x, player.y - bot.y);
    for (const candidate of bots) {
      if (candidate === bot || candidate.dead || candidate.faction === bot.faction || candidate.boss) continue;
      const candidateDistance = Math.hypot(candidate.x - bot.x, candidate.y - bot.y);
      if (candidateDistance < distance) {
        target = candidate;
        distance = candidateDistance;
      }
    }
    return { target, distance };
  }

  function botAlignment(bot, target) {
    const velocityLength = Math.hypot(bot.vx, bot.vy);
    if (velocityLength < 5) return 0.5;
    const targetLength = Math.hypot(target.x - bot.x, target.y - bot.y) || 1;
    return clamp((bot.vx * (target.x - bot.x) + bot.vy * (target.y - bot.y)) / (velocityLength * targetLength), -1, 1) * 0.5 + 0.5;
  }

  function performBotClassAction(bot, target, decision) {
    if (bot.classCooldown > 0 || bot.cooldown > 0 || bot.respawnTimer > 0) return false;
    bot.targetX = target.x;
    bot.targetY = target.y;
    if (bot.classId === "cutter") {
      if (!bot.phasing && bot.energy > 44) beginBotPhase(bot, target);
      return true;
    }
    if (bot.classId === "marksman") {
      if (decision.action === "charge") {
        spawnClassProjectile(bot, Math.atan2(target.y - bot.y, target.x - bot.x), { speed: 760, damage: 18, radius: 6, life: 1.5, pierce: bot.classLevel >= 7 ? 1 : 0 });
        bot.classCooldown = 1.8;
      }
      return true;
    }
    if (bot.classId === "charger") {
      if (decision.action === "charge") performDash(bot, 0.8);
      return true;
    }
    if (bot.classId === "trapper") {
      if (decision.action === "trap") placeTrap(bot, 0.55);
      else spawnClassProjectile(bot, Math.atan2(target.y - bot.y, target.x - bot.x), { speed: 470, damage: 9, radius: 5, life: 1.15, slow: 0.4 });
      bot.classCooldown = 1.25;
      return true;
    }
    if (bot.classId === "defender") {
      if (decision.action === "block") activateShield(bot);
      else meleeArc(bot, 105, 13 + bot.classCounterCharge);
      bot.classCooldown = 1.1;
      return true;
    }
    if (bot.classId === "assassin") {
      if (decision.action === "ambush" && bot.classStealthTimer <= 0) activateStealth(bot);
      else if (Math.hypot(target.x - bot.x, target.y - bot.y) < 125) {
        meleeArc(bot, 100, bot.classAmbushReady ? 28 : 15, Math.PI * 0.65);
        bot.classAmbushReady = false;
        bot.classStealthTimer = 0;
      }
      bot.classCooldown = 0.85;
      return true;
    }
    if (bot.classId === "controller") {
      if (decision.action === "pull") createGravityField(bot);
      else meleeArc(bot, 140, 9, TAU);
      bot.classCooldown = 1.4;
      return true;
    }
    if (bot.classId === "summoner") {
      summonUnit(bot, decision.action === "command");
      bot.classCooldown = 1.6;
      return true;
    }
    if (bot.classId === "orbiter") {
      if (decision.action === "launch") launchOrb(bot, false);
      bot.classCooldown = 1.15;
      return true;
    }
    if (bot.classId === "loader") {
      if (decision.action === "explode") {
        damageInRadius(bot, bot.x, bot.y, 125, 19);
        bot.classResource = Math.max(0, bot.classResource - 3);
      } else if (decision.action === "shoot") fireLoader(bot);
      bot.classCooldown = 1.1;
      return true;
    }
    return false;
  }

  function updateBotClassAi(bot, dt) {
    if (!bot.classId || bot.boss || bot.dead) return false;
    bot.classCooldown = Math.max(0, (bot.classCooldown || 0) - dt);
    bot.classShieldTimer = Math.max(0, (bot.classShieldTimer || 0) - dt);
    bot.classStealthTimer = Math.max(0, (bot.classStealthTimer || 0) - dt);
    if (bot.classId === "assassin") bot.stealthed = bot.classStealthTimer > 0;
    bot.classThinkTimer -= dt;
    bot.classExperience = Math.max(bot.classExperience || 0, bot.score || 0);
    bot.classLevel = getClassLevel(bot.classExperience);
    bot.radius = 17 * (1 + (bot.classLevel - 1) * 0.022);
    bot.roleLabel = `${bot.classDefinition.name} · LV ${bot.classLevel}`;
    if (bot.classActionTimer > 0) {
      bot.classActionTimer -= dt;
      bot.vx = Math.cos(bot.classDashAngle) * 710;
      bot.vy = Math.sin(bot.classDashAngle) * 710;
      const { target } = nearestBotClassTarget(bot);
      if (target && !bot.classDashHitIds.has(target.id) && Math.hypot(target.x - bot.x, target.y - bot.y) < target.radius + bot.radius + 10) {
        bot.classDashHitIds.add(target.id);
        classDamageTarget(target, 20, bot, bot.x, bot.y, 280);
      }
      if (bot.classActionTimer <= 0) damageInRadius(bot, bot.x, bot.y, 72, 8);
    }
    if (bot.classResource < bot.classResourceMax && !["loader", "summoner"].includes(bot.classId)) {
      const regen = bot.classId === "trapper" || bot.classId === "orbiter" ? 0.22 : 12;
      bot.classResource = Math.min(bot.classResourceMax, bot.classResource + regen * dt);
    }
    if (bot.classId === "loader" && bot.classResource < 3) {
      bot.blueAmmo = Math.min(8, (bot.blueAmmo || 0) + dt * 0.35);
      bot.classResource = (bot.blueAmmo || 0) + (bot.violetAmmo || 0);
    }
    if (bot.classThinkTimer > 0) return true;
    bot.classThinkTimer = random(0.28, 0.7);
    const { target, distance } = nearestBotClassTarget(bot);
    if (!target) return true;
    const nearbyEnemies = bots.filter((candidate) => candidate !== bot && !candidate.dead && candidate.faction !== bot.faction && Math.hypot(candidate.x - bot.x, candidate.y - bot.y) < 220).length;
    const decision = decideClassAi(bot.classId, {
      distance,
      danger: clamp((1 - bot.health / bot.maxHealth) + nearbyEnemies * 0.16, 0, 1),
      alignment: botAlignment(bot, target),
      contested: nearbyEnemies / 3,
      traps: classTraps.filter((trap) => trap.owner === bot).length,
      frontalThreat: distance < 280 ? 0.8 : 0.2,
      allyDanger: 0.3,
      targetHealth: target.health / target.maxHealth,
      isolated: nearbyEnemies <= 1 ? 0.9 : 0.3,
      clustered: nearbyEnemies / 3,
      units: classMinions.filter((minion) => minion.owner === bot).length,
      orbs: bot.classResource,
      ammo: bot.classResource,
      surrounded: nearbyEnemies / 3
    });
    const dx = bot.x - target.x;
    const dy = bot.y - target.y;
    const length = Math.hypot(dx, dy) || 1;
    if (["retreat", "kite", "preserve", "reposition", "collect", "stalk"].includes(decision.action)) {
      bot.targetX = clamp(bot.x + (dx / length) * 260, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.targetY = clamp(bot.y + (dy / length) * 260, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    } else if (distance > decision.idealRange * 1.12) {
      bot.targetX = target.x;
      bot.targetY = target.y;
    } else if (distance < decision.idealRange * 0.72 && bot.classId !== "charger") {
      bot.targetX = clamp(bot.x + (dx / length) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.targetY = clamp(bot.y + (dy / length) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    }
    performBotClassAction(bot, target, decision);
    return true;
  }
/*__ECHO_SECTION_END:0128__*/
