/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0122__*/
  function progressionFromScore(score) {
    const total = Math.max(0, Math.floor(Number(score || 0)));
    let level = 1;
    let experience = total;
    let required = experienceForLevel(level);
    while (level < LEVEL_CONFIG.maxLevel && experience >= required) {
      experience -= required;
      level += 1;
      required = experienceForLevel(level);
    }
    if (level >= LEVEL_CONFIG.maxLevel) experience = 0;
    return {
      level,
      experience,
      experienceToNext: required
    };
  }

  function applyMultiplayerLevelPresentation(entity, kind = "bot") {
    if (!entity) return entity;
    const progression = progressionFromScore(entity.score);
    const config = kind === "player" ? LEVEL_CONFIG.player : LEVEL_CONFIG.bot;
    if (!Number.isFinite(entity.multiplayerBaseRadius)) {
      entity.multiplayerBaseRadius = Math.max(1, Number(entity.radius || (kind === "player" ? 18 : 16)));
    }
    const steps = Math.max(0, progression.level - 1);
    entity.levelInitialized = true;
    entity.levelKind = kind;
    entity.level = progression.level;
    entity.experience = progression.experience;
    entity.experienceToNext = progression.experienceToNext;
    entity.levelScale = Math.min(config.maxRadiusScale, 1 + steps * config.radiusPerLevel);
    entity.levelSpeedScale = Math.max(config.minimumSpeedScale, 1 - steps * config.speedLossPerLevel);
    entity.radius = entity.multiplayerBaseRadius * entity.levelScale;
    entity.levelPulseTimer = Math.max(0, Number(entity.levelPulseTimer || 0));
    return entity;
  }

  function applyMultiplayerLevelsToSnapshot() {
    if (activeMode !== "multiplayer") return;
    applyMultiplayerLevelPresentation(player, "player");
    for (const entity of bots) applyMultiplayerLevelPresentation(entity, "bot");
    updateLevelHud();
    updateLeaderboard();
  }

  const applyMultiplayerSnapshotWithoutLevels = applyMultiplayerSnapshot;
  applyMultiplayerSnapshot = function applyMultiplayerSnapshotWithLevels(snapshot) {
    const result = applyMultiplayerSnapshotWithoutLevels(snapshot);
    applyMultiplayerLevelsToSnapshot();
    return result;
  };

  const updateMultiplayerWithoutLevelPresentation = updateMultiplayer;
  updateMultiplayer = function updateMultiplayerWithLevelPresentation(dt) {
    const result = updateMultiplayerWithoutLevelPresentation(dt);
    if (activeMode === "multiplayer" && multiplayerSnapshot) {
      applyMultiplayerLevelPresentation(player, "player");
      for (const entity of bots) applyMultiplayerLevelPresentation(entity, "bot");
      updateLevelHud();
    }
    return result;
  };

  window.EchoMultiplayerLevels = Object.freeze({
    progressionFromScore,
    applyMultiplayerLevelPresentation
  });

/*__ECHO_SECTION_END:0122__*/