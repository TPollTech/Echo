      if (bot.boss && bot.bossTemplate && !bot.bossPhaseTransitioning) {
        const distToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
        if (bot.archetype === "tremor-deep" && bot.bossPhaseIndex >= 1 && bot.cooldown <= 0 && distToPlayer < 200 && bot.energy > 30) {
          spawnWave(bot.x, bot.y, bot.hue, 160, 0.6);
          burst(bot.x, bot.y, bot.hue, 18);
          sound(40, 0.3, "sawtooth", 0.05);
          const dx = player.x - bot.x;
          const dy = player.y - bot.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 160) damagePlayer(Math.floor(bot.attackDamage * 0.6), bot.x, bot.y);
          bot.cooldown = bot.bossPhaseIndex >= 2 ? random(2.5, 4) : random(4, 6);
          bot.energy -= 30;
        }
        if (bot.archetype === "espectro-decisivo" && !bot.bossClone && Math.random() < 0.02 * (bot.bossPhaseIndex + 1)) {
          for (const clone of bots) {
            if (clone !== bot && clone.bossClone && !clone.dead) {
              clone.x = clamp(player.x + random(-80, 80), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
              clone.y = clamp(player.y + random(-80, 80), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
              burst(clone.x, clone.y, clone.hue, 12);
              sound(330, 0.2, "triangle", 0.04);
            }
          }
        }
        if (bot.archetype === "necrostro" && bot.cooldown <= 0 && bot.energy > 25) {
          const healAmount = bot.bossPhaseIndex >= 2 ? 50 : bot.bossPhaseIndex >= 1 ? 18 : 12;
          const healRadius = bot.bossPhaseIndex >= 1 ? 450 : 400;
          for (const other of bots) {
            if (other === bot || other.dead) continue;
            const d = Math.hypot(other.x - bot.x, other.y - bot.y);
            if (d < healRadius) {
              const effective = Math.floor(healAmount * (1 - d / healRadius));
              other.health = Math.min(other.maxHealth, other.health + effective);
              burst(other.x, other.y, 120, 3);
            }
          }
          spawnWave(bot.x, bot.y, 120, 180, 0.5);
          sound(220, 0.25, "sine", 0.03);
          bot.cooldown = bot.bossPhaseIndex >= 2 ? random(3, 5) : random(5, 8);
          bot.energy -= 25;
          if (bot.bossPhaseIndex >= 1) {
            bot.health = Math.min(bot.maxHealth, bot.health + 3);
          }
        }
        if (bot.archetype === "vortice") {
          const pullStrength = bot.bossPhaseIndex >= 2 ? 230 : bot.bossPhaseIndex >= 1 ? 175 : 135;
          const pullRadius = 360;
          let direction = 1;
          if (bot.bossPhaseIndex >= 2) {
            bot.gravityModeTimer = (bot.gravityModeTimer || 2) - dt;
            if (bot.gravityModeTimer <= 0) {
              bot.gravityDirection = (bot.gravityDirection || 1) * -1;
              bot.gravityModeTimer = 2;
              spawnWave(bot.x, bot.y, bot.gravityDirection < 0 ? 188 : bot.hue, 220, 0.55);
            }
            direction = bot.gravityDirection || 1;
          }
          const dxp = bot.x - player.x;
          const dyp = bot.y - player.y;
          const dp = Math.hypot(dxp, dyp) || 1;
          if (dp < pullRadius) {
            const force = pullStrength * (1 - dp / pullRadius) * direction;
            player.vx += (dxp / dp) * force * dt;
            player.vy += (dyp / dp) * force * dt;
          }
          for (const other of bots) {
            if (other === bot || other.dead) continue;
            const dx = bot.x - other.x;
            const dy = bot.y - other.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < pullRadius) {
              const force = pullStrength * 0.5 * (1 - d / pullRadius) * direction;
              other.vx += (dx / d) * force * dt;
              other.vy += (dy / d) * force * dt;
            }
          }
          if (bot.bossPhaseIndex >= 1 && bot.cooldown <= 0 && bot.energy > 20) {
            for (let index = 0; index < 2; index += 1) {
              const angle = runTime * (1.9 + index * 0.35) + index * Math.PI;
              const orbitDistance = 85 + index * 58;
              const orbitX = bot.x + Math.cos(angle) * orbitDistance;
              const orbitY = bot.y + Math.sin(angle) * orbitDistance;
              if (Math.hypot(player.x - orbitX, player.y - orbitY) < 54) {
                damagePlayer(Math.floor(bot.attackDamage * 0.42), orbitX, orbitY);
              }
            }
            spawnWave(bot.x, bot.y, bot.hue, 120, 0.4);
            bot.cooldown = random(2.8, 4.5);
            bot.energy -= 20;
          }
        }
        if (bot.archetype === "cicatriz" && bot.cooldown <= 0 && bot.energy > 20) {
          const woundCount = bot.bossPhaseIndex >= 2 ? 5 : bot.bossPhaseIndex >= 1 ? 3 : 1;
          for (let w = 0; w < woundCount; w++) {
            const wx = bot.bossPhaseIndex >= 2
              ? clamp(random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN)
              : clamp(bot.x + random(-120, 120), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
            const wy = bot.bossPhaseIndex >= 2
              ? clamp(random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN)
              : clamp(bot.y + random(-120, 120), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
            scars.push({ x: wx, y: wy, hue: 350, life: 15, maxLife: 15, radius: 55, wound: true, owner: bot });
          }
          spawnWave(bot.x, bot.y, 350, 80, 0.4);
          sound(55, 0.2, "sawtooth", 0.04);
          bot.cooldown = bot.bossPhaseIndex >= 2 ? random(2, 3.5) : random(3.5, 6);
          bot.energy -= 20;
        }
        if (bot.archetype === "mimico" && bot.cooldown <= 0 && bot.energy > 35 && player.mutations.length > 0) {
          const maxCopies = bot.bossPhaseIndex >= 2 ? 3 : bot.bossPhaseIndex >= 1 ? 2 : 1;
          copyMimicMutations(bot, maxCopies);
          if (bot.copiedRegen) bot.health = Math.min(bot.maxHealth, bot.health + bot.copiedRegen * 4);
          spawnWave(bot.x, bot.y, bot.hue, 100, 0.5);
          burst(bot.x, bot.y, bot.hue, 14);
          sound(380, 0.2, "triangle", 0.04);
          bot.cooldown = random(6, 9);
          bot.energy -= 35;
        }
        if (bot.prismaFragment && bot.cooldown <= 0) {
          if (bot.prismaAspect === "green") {
            for (const fragment of bots) {
              if (!fragment.prismaFragment || fragment.dead) continue;
              fragment.health = Math.min(fragment.maxHealth, fragment.health + 16);
              burst(fragment.x, fragment.y, 120, 3);
            }
            spawnWave(bot.x, bot.y, 120, 150, 0.55);
            bot.cooldown = 4.5;
          } else if (bot.prismaAspect === "blue") {
            spawnPrismaIllusions(bot);
            bot.cooldown = 4;
          } else {
            bot.energy = Math.min(100, bot.energy + 20);
            bot.cooldown = 2.4;
          }
        }
        if (bot.archetype === "silenciador" && bot.cooldown <= 0 && bot.energy > 30) {
          const permanent = bot.bossPhaseIndex >= 2 && bots.some((candidate) => candidate.silenceAnchor && !candidate.dead);
          const silenceDuration = bot.bossPhaseIndex >= 1 ? 4 : 3;
          const silenceInterval = bot.bossPhaseIndex >= 1 ? 5 : 8;
          silencePlayer(permanent ? Number.POSITIVE_INFINITY : silenceDuration, permanent);
          spawnWave(player.x, player.y, 280, 140, 0.7);
          burst(player.x, player.y, 280, 16);
          sound(82, 0.3, "sawtooth", 0.05);
          showToast(permanent ? "SILÊNCIO ABSOLUTO — ROMPA A ÂNCORA" : "SILENCIADO — MUTAÇÕES DESATIVADAS", 2200);
          bot.cooldown = silenceInterval;
          bot.energy -= 30;
        }
        if (bot.archetype === "prisma" && bot.cooldown <= 0 && bot.energy > 25) {
          const dashAngle = Math.random() * TAU;
          bot.vx += Math.cos(dashAngle) * 250;
          bot.vy += Math.sin(dashAngle) * 250;
          spawnWave(bot.x, bot.y, bot.hue, 60, 0.3);
          burst(bot.x, bot.y, bot.hue, 8);
          bot.cooldown = random(1.5, 3);
          bot.energy -= 25;
        }
      }

