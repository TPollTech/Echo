  function damagePlayer(amount, x, y) {
    if (activeMode !== "solo" || state !== "playing" || player.hitTimer > 0) return;
    const multiplier = player.phasing ? player.shellDefense : 1;
    let applied = amount * multiplier;

    if (player.reversal) {
      const reflected = applied * 0.3;
      for (const bot of bots) {
        if (bot.dead) continue;
        const dist = Math.hypot(bot.x - x, bot.y - y);
        if (dist < 120) {
          bot.health -= reflected;
          bot.hitTimer = 0.22;
          burst(bot.x, bot.y, 0, 6);
          if (bot.health <= 0) killBot(bot, player);
          break;
        }
      }
    }

    player.health -= applied;
    player.hitTimer = 0.55;
    if (screenShakeEnabled) screenShake = Math.max(screenShake, 7);
    if (flashEnabled) flash = Math.max(flash, 0.3);
    const angle = Math.atan2(player.y - y, player.x - x);
    player.vx += Math.cos(angle) * 150;
    player.vy += Math.sin(angle) * 150;
    burst(player.x, player.y, 326, 12);
    for (let i = 0; i < 8; i += 1) {
      const angle = Math.random() * TAU;
      particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * random(60, 180),
        vy: Math.sin(angle) * random(60, 180),
        hue: 326,
        life: random(0.4, 0.8),
        maxLife: 0.8,
        radius: random(2, 4.5)
      });
    }
    sound(82, 0.2, "square", 0.055);

    if (player.health <= 0) {
      if (player.ghostWall && !player.ghostWallUsed) {
        player.ghostWallUsed = true;
        player.health = 1;
        player.hitTimer = 1.5;
        spawnWave(player.x, player.y, player.hue, 140, 0.9);
        burst(player.x, player.y, 42, 20);
        showToast("MURALHA FANTASMA ATIVADA", 2000);
        sound(330, 0.5, "triangle", 0.06);
        if (player.ghostwallNova) {
          for (const bot of bots) {
            if (bot.dead) continue;
            const dx = bot.x - player.x;
            const dy = bot.y - player.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 140 + bot.radius) {
              bot.health -= 22;
              bot.vx += (dx / dist) * 300;
              bot.vy += (dy / dist) * 300;
              bot.hitTimer = 0.2;
              if (bot.boss) checkBossPhase(bot);
              if (bot.health <= 0) killBot(bot, player);
            }
          }
          spawnWave(player.x, player.y, 285, 140, 1);
          sound(55, 0.3, "sawtooth", 0.06);
        }
        return;
      }
      finishSolo("defeat");
    }
  }

