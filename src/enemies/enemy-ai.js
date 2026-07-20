/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0072__*/
  const defaultEnemyBehavior = Object.freeze({});
  const enemyBehaviorRegistry = Object.freeze({
    hunter: Object.freeze({ attackRange: 430 }),
    berserker: Object.freeze({
      beforeMovement(bot) {
        const definition = botArchetypes.find((entry) => entry.id === bot.archetype);
        if (bot.health < bot.maxHealth * 0.4) {
          bot.speed = bot.baseSpeed * 1.4;
          bot.attackDamage = Math.ceil(definition.attackDamage * 1.5);
        } else {
          bot.speed = bot.baseSpeed;
          bot.attackDamage = definition.attackDamage;
        }
      }
    }),
    swarmer: Object.freeze({
      attackRange: 310,
      beforeMovement(bot) {
        let nearbyPack = 0;
        for (const ally of bots) {
          if (ally === bot || ally.dead || ally.faction !== bot.faction || ally.archetype !== bot.archetype) continue;
          if (distanceSq(bot.x, bot.y, ally.x, ally.y) < 190 * 190) nearbyPack += 1;
        }
        bot.speed = bot.baseSpeed * (1 + Math.min(0.3, nearbyPack * 0.1));
      }
    }),
    phantom: Object.freeze({
      untargetableWhileStealthed: true,
      beforeMovement(bot, dt) {
        bot.stealthTimer += dt;
        const threshold = bot.stealthed ? 2 : 4;
        if (bot.stealthTimer >= threshold) {
          bot.stealthed = !bot.stealthed;
          bot.stealthTimer = 0;
          burst(bot.x, bot.y, bot.hue, 6);
        }
      }
    }),
    sniper: Object.freeze({
      attackRange: 580,
      phaseAttack: false,
      updateTarget(bot) {
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
      },
      movementSpeed(bot) {
        return bot.sniperAimTimer > 0 ? bot.speed * 0.22 : bot.speed;
      },
      afterMovement(bot, dt) {
        updateSniper(bot, dt);
      }
    }),
    sprinter: Object.freeze({
      phaseAttack: false,
      afterMovement(bot) {
        if (bot.cooldown <= 0) {
          const distToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
          if (distToPlayer < player.radius + bot.radius + 8) {
            damagePlayer(bot.attackDamage, bot.x, bot.y);
            bot.cooldown = random(1.2, 2.5);
            const angle = Math.atan2(bot.y - player.y, bot.x - player.x);
            bot.vx += Math.cos(angle) * 220;
            bot.vy += Math.sin(angle) * 220;
          }
        }

        let closestEnemy = null;
        let closestDist = Infinity;
        for (const other of bots) {
          if (other === bot || other.dead || other.faction === bot.faction || other.boss) continue;
          const distance = Math.hypot(bot.x - other.x, bot.y - other.y);
          if (distance < closestDist) {
            closestEnemy = other;
            closestDist = distance;
          }
        }
        if (closestEnemy && closestDist < 300) {
          bot.targetX = closestEnemy.x;
          bot.targetY = closestEnemy.y;
        } else {
          const playerDistance = Math.hypot(bot.x - player.x, bot.y - player.y);
          if (playerDistance < 400) {
            bot.targetX = player.x;
            bot.targetY = player.y;
          }
        }
      }
    }),
    bruiser: Object.freeze({ attackRange: 320 }),
    bulwark: Object.freeze({ attackRange: 320 })
  });

  function getEnemyBehavior(bot) {
    return enemyBehaviorRegistry[bot.archetype] || defaultEnemyBehavior;
  }

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
      const behavior = getEnemyBehavior(bot);
      behavior.beforeMovement?.(bot, dt);

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
          const distance = Math.hypot(bot.x - other.x, bot.y - other.y);
          if (distance < closestEnemyDist) {
            closestEnemy = other;
            closestEnemyDist = distance;
          }
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
              const distance = distanceSq(bot.x, bot.y, mote.x, mote.y);
              if (distance < closestDistance) {
                closest = mote;
                closestDistance = distance;
              }
            }
            if (closest) {
              bot.targetX = closest.x;
              bot.targetY = closest.y;
            }
          }
        }
      }

      behavior.updateTarget?.(bot, dt);
      const desired = { x: bot.x, y: bot.y, vx: bot.vx, vy: bot.vy };
      const movementSpeed = behavior.movementSpeed?.(bot) ?? bot.speed;
      steerVelocity(desired, bot.targetX, bot.targetY, movementSpeed, dt, 3.3);
      bot.vx = desired.vx;
      bot.vy = desired.vy;
      bot.x = clamp(bot.x + bot.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.y = clamp(bot.y + bot.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      collectBotMotes(bot);
      behavior.afterMovement?.(bot, dt);

      const distanceToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
      const allyAlreadyAttacking = bots.some((other) => (
        other !== bot
        && other.phasing
        && other.faction === bot.faction
        && distanceSq(other.x, other.y, player.x, player.y) < 600 * 600
      ));
      let attackRange = bot.boss ? 540 : (behavior.attackRange ?? 360);
      if (bot.longRange) attackRange = 580;
      if (bot.swarmer) attackRange = 310;
      if (bot.heavyHit) attackRange = 320;

/*__ECHO_SECTION_END:0072__*/
/*__ECHO_SECTION:0074__*/
      if (behavior.phaseAttack !== false && !bot.stealthed && !(bot.boss && bot.bossPhaseTransitioning)) {
        if (bot.factionTarget && !bot.factionTarget.dead && bot.cooldown <= 0 && bot.energy > 45 && bot.aggression > 0.5) {
          const distToTarget = Math.hypot(bot.x - bot.factionTarget.x, bot.y - bot.factionTarget.y);
          if (distToTarget < attackRange) {
            beginBotPhase(bot, bot.factionTarget);
          }
        } else if (bot.cooldown <= 0 && bot.energy > 45 && distanceToPlayer < attackRange && bot.aggression > 0.5 && (!allyAlreadyAttacking || bot.boss || bot.swarmer)) {
          beginBotPhase(bot);
        }
      }
    }
  }


