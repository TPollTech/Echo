  function updatePlayer(dt) {
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.hitTimer = Math.max(0, player.hitTimer - dt);
    if (!player.phasing && player.hitTimer <= 0 && player.health < player.maxHealth) {
      const baseRegen = 1.15;
      const upgradeRegen = playerUpgrades.regeneration * 0.3;
      player.health = Math.min(player.maxHealth, player.health + (baseRegen + upgradeRegen) * dt);
    }
    player.comboTimer -= dt;
    if (player.comboTimer <= 0) player.combo = 0;

    if (player.skinId === "caotico") player.hue = (runTime * 52) % 360;

    if (player.silenced && !player.silencePermanent) {
      player.silencedTimer -= dt;
      if (player.silencedTimer <= 0) restorePlayerMutations();
    }

    if (player.chainTimer > 0) {
      player.chainTimer -= dt;
      if (player.chainTimer <= 0) player.chainCombo = 0;
    }

    const target = worldTarget();
    if (player.phasing && player.phase) {
      const phase = player.phase;
      const phaseEntity = { x: phase.x, y: phase.y, vx: phase.vx, vy: phase.vy };
      steerVelocity(phaseEntity, target.x, target.y, player.phaseSpeed, dt, 8.5);
      phase.vx = phaseEntity.vx;
      phase.vy = phaseEntity.vy;
      phase.x = clamp(phase.x + phase.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      phase.y = clamp(phase.y + phase.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.max(0, player.energy - player.phaseDrain * dt);
      const last = phase.points[phase.points.length - 1];
      const segmentDistance = Math.hypot(phase.x - last.x, phase.y - last.y);
      if (segmentDistance > 11) {
        phase.points.push({ x: phase.x, y: phase.y });
        phase.distance += segmentDistance;
        if (phase.points.length > 100) phase.points.shift();
      }

      if (player.vortexPull) {
        const vortexRadius = 120;
        const vortexStrength = 2.8 * (player.vortexPullBonus || 1);
        for (const bot of bots) {
          if (bot.dead || bot.phasing) continue;
          const dx = phase.x - bot.x;
          const dy = phase.y - bot.y;
          const dist = Math.hypot(dx, dy);
          if (dist < vortexRadius && dist > 5) {
            const pull = vortexStrength * (1 - dist / vortexRadius) * dt * 60;
            bot.vx += (dx / dist) * pull;
            bot.vy += (dy / dist) * pull;
          }
        }
      }

      collectMotes(phase, true);
      if (player.energy <= 0) endPhase();
    } else {
      steerVelocity(player, target.x, target.y, 205, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.min(player.maxEnergy, player.energy + 13 * dt);
      collectMotes(player, false);
    }

    resolveEntityOverlap();
  }

