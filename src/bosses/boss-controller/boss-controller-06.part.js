  function checkBossPhase(bot) {
    if (!bot.boss || !bot.bossTemplate || bot.dead) return;
    const hpRatio = bot.health / bot.maxHealth;
    const phases = bot.bossTemplate.phases;
    let nextPhaseIndex = -1;
    for (let i = phases.length - 1; i > bot.bossPhaseIndex; i--) {
      if (hpRatio <= phases[i].hpThreshold) {
        nextPhaseIndex = i;
        break;
      }
    }
    if (nextPhaseIndex > bot.bossPhaseIndex && !bot.bossPhaseTransitioning) {
      bot.bossPhaseIndex = nextPhaseIndex;
      bot.bossPhaseTransitioning = true;
      bot.bossPhaseTimer = 1.5;
      const phase = phases[nextPhaseIndex];
      bot.roleLabel = phase.label;
      bot.speed = phase.speed;
      bot.aggression = phase.aggression;
      bot.radius = phase.radius;
      bot.attackDamage = phase.attackDamage;
      bot.energy = Math.min(75, phase.energy);
      bot.cooldown = Math.max(bot.cooldown, 1.45);
      bot.sniperAimTimer = 0;
      bot.sniperTarget = null;
      spawnWave(bot.x, bot.y, bot.hue, 160, 1);
      burst(bot.x, bot.y, bot.hue, 40);
      sound(55, 0.5, "sawtooth", 0.08);
      setTimeout(() => sound(110, 0.4, "triangle", 0.06), 150);
      const dialogue = bot.bossTemplate.phaseDialogues[nextPhaseIndex - 1];
      if (dialogue) showToast(dialogue, 2600);
      if (nextPhaseIndex === 1 && bot.archetype === "espectro-decisivo") {
        spawnBossClone(bot);
      }
      if (nextPhaseIndex === 2 && bot.archetype === "tremor-deep") {
        tremorShockwaves(bot);
      }
      if (bot.archetype === "necrostro" && nextPhaseIndex === 2) {
        bot.health = Math.min(bot.maxHealth, bot.health + 50);
        bot.enraged = true;
      }
      if (bot.archetype === "vortice" && nextPhaseIndex === 2) {
        bot.gravityDirection = -1;
        bot.gravityModeTimer = 2;
      }
      if (bot.archetype === "cicatriz") {
        const woundCount = nextPhaseIndex === 2 ? 8 : 4;
        for (let index = 0; index < woundCount; index += 1) {
          scars.push({
            x: clamp(bot.x + random(-280, 280), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
            y: clamp(bot.y + random(-280, 280), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
            hue: 350,
            life: 15,
            maxLife: 15,
            radius: 55,
            wound: true,
            owner: bot
          });
        }
      }
      if (bot.archetype === "mimico") {
        copyMimicMutations(bot, nextPhaseIndex >= 2 ? 3 : 2);
      }
      if (bot.archetype === "silenciador" && nextPhaseIndex === 2) {
        spawnSilenceAnchor(bot);
      }
    }
  }

