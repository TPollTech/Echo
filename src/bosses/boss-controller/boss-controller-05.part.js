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
      respawnTimer: 0
    });
  }

