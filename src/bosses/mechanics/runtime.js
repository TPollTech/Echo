/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0061__*/
  function copyMimicMutations(bot, requestedCount) {
    const available = player.mutations
      .map((id) => mutations.find((mutation) => mutation.id === id))
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, requestedCount));
    const phase = bot.bossTemplate?.phases?.[bot.bossPhaseIndex] || {};
    const offensive = new Set(["blade", "overclock", "chain", "resonance"]);
    const mobile = new Set(["drift", "dualphase", "focus"]);
    const defensive = new Set(["shell", "prism", "ghostwall"]);
    const sustain = new Set(["siphon", "reweave", "resonance"]);
    bot.copiedMutationIds = available.map((mutation) => mutation.id);
    const offenseCount = bot.copiedMutationIds.filter((id) => offensive.has(id)).length;
    const mobileCount = bot.copiedMutationIds.filter((id) => mobile.has(id)).length;
    const defenseCount = bot.copiedMutationIds.filter((id) => defensive.has(id)).length;
    const sustainCount = bot.copiedMutationIds.filter((id) => sustain.has(id)).length;
    bot.attackDamage = Math.floor((phase.attackDamage || bot.attackDamage) * (1 + offenseCount * 0.18));
    bot.speed = (phase.speed || bot.baseSpeed || bot.speed) * (1 + mobileCount * 0.12);
    bot.baseSpeed = bot.speed;
    bot.copiedDefense = defenseCount > 0 ? Math.max(0.62, 1 - defenseCount * 0.12) : 1;
    bot.copiedRegen = sustainCount * 1.5;
    bot.hue = available.length ? (45 + available.reduce((sum, mutation) => sum + mutations.indexOf(mutation) * 23, 0)) % 360 : 45;
  }

  function spawnPrismaIllusions(source) {
    if (bots.some((bot) => bot.prismaIllusion && bot.illusionSourceId === source.id && !bot.dead)) return;
    for (let index = 0; index < 2; index += 1) {
      const illusion = createBot(bots.length + index, {
        id: `prisma-illusion-${Math.random().toString(36).slice(2, 7)}`,
        name: "REFRAÇÃO",
        archetype: "prisma",
        roleLabel: "ILUSÃO",
        boss: false,
        bossClone: true,
        prismaIllusion: true,
        illusionSourceId: source.id,
        illusionLife: 4,
        noRespawn: true,
        hue: source.hue + random(-18, 18),
        radius: 13,
        health: 1,
        maxHealth: 1,
        speed: source.speed * 1.12,
        baseSpeed: source.speed * 1.12,
        aggression: 0.35,
        attackDamage: 0,
        cooldown: 99
      });
      const angle = index * Math.PI + random(-0.4, 0.4);
      illusion.x = clamp(source.x + Math.cos(angle) * 70, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      illusion.y = clamp(source.y + Math.sin(angle) * 70, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bots.push(illusion);
    }
  }

  function spawnSilenceAnchor(source) {
    const existing = bots.find((bot) => bot.silenceAnchor && !bot.dead);
    if (existing) return existing;
    const anchor = createBot(bots.length, {
      id: `silence-anchor-${Math.random().toString(36).slice(2, 7)}`,
      name: "ÂNCORA DO VÁCUO",
      archetype: "silenciador",
      roleLabel: "ÂNCORA",
      boss: false,
      bossClone: true,
      silenceAnchor: true,
      noRespawn: true,
      hue: 285,
      radius: 20,
      health: 95,
      maxHealth: 95,
      speed: 42,
      baseSpeed: 42,
      aggression: 0.2,
      attackDamage: 6,
      cooldown: 4
    });
    const angle = Math.random() * TAU;
    anchor.x = clamp(source.x + Math.cos(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    anchor.y = clamp(source.y + Math.sin(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(anchor);
    source.silenceAnchorId = anchor.id;
    silencePlayer(Number.POSITIVE_INFINITY, true);
    showToast("ROMPA A ÂNCORA PARA RECUPERAR AS MUTAÇÕES", 2800);
    return anchor;
  }

/*__ECHO_SECTION_END:0061__*/
/*__ECHO_SECTION:0063__*/
  function spawnBossClone(original) {
    const clone = createBot(19, {
      id: `boss-clone-${Math.random().toString(36).slice(2, 7)}`,
      name: "CLONE",
      archetype: original.archetype,
      roleLabel: "CLONE",
      boss: false,
      bossClone: true,
      radius: original.radius * 0.8,
      hue: original.hue + 30,
      health: Math.floor(original.maxHealth * 0.25),
      maxHealth: Math.floor(original.maxHealth * 0.25),
      energy: 100,
      score: 300,
      aggression: 1,
      speed: original.speed * 1.15,
      attackDamage: Math.floor(original.attackDamage * 0.7),
      cooldown: 1,
      respawnTimer: 0
    });
    const angle = Math.random() * TAU;
    clone.x = clamp(original.x + Math.cos(angle) * 120, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    clone.y = clamp(original.y + Math.sin(angle) * 120, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(clone);
    showToast("UM CLONE SE MATERIALIZA!", 1800);
    sound(220, 0.3, "triangle", 0.05);
  }

  function tremorShockwaves(bot) {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (bot.dead) return;
        for (const otherBot of bots) {
          if (otherBot === bot || otherBot.dead) continue;
          const dx = otherBot.x - bot.x;
          const dy = otherBot.y - bot.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 200) {
            otherBot.health -= 18;
            otherBot.vx += (dx / dist) * 260;
            otherBot.vy += (dy / dist) * 260;
            otherBot.hitTimer = 0.18;
            if (otherBot.health <= 0) killBot(otherBot, bot);
          }
        }
        const dx = player.x - bot.x;
        const dy = player.y - bot.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 200) {
          damagePlayer(15, bot.x, bot.y);
        }
        spawnWave(bot.x, bot.y, bot.hue, 200, 0.7);
        burst(bot.x, bot.y, bot.hue, 20);
        sound(40, 0.35, "sawtooth", 0.06);
      }, i * 400);
    }
  }

/*__ECHO_SECTION_END:0063__*/
/*__ECHO_SECTION:0073__*/
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

/*__ECHO_SECTION_END:0073__*/
