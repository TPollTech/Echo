/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0078__*/
  function resolveEntityOverlap() {
    if (player.phasing) return;
    for (const bot of bots) {
      if (bot.dead || bot.phasing) continue;
      const dx = player.x - bot.x;
      const dy = player.y - bot.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minimum = player.radius + bot.radius + 2;
      if (distance < minimum) {
        const overlap = minimum - distance;
        player.x += (dx / distance) * overlap * 0.55;
        player.y += (dy / distance) * overlap * 0.55;
        bot.x -= (dx / distance) * overlap * 0.45;
        bot.y -= (dy / distance) * overlap * 0.45;
      }
    }
  }

/*__ECHO_SECTION_END:0078__*/
