/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0075__*/
  function updateSniper(bot, dt) {
    const fallbackTarget = player;

    if (bot.sniperAimTimer > 0) {
      const target = bot.sniperTarget && !bot.sniperTarget.dead ? bot.sniperTarget : fallbackTarget;
      bot.sniperTarget = target;
      bot.sniperAimTimer -= dt;

      const leadScale = target === player ? 0.2 : 0.3;
      const tracking = clamp(dt * 2.2, 0, 1);
      bot.sniperAimX = lerp(bot.sniperAimX, target.x + (target.vx || 0) * leadScale, tracking);
      bot.sniperAimY = lerp(bot.sniperAimY, target.y + (target.vy || 0) * leadScale, tracking);

      if (bot.sniperAimTimer <= 0) {
        const dx = bot.sniperAimX - bot.x;
        const dy = bot.sniperAimY - bot.y;
        const distance = Math.hypot(dx, dy) || 1;
        const shotLength = 820;
        const endX = clamp(bot.x + (dx / distance) * shotLength, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        const endY = clamp(bot.y + (dy / distance) * shotLength, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        const points = [{ x: bot.x, y: bot.y }, { x: endX, y: endY }];

        ribbons.push({
          points,
          hue: bot.hue,
          life: 0.24,
          maxLife: 0.24,
          width: 3.2,
          sniperShot: true
        });
        spawnWave(bot.x, bot.y, bot.hue, 62, 0.32);
        burst(bot.x, bot.y, bot.hue, 10);
        sound(178, 0.12, "square", 0.035);
        setTimeout(() => sound(62, 0.2, "triangle", 0.028), 35);

        if (target === player) {
          const missDistance = pointToSegmentDistance(player.x, player.y, bot.x, bot.y, endX, endY);
          if (missDistance < player.radius + 10) {
            damagePlayer(bot.attackDamage * random(0.96, 1.08), bot.x, bot.y);
          }
        } else if (!target.dead) {
          const missDistance = pointToSegmentDistance(target.x, target.y, bot.x, bot.y, endX, endY);
          if (missDistance < target.radius + 9) {
            damageBot(target, bot.attackDamage * random(0.92, 1.06), bot, bot.x, bot.y);
          }
        }

        bot.cooldown = random(3.6, 5.1);
        bot.energy = Math.max(0, bot.energy - 34);
        bot.sniperTarget = null;
        bot.sniperAimTimer = 0;
      }
      return;
    }

    if (bot.cooldown > 0 || bot.energy < 34 || bot.stealthed) return;

    const factionTarget = bot.factionTarget && !bot.factionTarget.dead ? bot.factionTarget : null;
    const target = factionTarget || fallbackTarget;
    const targetDistance = Math.hypot(bot.x - target.x, bot.y - target.y);
    if (targetDistance < 245 || targetDistance > 700) return;

    bot.sniperTarget = target;
    bot.sniperAimDuration = targetDistance > 540 ? 1.12 : 0.92;
    bot.sniperAimTimer = bot.sniperAimDuration;
    bot.sniperAimX = target.x + (target.vx || 0) * 0.42;
    bot.sniperAimY = target.y + (target.vy || 0) * 0.42;
    bot.vx *= 0.35;
    bot.vy *= 0.35;
    spawnWave(bot.x, bot.y, bot.hue, 40, 0.35);

    if (target === player && !bot.sniperWarned) {
      bot.sniperWarned = true;
      showToast("FRANCO-ATIRADOR MIRANDO — SAIA DA LINHA", 1700);
    }
  }

/*__ECHO_SECTION_END:0075__*/
