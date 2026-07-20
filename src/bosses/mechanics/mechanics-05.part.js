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

