/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0015__*/
  let bossSpawned = false;
  let bossDefeated = false;
/*__ECHO_SECTION_END:0015__*/
/*__ECHO_SECTION:0019__*/
  let bossDefeatedThisRun = false;
  let activeBoss = null;

/*__ECHO_SECTION_END:0019__*/
/*__ECHO_SECTION:0032__*/
  function createBoss(templateId = null) {
    const template = bossTemplates.find((entry) => entry.id === templateId)
      || bossTemplates[Math.floor(Math.random() * bossTemplates.length)];
    const phase0 = template.phases[0];
    return createBot(19, {
      id: `boss-${template.id}-${Math.random().toString(36).slice(2, 7)}`,
      name: template.name,
      archetype: template.id,
      roleLabel: phase0.label,
      boss: true,
      bossTemplate: template,
      bossPhaseIndex: 0,
      bossPhaseTransitioning: false,
      bossPhaseTimer: 0,
      bossClone: false,
      radius: phase0.radius,
      hue: template.hue,
      health: 480,
      maxHealth: 480,
      energy: phase0.energy,
      score: template.score,
      aggression: phase0.aggression,
      speed: phase0.speed,
      attackDamage: phase0.attackDamage,
      cooldown: 1.2,
      respawnTimer: 0,
      telegraphType: null,
      telegraphTimer: 0,
      telegraphMaxTimer: 0,
      telegraphRadius: 0,
      telegraphProjectiles: 0
    });
  }

/*__ECHO_SECTION_END:0032__*/
/*__ECHO_SECTION:0056__*/
  function applyBossDefense(bot, amount) {
    let adjusted = amount;
    if (bot.archetype === "necrostro" && bot.bossPhaseIndex >= 1) adjusted *= 0.6;
    if (bot.archetype === "silenciador" && bot.bossPhaseIndex >= 1) adjusted *= 0.75;
    if (bot.copiedDefense) adjusted *= bot.copiedDefense;
    return adjusted;
  }

/*__ECHO_SECTION_END:0056__*/
/*__ECHO_SECTION:0060__*/
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
    bot.telegraphType = null;
    bot.telegraphTimer = 0;
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
        appendIndexedMote(mote);
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
      const bossRewards = {
        "coroa-vazia": { motes: 20, bonusScore: 150, toast: "A COROA VAZIA FOI ROMPIDA // RECOMPENSA COLETADA" },
        "espectro-decisivo": { motes: 22, bonusScore: 180, toast: "O ESPECTRO DECISIVO SE DISSOLVE // RECOMPENSA COLETADA" },
        "tremor-deep": { motes: 24, bonusScore: 200, toast: "O TREMOR DEEP CESOU // RECOMPENSA COLETADA" },
        "necrostro": { motes: 18, bonusScore: 160, toast: "O NECRÓSTRO RETORNA AO SILÊNCIO // RECOMPENSA COLETADA" },
        "vortice": { motes: 20, bonusScore: 190, toast: "O VÓRVICE COLAPSOU // RECOMPENSA COLETADA" },
        "cicatriz": { motes: 18, bonusScore: 170, toast: "A CICATRIZ SAROU // RECOMPENSA COLETADA" },
        "mimico": { motes: 16, bonusScore: 155, toast: "O ESPELHO QUEBROU // RECOMPENSA COLETADA" },
        "prisma": { motes: 22, bonusScore: 210, toast: "OS FRAGMENTOS SE DISPERSARAM // RECOMPENSA COLETADA" },
        "silenciador": { motes: 20, bonusScore: 175, toast: "O SILÊNCIO FOI ROMPIDO // RECOMPENSA COLETADA" }
      };
      const reward = bossRewards[bot.archetype];
      if (reward) {
        player.score += reward.bonusScore;
        runStats.score = Math.floor(player.score);
        for (let i = 0; i < reward.motes; i++) {
          const mote = createMote();
          mote.x = clamp(bot.x + random(-65, 65), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          mote.y = clamp(bot.y + random(-65, 65), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          mote.type = i < 4 ? "gold" : i < 6 ? "red" : Math.random() > 0.4 ? "violet" : "cyan";
          appendIndexedMote(mote);
        }
        showToast(reward.toast, 2800);
      }
      window.setTimeout(() => finishSolo("victory"), 900);
    }
  }

/*__ECHO_SECTION_END:0060__*/
/*__ECHO_SECTION:0062__*/
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
      bot.telegraphType = null;
      bot.telegraphTimer = 0;
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

/*__ECHO_SECTION_END:0062__*/
/*__ECHO_SECTION:0083__*/
  function spawnSoloBoss(templateId = null) {
    if (activeMode !== "solo" || state !== "playing" || bossSpawned) return;
    bossSpawned = true;
    const boss = createBoss(templateId);
    const stageMultiplier = 1 + soloStage * 0.18;
    boss.health = Math.floor(boss.health * stageMultiplier);
    boss.maxHealth = boss.health;
    boss.attackDamage = Math.floor(boss.attackDamage * (1 + soloStage * 0.12));
    const angle = Math.random() * TAU;
    boss.x = clamp(player.x + Math.cos(angle) * 620, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    boss.y = clamp(player.y + Math.sin(angle) * 620, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(boss);
    activeBoss = boss;
    showToast(boss.bossTemplate.spawnDialogue, 3200);
    sound(62, 1.1, "sawtooth", 0.07);
  }

/*__ECHO_SECTION_END:0083__*/
