  function resetWorld() {
    player = createPlayer();
    player.name = sanitizeName(ui.name.value);
    player.hitTimer = 1.2;
    bots = Array.from({ length: BOT_COUNT }, (_, index) => createBot(index));
    motes = Array.from({ length: moteCount }, (_, index) => createMote(index < 90));
    particles = [];
    ribbons = [];
    waves = [];
    scars = [];
    ambientSeeds = Array.from({ length: ambientSeedCount }, () => ({
      x: random(0, WORLD_SIZE),
      y: random(0, WORLD_SIZE),
      radius: random(0.5, 1.8),
      alpha: random(0.08, 0.34),
      hue: Math.random() > 0.5 ? 188 : 268
    }));
    camera.x = player.x;
    camera.y = player.y;
    runTime = 0;
    soloStage = 0;
    bossSpawned = false;
    bossDefeated = false;
    activeBoss = null;
    lastRunSaved = false;
    screenShake = 0;
    flash = 0;
    mutationPending = false;
    updateMutationSlots();
    updateLeaderboard();
    updateHud();
  }

