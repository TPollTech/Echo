/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0030__*/
  function createPlayer() {
    const maxHealth = 100 + playerUpgrades.core * 5;
    const maxEnergy = 100 + playerUpgrades.charge * 10;
    const activeSkin = getSelectedSkin();
    return {
      id: "player",
      name: "Viajante",
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      vx: 0,
      vy: 0,
      radius: 18,
      hue: activeSkin.hue < 0 ? 188 : activeSkin.hue,
      skinId: activeSkin.id,
      skin: activeSkin,
      skinGlow: activeSkin.glowIntensity,
      skinTrail: activeSkin.trailWidth,
      health: maxHealth,
      maxHealth,
      energy: maxEnergy,
      maxEnergy,
      score: 0,
      kills: 0,
      combo: 0,
      comboTimer: 0,
      phasing: false,
      phase: null,
      cooldown: 0,
      hitTimer: 0,
      trailDamage: 34,
      ribbonLife: 0.62,
      trailLinger: 0.06,
      cooldownScale: 1 - playerUpgrades.calibration * 0.08,
      pickupRadius: playerUpgrades.collection * 5,
      shellDefense: 1,
      siphon: false,
      killRestore: false,
      phaseSpeed: 430,
      phaseDrain: 29,
      arrivalNova: false,
      arrivalGuard: 0,
      moteHealing: false,
      healScale: 1,
      chainDamage: false,
      chainCombo: 0,
      chainTimer: 0,
      ghostWall: false,
      ghostWallUsed: false,
      vortexPull: false,
      reversal: false,
      dualPhase: false,
      dualPhaseCharges: 0,
      dualPhaseUsed: 0,
      activeSynergies: [],
      ribbonWidthBonus: 1,
      ribbonLingerDamageBonus: 1,
      killRestoreHealBonus: 1,
      siphonBonus: 1,
      novaRadiusBonus: 1,
      vortexPullBonus: 1,
      chainWindow: 2,
      chainMaxStacks: 5,
      phasePickupBonus: 1,
      ghostwallNova: false,
      scoreMultiplier: 1,
      berserkerBonus: 1,
      silenced: false,
      silencedTimer: 0,
      silencePermanent: false,
      silenceSnapshot: null,
      mutationBaseline: null,
      damageDebuff: 1,
      mutations: [],
      nextMutationIndex: 0,
      barrierActive: false,
      barrierTimer: 0,
      overloadActive: false,
      overloadTimer: 0
    };
  }

/*__ECHO_SECTION_END:0030__*/
/*__ECHO_SECTION:0067__*/
  function updatePlayer(dt) {
    updateLevelProgression(player, dt);
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
      const growthSpeed = (player.levelSpeedScale || 1) * (player.rareBoostTimer > 0 ? 1.06 : 1);
      steerVelocity(player, target.x, target.y, 205 * growthSpeed, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.min(player.maxEnergy, player.energy + 13 * dt);
      collectMotes(player, false);
    }

    resolveEntityOverlap();
    updateLevelHud();
  }

/*__ECHO_SECTION_END:0067__*/