  function updateBotPhase(bot, dt) {
    const phase = bot.phase;
    phase.life -= dt;
    phase.x += phase.vx * dt;
    phase.y += phase.vy * dt;
    const last = phase.points[phase.points.length - 1];
    if (Math.hypot(phase.x - last.x, phase.y - last.y) > 12) phase.points.push({ x: phase.x, y: phase.y });
    if (phase.life <= 0 || phase.x < WORLD_MARGIN || phase.x > WORLD_SIZE - WORLD_MARGIN || phase.y < WORLD_MARGIN || phase.y > WORLD_SIZE - WORLD_MARGIN) {
      const points = phase.points.map((point) => ({ ...point }));
      bot.x = clamp(phase.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.y = clamp(phase.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.phasing = false;
      bot.phase = null;
      bot.cooldown = bot.boss ? random(2.3, 3.8) : bot.fastPhase ? random(3.5, 5.6) : bot.swarmer ? random(2.8, 4.5) : random(5.2, 9.2);
      ribbons.push({ points, hue: bot.hue, life: 0.38, maxLife: 0.38, width: 8 });
      let hitPlayer = false;
      const hitBots = new Set();
      for (let index = 1; index < points.length; index += 1) {
        const a = points[index - 1];
        const b = points[index];
        if (!hitPlayer) {
          const tx = player.x;
          const ty = player.y;
          if (pointToSegmentDistance(tx, ty, a.x, a.y, b.x, b.y) < player.radius + 10) {
            let dmg = bot.attackDamage * random(0.88, 1.12);
            if (bot.heavyHit) dmg *= 1.4;
            damagePlayer(dmg, bot.x, bot.y);
            if (bot.energyDrain) player.energy = Math.max(0, player.energy - bot.energyDrain);
            hitPlayer = true;
          }
        }
        for (const other of bots) {
          if (other === bot || other.dead || other.faction === bot.faction || hitBots.has(other.id) || (other.archetype === "phantom" && other.stealthed)) continue;
          if (pointToSegmentDistance(other.x, other.y, a.x, a.y, b.x, b.y) < other.radius + 10) {
            let dmg = bot.attackDamage * random(0.88, 1.12);
            if (bot.heavyHit) dmg *= 1.4;
            damageBot(other, dmg, bot, bot.x, bot.y);
            hitBots.add(other.id);
          }
        }
        if (hitPlayer && hitBots.size > 0) break;
      }
      spawnWave(bot.x, bot.y, bot.hue, 58, 0.4);
    }
  }

