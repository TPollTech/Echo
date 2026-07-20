  function arrivalNova(x, y) {
    const radius = 118 * (player.novaRadiusBonus || 1);
    let hit = false;
    for (const bot of bots) {
      if (bot.dead) continue;
      const dx = bot.x - x;
      const dy = bot.y - y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < radius + bot.radius) {
        bot.health -= 13;
        bot.vx += (dx / distance) * 240;
        bot.vy += (dy / distance) * 240;
        bot.hitTimer = 0.18;
        hit = true;
        if (bot.boss) checkBossPhase(bot);
        if (bot.health <= 0) killBot(bot, player);
      }
    }
    waves.push({ x, y, radius: 18, maxRadius: radius, life: 0.52, maxLife: 0.52, hue: 42, width: 4 });
    if (hit) sound(72, 0.28, "triangle", 0.05);
  }

