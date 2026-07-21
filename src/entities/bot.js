/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0031__*/
  function createBot(index, options = {}) {
    const archetype = botArchetypes[index % botArchetypes.length];
    const angle = Math.random() * TAU;
    const distance = random(620, 1450);
    const faction = Math.floor(Math.random() * 3);
    const factionHueBase = [15, 200, 280];
    const baseSpeed = archetype.speed * random(0.94, 1.06);
    const baseRadius = archetype.id === "warden" ? 21 : archetype.id === "bulwark" ? 24 : random(14, 19);
    const entity = {
      id: `bot-${index}-${Math.random().toString(36).slice(2, 7)}`,
      name: names[index % names.length],
      archetype: archetype.id,
      roleLabel: archetype.label,
      boss: false,
      faction,
      factionTarget: null,
      currentIntent: "roam",
      x: clamp(WORLD_SIZE / 2 + Math.cos(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      y: clamp(WORLD_SIZE / 2 + Math.sin(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      vx: 0,
      vy: 0,
      radius: baseRadius,
      hue: factionHueBase[faction] + archetype.hueShift + random(-8, 8),
      health: archetype.health,
      maxHealth: archetype.health,
      energy: 100,
      score: Math.floor(random(25, 155)),
      phasing: false,
      phase: null,
      cooldown: random(3.5, 7.5),
      thinkTimer: 0,
      targetX: WORLD_SIZE / 2,
      targetY: WORLD_SIZE / 2,
      aggression: clamp(archetype.aggression + random(-0.08, 0.08), 0.1, 1),
      speed: baseSpeed,
      attackDamage: archetype.attackDamage,
      baseAttackDamage: archetype.attackDamage,
      energyDrain: archetype.energyDrain || 0,
      fastPhase: Boolean(archetype.fastPhase),
      longRange: Boolean(archetype.longRange),
      swarmer: Boolean(archetype.swarmer),
      heavyHit: Boolean(archetype.heavyHit),
      sniper: Boolean(archetype.sniper),
      idealRange: archetype.idealRange || 0,
      sniperAimTimer: 0,
      sniperAimDuration: 0,
      sniperAimX: 0,
      sniperAimY: 0,
      sniperTarget: null,
      sniperWarned: false,
      hitTimer: 0,
      dead: false,
      respawnTimer: 0,
      stealthTimer: 0,
      stealthed: false,
      baseSpeed,
      ...options
    };
    return initializeRunProgression(entity, {
      enabled: !entity.boss,
      level: entity.level || 1,
      baseRadius: entity.radius,
      baseMaxHealth: entity.maxHealth,
      baseDamage: entity.attackDamage,
      baseSpeed: entity.baseSpeed || entity.speed
    });
  }

/*__ECHO_SECTION_END:0031__*/
/*__ECHO_SECTION:0064__*/
  function respawnBot(bot) {
    if (bot.boss) return;
    const fresh = createBot(Math.floor(Math.random() * names.length));
    Object.assign(bot, fresh, { id: bot.id });
  }

/*__ECHO_SECTION_END:0064__*/
/*__ECHO_SECTION:0076__*/
  function collectBotMotes(bot) {
    for (let index = motes.length - 1; index >= 0; index -= 1) {
      const mote = motes[index];
      const range = bot.radius + mote.radius + 3 + Math.max(0, (bot.rangeScale || 1) - 1) * 8;
      if (distanceSq(bot.x, bot.y, mote.x, mote.y) < range * range) {
        bot.score += mote.type === "gold" ? 5 : mote.type === "violet" ? 2 : 1;
        bot.energy = Math.min(100, bot.energy + (mote.type === "violet" ? 5 : 2));
        const levelResult = grantRunExperience(bot, moteRunExperience(mote.type));
        motes.splice(index, 1);
        motes.push(createMote());
        notifyRunLevelGain(bot, levelResult);
        break;
      }
    }
  }

/*__ECHO_SECTION_END:0076__*/
