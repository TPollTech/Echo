  function killBot(bot, owner = null) {
    if (bot.dead) return;

    if (bot.archetype === "prisma" && bot.boss && !bot.prismaFragment && !bot.prismaSplit) {
      bot.prismaSplit = true;
      bot.dead = true;
      bot.phasing = false;
      bot.phase = null;
      bot.respawnTimer = Number.POSITIVE_INFINITY;
      const fragmentHealth = Math.max(70, Math.floor(bot.maxHealth * 0.28));
      const fragmentData = [
        { aspect: "red", name: "PRISMA RUBRO", hue: 0, speed: 178, damage: 1.35 },
        { aspect: "blue", name: "PRISMA AZUL", hue: 205, speed: 205, damage: 0.8 },
        { aspect: "green", name: "PRISMA VERDE", hue: 120, speed: 155, damage: 0.72 }
      ];
      const fragments = fragmentData.map((data, index) => {
        const fragment = createBot(bots.length + index, {
          id: `prisma-frag-${data.aspect}-${Math.random().toString(36).slice(2, 7)}`,
          name: data.name,
          archetype: "prisma",
          roleLabel: "FRAGMENTO",
          boss: true,
          bossTemplate: bot.bossTemplate,
          bossPhaseIndex: 1,
          bossPhaseTransitioning: false,
          bossPhaseTimer: 0,
          bossClone: false,
          prismaFragment: true,
          prismaAspect: data.aspect,
          radius: 17,
          hue: data.hue,
          health: fragmentHealth,
          maxHealth: fragmentHealth,
          energy: 100,
          score: Math.floor(bot.bossTemplate.score / 3),
          aggression: 1,
          speed: data.speed,
          baseSpeed: data.speed,
          attackDamage: Math.max(8, Math.floor(bot.attackDamage * data.damage)),
          cooldown: 0.8,
          respawnTimer: 0,
          noRespawn: true
        });
        const angle = index * TAU / 3 + random(-0.18, 0.18);
        fragment.x = clamp(bot.x + Math.cos(angle) * 92, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        fragment.y = clamp(bot.y + Math.sin(angle) * 92, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        return fragment;
      });
      bots.push(...fragments);
      activeBoss = fragments[0];
      showToast("O PRISMA SE FRACIONA EM TRÊS!", 2600);
      sound(330, 0.4, "triangle", 0.06);
      spawnWave(bot.x, bot.y, bot.hue, 180, 0.9);
      burst(bot.x, bot.y, bot.hue, 30);
      return;
    }

    bot.dead = true;
    bot.phasing = false;
    bot.phase = null;
    bot.respawnTimer = bot.boss || bot.bossClone || bot.noRespawn ? Number.POSITIVE_INFINITY : random(4.5, 7.5);
    scars.push({ x: bot.x, y: bot.y, hue: bot.hue, life: 18, maxLife: 18, radius: bot.radius * 2.5 });
    burst(bot.x, bot.y, bot.hue, bot.prismaIllusion ? 8 : 28);
    spawnWave(bot.x, bot.y, bot.hue, bot.prismaIllusion ? 50 : 120, bot.prismaIllusion ? 0.35 : 0.8);

    if (!bot.prismaIllusion) {
      const moteCount = bot.boss ? 14 : bot.bossClone ? 5 : 8;
      for (let i = 0; i < moteCount; i += 1) {
        const mote = createMote();
        mote.x = clamp(bot.x + random(-55, 55), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        mote.y = clamp(bot.y + random(-55, 55), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        mote.type = i < 2 ? "gold" : i === 2 ? "red" : Math.random() > 0.45 ? "violet" : "cyan";
        motes.push(mote);
      }
    }

    if (bot.silenceAnchor) {
      restorePlayerMutations();
      showToast("ÂNCORA DE SILÊNCIO ROMPIDA", 1800);
    }

    if (owner === player && !bot.prismaIllusion) {
      player.kills += 1;
      let reward = 24;
      if (bot.prismaFragment) reward = Math.floor((bot.bossTemplate?.score || 1300) / 3);
      else if (bot.boss) reward = bot.bossTemplate ? bot.bossTemplate.score : 900;
      else if (bot.bossClone) reward = bot.silenceAnchor ? 140 : 120;
      player.score += reward;
      runStats.kills += 1;
      runStats.score = Math.floor(player.score);
      if (player.killRestore) {
        const killBonus = player.killRestoreHealBonus || 1;
        player.health = clamp(player.health + 9 * killBonus, 0, player.maxHealth);
        player.energy = clamp(player.energy + 24 * killBonus, 0, player.maxEnergy);
      }
      showToast(`RUPTURA CONFIRMADA // ${bot.name}`, 1200);
      sound(420, 0.25, "triangle", 0.055);
      setTimeout(() => sound(630, 0.22, "sine", 0.035), 70);
    } else if (owner && owner !== player && !owner.dead && !bot.prismaIllusion) {
      owner.score += 18;
      owner.health = Math.min(owner.maxHealth, owner.health + 8);
      owner.energy = Math.min(100, owner.energy + 20);
      burst(owner.x, owner.y, owner.hue, 8);
    }

    if (bot.prismaFragment) {
      const remaining = bots.filter((candidate) => candidate.prismaFragment && !candidate.dead);
      if (remaining.length > 0) {
        activeBoss = remaining[0];
        showToast(`PRISMA // ${remaining.length} FRAGMENTO${remaining.length > 1 ? "S" : ""} RESTANTE${remaining.length > 1 ? "S" : ""}`, 1600);
        return;
      }
    }

    if (bot.boss && !bot.bossClone) {
      if (bot.archetype === "silenciador") restorePlayerMutations();
      bossDefeated = true;
      bossDefeatedThisRun = true;
      activeBoss = null;
      runStats.bossDefeated = 1;
      if (runTime < 90) runStats.bossSpeedKill = 1;
      window.setTimeout(() => finishSolo("victory"), 900);
    }
  }

