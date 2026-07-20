  function spawnBossClone(original) {
    const clone = createBot(19, {
      id: `boss-clone-${Math.random().toString(36).slice(2, 7)}`,
      name: "CLONE",
      archetype: original.archetype,
      roleLabel: "CLONE",
      boss: false,
      bossClone: true,
      radius: original.radius * 0.8,
      hue: original.hue + 30,
      health: Math.floor(original.maxHealth * 0.25),
      maxHealth: Math.floor(original.maxHealth * 0.25),
      energy: 100,
      score: 300,
      aggression: 1,
      speed: original.speed * 1.15,
      attackDamage: Math.floor(original.attackDamage * 0.7),
      cooldown: 1,
      respawnTimer: 0
    });
    const angle = Math.random() * TAU;
    clone.x = clamp(original.x + Math.cos(angle) * 120, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    clone.y = clamp(original.y + Math.sin(angle) * 120, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(clone);
    showToast("UM CLONE SE MATERIALIZA!", 1800);
    sound(220, 0.3, "triangle", 0.05);
  }

