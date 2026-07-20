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

