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

