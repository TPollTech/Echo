/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0054__*/
  function beginPhase() {
    if (state !== "playing" || mutationPending || player.phasing || player.cooldown > 0 || player.energy < 12) return;
    if (player.dualPhase && player.dualPhaseUsed >= player.dualPhaseCharges) return;
    if (activeMode === "multiplayer") {
      if (multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "phase_begin" }));
      ui.mobilePhase.classList.add("is-active");
      sound(220, 0.2, "sine", 0.025);
      return;
    }
    player.phasing = true;
    player.phase = {
      x: player.x,
      y: player.y,
      vx: player.vx * 0.4,
      vy: player.vy * 0.4,
      points: [{ x: player.x, y: player.y }],
      distance: 0
    };
    player.vx *= 0.25;
    player.vy *= 0.25;
    ui.mobilePhase.classList.add("is-active");
    sound(220, 0.32, "sine", 0.035);
    spawnWave(player.x, player.y, player.hue, 22, 0.35);
  }

  function endPhase(cancelled = false) {
    if (activeMode === "multiplayer") {
      ui.mobilePhase.classList.remove("is-active");
      if (!cancelled && multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "phase_end" }));
      return;
    }
    if (!player.phasing || !player.phase) return;
    const phase = player.phase;
    player.phasing = false;
    ui.mobilePhase.classList.remove("is-active");

    if (cancelled) {
      player.phase = null;
      if (player.dualPhase) {
        player.dualPhaseUsed = 0;
      }
      return;
    }

    const points = phase.points.map((point) => ({ ...point }));
    const hasAttack = phase.distance > 55;

    let effectiveDamage = player.trailDamage * (player.damageDebuff || 1);
    if (player.berserkerBonus && player.berserkerBonus > 1 && player.health < player.maxHealth * 0.5) {
      effectiveDamage *= player.berserkerBonus;
    }
    if (player.chainDamage) {
      player.chainCombo = (player.chainCombo || 0) + 1;
      player.chainTimer = player.chainWindow || 2;
      const chainBonus = 1 + Math.min(player.chainCombo - 1, player.chainMaxStacks || 5) * 0.3;
      effectiveDamage *= chainBonus;
    }

    player.x = clamp(phase.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.y = clamp(phase.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.vx = phase.vx * 0.42;
    player.vy = phase.vy * 0.42;
    player.phase = null;

    if (player.dualPhase) {
      player.dualPhaseUsed += 1;
      if (player.dualPhaseUsed < player.dualPhaseCharges) {
        player.cooldown = 0.12 * player.cooldownScale;
      } else {
        player.cooldown = (hasAttack ? 0.72 : 0.28) * player.cooldownScale;
        player.dualPhaseUsed = 0;
      }
    } else {
      player.cooldown = (hasAttack ? 0.72 : 0.28) * player.cooldownScale;
    }

    if (hasAttack) {
      const hitIds = damageAlongPath(points, effectiveDamage, player);
      const hits = hitIds.size;
      ribbons.push({
        points,
        hue: player.hue,
        life: player.ribbonLife,
        maxLife: player.ribbonLife,
        width: 11 * (player.ribbonWidthBonus || 1) * (player.skinTrail || 1),
        dangerLife: player.trailLinger,
        damage: effectiveDamage * 0.55 * (player.ribbonLingerDamageBonus || 1),
        owner: player,
        hitIds
      });
      if (player.siphon && hits > 0) {
        const siphonMult = player.siphonBonus || 1;
        player.energy = clamp(player.energy + hits * 13 * siphonMult, 0, player.maxEnergy);
        player.health = clamp(player.health + hits * 5 * player.healScale * siphonMult, 0, player.maxHealth);
      }
      if (screenShakeEnabled) screenShake = Math.max(screenShake, 5 + hits * 2.5);
      if (flashEnabled) flash = Math.max(flash, 0.22);
      sound(hits ? 92 : 176, 0.24, hits ? "sawtooth" : "sine", hits ? 0.065 : 0.035);
      if (hits > 0) {
        spawnWave(player.x, player.y, 42, 55 + hits * 15, 0.65);
        for (let i = 0; i < hits * 2; i += 1) {
          spawnParticle(player.x, player.y, 42, random(100, 250), random(0.3, 0.7));
        }
      }
    } else {
      if (player.dualPhase) {
        player.dualPhaseUsed = 0;
      }
    }

    if (player.arrivalNova && hasAttack) {
      arrivalNova(player.x, player.y);
    }
    if (player.arrivalGuard && hasAttack) player.hitTimer = Math.max(player.hitTimer, player.arrivalGuard);

    spawnWave(player.x, player.y, player.hue, hasAttack ? 80 : 38, 0.48);
    for (let i = 0; i < (hasAttack ? 18 : 8); i += 1) {
      spawnParticle(player.x, player.y, player.hue, random(40, 210), random(0.25, 0.65));
    }
  }

/*__ECHO_SECTION_END:0054__*/
/*__ECHO_SECTION:0058__*/
  function damageAlongPath(points, damage, owner, hitIds = new Set()) {
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      for (const bot of bots) {
        if (bot.dead || hitIds.has(bot.id) || (bot.archetype === "phantom" && bot.stealthed)) continue;
        const distance = pointToSegmentDistance(bot.x, bot.y, a.x, a.y, b.x, b.y);
        if (distance < bot.radius + 12) {
          hitIds.add(bot.id);
          let dmg = applyBossDefense(bot, damage);
          dmg = redirectBulwarkDamage(bot, dmg, owner);
          bot.health -= Math.max(1, dmg);
          bot.hitTimer = 0.22;
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          bot.vx += Math.cos(angle) * 185;
          bot.vy += Math.sin(angle) * 185;
          burst(bot.x, bot.y, bot.hue, 11);
          if (bot.boss) checkBossPhase(bot);
          if (bot.health <= 0) killBot(bot, owner);
        }
      }
    }
    return hitIds;
  }

/*__ECHO_SECTION_END:0058__*/
