  function beginBotPhase(bot, target = null) {
    const isPlayerTarget = !target || target === player;
    let targetX, targetY;
    if (isPlayerTarget) {
      targetX = player.phasing && player.phase ? player.x : player.x + player.vx * 0.8;
      targetY = player.phasing && player.phase ? player.y : player.y + player.vy * 0.8;
    } else {
      targetX = target.x + (target.vx || 0) * 0.6;
      targetY = target.y + (target.vy || 0) * 0.6;
    }
    const dx = targetX - bot.x;
    const dy = targetY - bot.y;
    const distance = Math.hypot(dx, dy) || 1;
    let maxTravel = bot.boss ? 560 : bot.fastPhase ? 460 : 390;
    if (bot.longRange) maxTravel = 520;
    if (bot.swarmer) maxTravel = 340;
    if (bot.heavyHit) maxTravel = 350;
    const travel = clamp(distance + 70, 150, maxTravel);
    let phaseVelocity = bot.boss ? 455 : bot.fastPhase ? 430 : 390;
    if (bot.longRange) phaseVelocity = 440;
    if (bot.swarmer) phaseVelocity = 460;
    if (bot.heavyHit) phaseVelocity = 350;
    bot.phasing = true;
    bot.phase = {
      x: bot.x,
      y: bot.y,
      vx: (dx / distance) * phaseVelocity,
      vy: (dy / distance) * phaseVelocity,
      targetX: bot.x + (dx / distance) * travel,
      targetY: bot.y + (dy / distance) * travel,
      life: clamp(travel / phaseVelocity, 0.38, bot.boss ? 1.2 : 0.92),
      points: [{ x: bot.x, y: bot.y }],
      attackTarget: isPlayerTarget ? null : target
    };
    bot.energy -= 40;
    spawnWave(bot.x, bot.y, bot.hue, 34, 0.35);
  }

