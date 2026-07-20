  function damageBot(bot, amount, attacker, x, y) {
    if (bot.dead || bot.hitTimer > 0) return;
    if (bot.archetype === "phantom" && bot.stealthed) return;
    let finalDamage = applyBossDefense(bot, amount);
    finalDamage = redirectBulwarkDamage(bot, finalDamage, attacker);
    bot.health -= Math.max(1, finalDamage);
    bot.hitTimer = 0.22;
    const dx = bot.x - x;
    const dy = bot.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    bot.vx += (dx / dist) * 185;
    bot.vy += (dy / dist) * 185;
    burst(bot.x, bot.y, bot.hue, 11);
    if (bot.boss) checkBossPhase(bot);
    if (bot.health <= 0) killBot(bot, attacker);
  }