/*__ECHO_SECTION_END:0074__*/
/*__ECHO_SECTION:0077__*/
  function beginBotPhase(bot, target = null) {
    const isPlayerTarget = !target || target === player;
    let targetX, targetY;
    if (isPlayerTarget) {
      targetX = player.phasing && player.phase ? player.x : player.x + player.vx * 0.8;
      targetY = player.phasing && player.phase ? player.y : player.y + player.vy * 0.8;
    } else {
      targetX = target.x + (target.vx || 0) * 0.6;
      targetY = target.y + (target.vy || 0) * 0.6;
    }
    const dx = targetX - bot.x;
    const dy = targetY - bot.y;
    const distance = Math.hypot(dx, dy) || 1;
    let maxTravel = bot.boss ? 560 : bot.fastPhase ? 460 : 390;
    if (bot.longRange) maxTravel = 520;
    if (bot.swarmer) maxTravel = 340;
    if (bot.heavyHit) maxTravel = 350;
    const travel = clamp(distance + 70, 150, maxTravel);
    let phaseVelocity = bot.boss ? 455 : bot.fastPhase ? 430 : 390;
    if (bot.longRange) phaseVelocity = 440;
    if (bot.swarmer) phaseVelocity = 460;
    if (bot.heavyHit) phaseVelocity = 350;
    bot.phasing = true;
    bot.phase = {
      x: bot.x,
      y: bot.y,
      vx: (dx / distance) * phaseVelocity,
      vy: (dy / distance) * phaseVelocity,
      targetX: bot.x + (dx / distance) * travel,
      targetY: bot.y + (dy / distance) * travel,
      life: clamp(travel / phaseVelocity, 0.38, bot.boss ? 1.2 : 0.92),
      points: [{ x: bot.x, y: bot.y }],
      attackTarget: isPlayerTarget ? null : target
    };
    bot.energy -= 40;
    spawnWave(bot.x, bot.y, bot.hue, 34, 0.35);
  }

  function updateBotPhase(bot, dt) {
    const phase = bot.phase;
    phase.life -= dt;
    phase.x += phase.vx * dt;
    phase.y += phase.vy * dt;
    const last = phase.points[phase.points.length - 1];
    if (Math.hypot(phase.x - last.x, phase.y - last.y) > 12) phase.points.push({ x: phase.x, y: phase.y });
    if (phase.life <= 0 || phase.x < WORLD_MARGIN || phase.x > WORLD_SIZE - WORLD_MARGIN || phase.y < WORLD_MARGIN || phase.y > WORLD_SIZE - WORLD_MARGIN) {
      const points = phase.points.map((point) => ({ ...point }));
      bot.x = clamp(phase.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.y = clamp(phase.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.phasing = false;
      bot.phase = null;
      bot.cooldown = bot.boss ? random(2.3, 3.8) : bot.fastPhase ? random(3.5, 5.6) : bot.swarmer ? random(2.8, 4.5) : random(5.2, 9.2);
      ribbons.push({ points, hue: bot.hue, life: 0.38, maxLife: 0.38, width: 8 });
      let hitPlayer = false;
      const hitBots = new Set();
      for (let index = 1; index < points.length; index += 1) {
        const a = points[index - 1];
        const b = points[index];
        if (!hitPlayer) {
          const tx = player.x;
          const ty = player.y;
          if (pointToSegmentDistance(tx, ty, a.x, a.y, b.x, b.y) < player.radius + 10) {
            let dmg = bot.attackDamage * random(0.88, 1.12);
            if (bot.heavyHit) dmg *= 1.4;
            damagePlayer(dmg, bot.x, bot.y);
            if (bot.energyDrain) player.energy = Math.max(0, player.energy - bot.energyDrain);
            hitPlayer = true;
          }
        }
        for (const other of bots) {
          const otherBehavior = getEnemyBehavior(other);
          if (other === bot || other.dead || other.faction === bot.faction || hitBots.has(other.id) || (otherBehavior.untargetableWhileStealthed && other.stealthed)) continue;
          if (pointToSegmentDistance(other.x, other.y, a.x, a.y, b.x, b.y) < other.radius + 10) {
            let dmg = bot.attackDamage * random(0.88, 1.12);
            if (bot.heavyHit) dmg *= 1.4;
            damageBot(other, dmg, bot, bot.x, bot.y);
            hitBots.add(other.id);
          }
        }
        if (hitPlayer && hitBots.size > 0) break;
      }
      spawnWave(bot.x, bot.y, bot.hue, 58, 0.4);
    }
  }

/*__ECHO_SECTION_END:0077__*/
