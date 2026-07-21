/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0031__*/
  function createBot(index, options = {}) {
    const archetype = botArchetypes[index % botArchetypes.length];
    const angle = Math.random() * TAU;
    const distance = random(620, 1450);
    const faction = Math.floor(Math.random() * 3);
    const factionHueBase = [15, 200, 280];
    const baseSpeed = archetype.speed * random(0.94, 1.06);
    const bot = {
      id: `bot-${index}-${Math.random().toString(36).slice(2, 7)}`,
      name: names[index % names.length],
      archetype: archetype.id,
      roleLabel: archetype.label,
      boss: false,
      faction,
      factionTarget: null,
      x: clamp(WORLD_SIZE / 2 + Math.cos(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      y: clamp(WORLD_SIZE / 2 + Math.sin(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      vx: 0,
      vy: 0,
      radius: archetype.id === "warden" ? 21 : archetype.id === "bulwark" ? 24 : random(14, 19),
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
    return applyDifficultyToBot(initializeBotClass(bot, options.classId || "cutter"));
  }

/*__ECHO_SECTION_END:0031__*/
/*__ECHO_SECTION:0064__*/
  function respawnBot(bot) {
    if (bot.boss) return;
    const fresh = createBot(Math.floor(Math.random() * names.length), { classId: bot.classId });
    Object.assign(bot, fresh, { id: bot.id });
  }

/*__ECHO_SECTION_END:0064__*/
/*__ECHO_SECTION:0076__*/
  function collectBotMotes(bot) {
    const nearbyMotes = queryMotes(bot.x, bot.y, bot.radius + 8);
    for (const mote of nearbyMotes) {
      const range = bot.radius + mote.radius + 3;
      if (distanceSq(bot.x, bot.y, mote.x, mote.y) < range * range) {
        const scoreValue = mote.type === "gold" ? 5 : mote.type === "red" ? 4 : mote.type === "violet" ? 2 : 1;
        bot.score += scoreValue;
        bot.energy = Math.min(100, bot.energy + (mote.type === "violet" ? 7 : 2));
        if (mote.type === "violet") {
          bot.rareBoostTimer = LEVEL_CONFIG.rareBoostDuration;
          bot.rareBoostMultiplier = LEVEL_CONFIG.rareBoostMultiplier;
        }
        gainExperience(bot, experienceValueForMote(mote.type), `mote:${mote.type}`);
        replaceCollectedMote(mote);
        break;
      }
    }
  }

/*__ECHO_SECTION_END:0076__*/
