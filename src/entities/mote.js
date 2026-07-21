/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0033__*/
  function createMote(forceNear = false) {
    const roll = Math.random();
    const type = roll > 0.94 ? "gold" : roll > 0.78 ? "red" : roll > 0.58 ? "violet" : "cyan";
    const angle = Math.random() * TAU;
    const nearDistance = random(80, 700);
    const x = forceNear ? player.x + Math.cos(angle) * nearDistance : random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    const y = forceNear ? player.y + Math.sin(angle) * nearDistance : random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    return {
      id: `mote-${Math.random().toString(36).slice(2, 9)}`,
      x: clamp(x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      y: clamp(y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      radius: type === "gold" ? random(3.5, 5) : type === "red" ? random(3, 4.5) : random(2.2, 4),
      type,
      phase: Math.random() * TAU,
      drift: random(0.4, 1.2)
    };
  }

/*__ECHO_SECTION_END:0033__*/
/*__ECHO_SECTION:0068__*/
  function collectMotes(entity, spectral) {
    for (let index = motes.length - 1; index >= 0; index -= 1) {
      const mote = motes[index];
      const range = (spectral ? 16 : player.radius) + mote.radius + 5 + player.pickupRadius * (spectral ? (player.phasePickupBonus || 1) : 1);
      if (distanceSq(entity.x, entity.y, mote.x, mote.y) > range * range) continue;
      motes.splice(index, 1);
      const baseValue = mote.type === "gold" ? 7 : mote.type === "red" ? 10 : mote.type === "violet" ? 3 : 1;
      const spectralMultiplier = spectral ? 0.72 : 1;
      player.score += baseValue * spectralMultiplier * (player.scoreMultiplier || 1);
      player.energy = clamp(player.energy + baseValue * (spectral ? 1.5 : 0.8), 0, player.maxEnergy);
      player.combo = player.comboTimer > 0 ? player.combo + 1 : 1;
      player.comboTimer = 1.45;
      if (player.combo > runStats.maxCombo) runStats.maxCombo = player.combo;
      runStats.score = Math.floor(player.score);

      const experienceMultiplier = spectral ? 0.82 : 1;
      const levelResult = grantRunExperience(player, moteRunExperience(mote.type) * experienceMultiplier);
      notifyRunLevelGain(player, levelResult);

      if (mote.type === "red" && !spectral) {
        player.health = Math.max(1, player.health - 5);
        runStats.redMotes += 1;
        showToast("FRAGMENTO VERMELHO // DANO RECEBIDO", 1200);
        for (const bot of bots) {
          if (bot.dead) continue;
          const dist = Math.hypot(bot.x - mote.x, bot.y - mote.y);
          if (dist < 200 && dist > 5) {
            bot.vx += ((bot.x - mote.x) / dist) * 120;
            bot.vy += ((bot.y - mote.y) / dist) * 120;
          }
        }
        spawnWave(mote.x, mote.y, 0, 55, 0.5);
      }

      if (mote.type === "violet") {
        player.energy = clamp(player.energy + 5, 0, player.maxEnergy);
        player.levelPulse = Math.max(player.levelPulse || 0, 0.24);
      }

      if (player.moteHealing) player.health = clamp(player.health + (mote.type === "gold" ? 3 : mote.type === "red" ? 1.5 : 0.7) * Math.min(2.2, 1 + player.combo / 20) * player.healScale, 0, player.maxHealth);
      playCollectSound(mote.type);
      for (let i = 0; i < (mote.type === "gold" ? 7 : mote.type === "red" ? 5 : 3); i += 1) spawnParticle(mote.x, mote.y, mote.type === "gold" ? 42 : mote.type === "red" ? 0 : mote.type === "violet" ? 268 : 188, random(30, 90), 0.35);
      motes.push(createMote());
      checkMutation();
    }
  }

/*__ECHO_SECTION_END:0068__*/
