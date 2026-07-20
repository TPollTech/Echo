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

      if (player.moteHealing) player.health = clamp(player.health + (mote.type === "gold" ? 3 : mote.type === "red" ? 1.5 : 0.7) * Math.min(2.2, 1 + player.combo / 20) * player.healScale, 0, player.maxHealth);
      playCollectSound(mote.type);
      for (let i = 0; i < (mote.type === "gold" ? 7 : mote.type === "red" ? 5 : 3); i += 1) spawnParticle(mote.x, mote.y, mote.type === "gold" ? 42 : mote.type === "red" ? 0 : mote.type === "violet" ? 268 : 188, random(30, 90), 0.35);
      motes.push(createMote());
      checkMutation();
    }
  }

