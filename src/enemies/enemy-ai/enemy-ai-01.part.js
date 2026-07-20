  function updateBots(dt) {
    for (const bot of bots) {
      if (bot.dead) {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0 && !bot.boss && !bot.bossClone && !bot.noRespawn) respawnBot(bot);
        continue;
      }

      bot.cooldown -= dt;
      bot.hitTimer = Math.max(0, bot.hitTimer - dt);
      bot.thinkTimer -= dt;
      bot.energy = Math.min(100, bot.energy + 8 * dt);

      if (bot.archetype === "berserker" && bot.health < bot.maxHealth * 0.4) {
        bot.speed = bot.baseSpeed * 1.4;
        bot.attackDamage = Math.ceil(botArchetypes.find((a) => a.id === "berserker").attackDamage * 1.5);
      } else if (bot.archetype === "berserker") {
        bot.speed = bot.baseSpeed;
        bot.attackDamage = botArchetypes.find((a) => a.id === "berserker").attackDamage;
      }

      if (bot.archetype === "swarmer") {
        let nearbyPack = 0;
        for (const ally of bots) {
          if (ally === bot || ally.dead || ally.faction !== bot.faction || ally.archetype !== "swarmer") continue;
          if (distanceSq(bot.x, bot.y, ally.x, ally.y) < 190 * 190) nearbyPack += 1;
        }
        bot.speed = bot.baseSpeed * (1 + Math.min(0.3, nearbyPack * 0.1));
      }

      if (bot.archetype === "phantom") {
        bot.stealthTimer += dt;
        const threshold = bot.stealthed ? 2 : 4;
        if (bot.stealthTimer >= threshold) {
          bot.stealthed = !bot.stealthed;
          bot.stealthTimer = 0;
          burst(bot.x, bot.y, bot.hue, 6);
        }
      }

      if (bot.prismaIllusion) {
        bot.illusionLife -= dt;
        if (bot.illusionLife <= 0) {
          bot.dead = true;
          bot.respawnTimer = Number.POSITIVE_INFINITY;
          burst(bot.x, bot.y, bot.hue, 6);
          continue;
        }
      }

      if (bot.boss && bot.bossPhaseTransitioning) {
        bot.bossPhaseTimer -= dt;
        if (bot.bossPhaseTimer <= 0) bot.bossPhaseTransitioning = false;
      }

      if (bot.phasing && bot.phase) {
        updateBotPhase(bot, dt);
        continue;
      }

      if (bot.thinkTimer <= 0) {
        bot.thinkTimer = random(0.5, 1.4);
        bot.factionTarget = null;
        let closestEnemy = null;
        let closestEnemyDist = Infinity;
        for (const other of bots) {
          if (other === bot || other.dead || other.faction === bot.faction || other.boss) continue;
          const d = Math.hypot(bot.x - other.x, bot.y - other.y);
          if (d < closestEnemyDist) { closestEnemy = other; closestEnemyDist = d; }
        }
        if (closestEnemy && closestEnemyDist < 480 && bot.aggression > 0.45 && bot.health > 32) {
          bot.targetX = closestEnemy.x + (closestEnemy.vx || 0) * 0.6;
          bot.targetY = closestEnemy.y + (closestEnemy.vy || 0) * 0.6;
          bot.factionTarget = closestEnemy;
        } else {
          const playerDistance = Math.hypot(bot.x - player.x, bot.y - player.y);
          if (playerDistance < 520 && bot.aggression > 0.45 && bot.health > 32) {
            bot.targetX = player.x + player.vx * 0.7;
            bot.targetY = player.y + player.vy * 0.7;
          } else {
            let closest = null;
            let closestDistance = Infinity;
            for (let sample = 0; sample < 28; sample += 1) {
              const mote = motes[Math.floor(Math.random() * motes.length)];
              const dist = distanceSq(bot.x, bot.y, mote.x, mote.y);
              if (dist < closestDistance) { closest = mote; closestDistance = dist; }
            }
            if (closest) { bot.targetX = closest.x; bot.targetY = closest.y; }
          }
        }
      }

      if (bot.archetype === "sniper") {
        const dx = bot.x - player.x;
        const dy = bot.y - player.y;
        const distanceToPlayer = Math.hypot(dx, dy) || 1;
        const ideal = bot.idealRange || 470;
        if (distanceToPlayer < ideal - 115) {
          bot.targetX = clamp(bot.x + (dx / distanceToPlayer) * 300, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          bot.targetY = clamp(bot.y + (dy / distanceToPlayer) * 300, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        } else if (distanceToPlayer > ideal + 135) {
          bot.targetX = player.x;
          bot.targetY = player.y;
        } else if (bot.sniperAimTimer <= 0) {
          const strafeDirection = Math.sin(runTime * 0.7 + bot.x) >= 0 ? 1 : -1;
          bot.targetX = clamp(player.x + (dx / distanceToPlayer) * ideal + (-dy / distanceToPlayer) * 150 * strafeDirection, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          bot.targetY = clamp(player.y + (dy / distanceToPlayer) * ideal + (dx / distanceToPlayer) * 150 * strafeDirection, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        } else {
          bot.targetX = bot.x;
          bot.targetY = bot.y;
        }
      }

      const desired = { x: bot.x, y: bot.y, vx: bot.vx, vy: bot.vy };
      const movementSpeed = bot.archetype === "sniper" && bot.sniperAimTimer > 0 ? bot.speed * 0.22 : bot.speed;
      steerVelocity(desired, bot.targetX, bot.targetY, movementSpeed, dt, 3.3);
      bot.vx = desired.vx;
      bot.vy = desired.vy;
      bot.x = clamp(bot.x + bot.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.y = clamp(bot.y + bot.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      collectBotMotes(bot);

      if (bot.archetype === "sniper") updateSniper(bot, dt);

      if (bot.archetype === "sprinter" && bot.cooldown <= 0) {
        const distToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
        if (distToPlayer < player.radius + bot.radius + 8) {
          damagePlayer(bot.attackDamage, bot.x, bot.y);
          bot.cooldown = random(1.2, 2.5);
          const angle = Math.atan2(bot.y - player.y, bot.x - player.x);
          bot.vx += Math.cos(angle) * 220;
          bot.vy += Math.sin(angle) * 220;
        }
      }

      if (bot.archetype === "sprinter") {
        let closestEnemy = null;
        let closestDist = Infinity;
        for (const other of bots) {
          if (other === bot || other.dead || other.faction === bot.faction || other.boss) continue;
          const d = Math.hypot(bot.x - other.x, bot.y - other.y);
          if (d < closestDist) { closestEnemy = other; closestDist = d; }
        }
        if (closestEnemy && closestDist < 300) {
          bot.targetX = closestEnemy.x;
          bot.targetY = closestEnemy.y;
        } else {
          const pd = Math.hypot(bot.x - player.x, bot.y - player.y);
          if (pd < 400) {
            bot.targetX = player.x;
            bot.targetY = player.y;
          }
        }
      }

      const distanceToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
      const allyAlreadyAttacking = bots.some((other) => (
        other !== bot
        && other.phasing
        && other.faction === bot.faction
        && distanceSq(other.x, other.y, player.x, player.y) < 600 * 600
      ));
      let attackRange = bot.boss ? 540 : bot.archetype === "hunter" ? 430 : 360;
      if (bot.longRange) attackRange = 580;
      if (bot.swarmer) attackRange = 310;
      if (bot.heavyHit) attackRange = 320;

