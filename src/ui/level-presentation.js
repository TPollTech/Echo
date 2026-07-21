/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0120__*/
  const drawEntityWithoutLevelPresentation = drawEntity;
  drawEntity = function drawEntityWithLevelPresentation(entity, isPlayer = false, spectral = false, time = 0) {
    const result = drawEntityWithoutLevelPresentation(entity, isPlayer, spectral, time);
    if (spectral || !entity?.levelInitialized || entity.boss || !visible(entity.x, entity.y, 80)) return result;
    const point = toScreen(entity.x, entity.y);
    const radius = (entity.radius || 16) * camera.zoom;
    const pulse = entity.levelPulseTimer > 0 ? 0.72 + Math.sin(time * 0.018) * 0.22 : 0.68;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `700 ${isPlayer ? 11 : 9}px Inter, sans-serif`;
    ctx.fillStyle = hsl(entity.hue, 92, 76, pulse);
    ctx.fillText(`LV ${entity.level}`, point.x, point.y + radius + (isPlayer ? 25 : 21));
    ctx.restore();
    return result;
  };

  updateLeaderboard = function updateLeaderboardWithLevels() {
    const visibleBots = activeMode === "multiplayer" ? bots : bots.filter((bot) => !bot.dead);
    const entries = visibleBots.map((bot) => ({
      name: bot.name,
      score: Math.floor(bot.score || 0),
      level: Number(bot.level || 1),
      player: false
    }));
    entries.push({
      name: player.name,
      score: Math.floor(player.score),
      level: Number(player.level || 1),
      player: true
    });
    entries.sort((a, b) => b.score - a.score || b.level - a.level);
    ui.leaderboard.replaceChildren();
    for (const [index, entry] of entries.slice(0, 6).entries()) {
      const item = document.createElement("li");
      if (entry.player) item.className = "is-player";
      item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(entry.name)} <small>LV ${entry.level}</small></strong><em>${entry.score}</em>`;
      ui.leaderboard.append(item);
    }
  };

  window.EchoRunProgression = Object.freeze({
    config: LEVEL_CONFIG,
    bossSizeScales: BOSS_SIZE_SCALES,
    experienceForLevel,
    experienceValueForMote,
    entityPower,
    averageCombatLevel
  });

  window.EchoSoundtrack = Object.freeze({
    library: SOUNDTRACK_LIBRARY,
    normalTrackIds: NORMAL_SOUNDTRACK_IDS,
    chooseNextSoundtrack,
    current() {
      const id = musicLayers.trackId || null;
      return id ? { id, ...soundtrackProfile(id) } : null;
    }
  });

/*__ECHO_SECTION_END:0120__*/