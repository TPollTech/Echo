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

