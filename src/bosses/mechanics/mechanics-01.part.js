  function copyMimicMutations(bot, requestedCount) {
    const available = player.mutations
      .map((id) => mutations.find((mutation) => mutation.id === id))
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, requestedCount));
    const phase = bot.bossTemplate?.phases?.[bot.bossPhaseIndex] || {};
    const offensive = new Set(["blade", "overclock", "chain", "resonance"]);
    const mobile = new Set(["drift", "dualphase", "focus"]);
    const defensive = new Set(["shell", "prism", "ghostwall"]);
    const sustain = new Set(["siphon", "reweave", "resonance"]);
    bot.copiedMutationIds = available.map((mutation) => mutation.id);
    const offenseCount = bot.copiedMutationIds.filter((id) => offensive.has(id)).length;
    const mobileCount = bot.copiedMutationIds.filter((id) => mobile.has(id)).length;
    const defenseCount = bot.copiedMutationIds.filter((id) => defensive.has(id)).length;
    const sustainCount = bot.copiedMutationIds.filter((id) => sustain.has(id)).length;
    bot.attackDamage = Math.floor((phase.attackDamage || bot.attackDamage) * (1 + offenseCount * 0.18));
    bot.speed = (phase.speed || bot.baseSpeed || bot.speed) * (1 + mobileCount * 0.12);
    bot.baseSpeed = bot.speed;
    bot.copiedDefense = defenseCount > 0 ? Math.max(0.62, 1 - defenseCount * 0.12) : 1;
    bot.copiedRegen = sustainCount * 1.5;
    bot.hue = available.length ? (45 + available.reduce((sum, mutation) => sum + mutations.indexOf(mutation) * 23, 0)) % 360 : 45;
  }

  function spawnPrismaIllusions(source) {
    if (bots.some((bot) => bot.prismaIllusion && bot.illusionSourceId === source.id && !bot.dead)) return;
    for (let index = 0; index < 2; index += 1) {
      const illusion = createBot(bots.length + index, {
        id: `prisma-illusion-${Math.random().toString(36).slice(2, 7)}`,
        name: "REFRAÇÃO",
        archetype: "prisma",
        roleLabel: "ILUSÃO",
        boss: false,
        bossClone: true,
        prismaIllusion: true,
        illusionSourceId: source.id,
        illusionLife: 4,
        noRespawn: true,
        hue: source.hue + random(-18, 18),
        radius: 13,
        health: 1,
        maxHealth: 1,
        speed: source.speed * 1.12,
        baseSpeed: source.speed * 1.12,
        aggression: 0.35,
        attackDamage: 0,
        cooldown: 99
      });
      const angle = index * Math.PI + random(-0.4, 0.4);
      illusion.x = clamp(source.x + Math.cos(angle) * 70, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      illusion.y = clamp(source.y + Math.sin(angle) * 70, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bots.push(illusion);
    }
  }

  function spawnSilenceAnchor(source) {
    const existing = bots.find((bot) => bot.silenceAnchor && !bot.dead);
    if (existing) return existing;
    const anchor = createBot(bots.length, {
      id: `silence-anchor-${Math.random().toString(36).slice(2, 7)}`,
      name: "ÂNCORA DO VÁCUO",
      archetype: "silenciador",
      roleLabel: "ÂNCORA",
      boss: false,
      bossClone: true,
      silenceAnchor: true,
      noRespawn: true,
      hue: 285,
      radius: 20,
      health: 95,
      maxHealth: 95,
      speed: 42,
      baseSpeed: 42,
      aggression: 0.2,
      attackDamage: 6,
      cooldown: 4
    });
    const angle = Math.random() * TAU;
    anchor.x = clamp(source.x + Math.cos(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    anchor.y = clamp(source.y + Math.sin(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(anchor);
    source.silenceAnchorId = anchor.id;
    silencePlayer(Number.POSITIVE_INFINITY, true);
    showToast("ROMPA A ÂNCORA PARA RECUPERAR AS MUTAÇÕES", 2800);
    return anchor;
  }

