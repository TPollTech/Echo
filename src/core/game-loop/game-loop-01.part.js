  function update(dt) {
    if (state !== "playing") return;
    if (activeMode === "multiplayer") {
      updateMultiplayer(dt);
      return;
    }
    runTime += dt;
    runStats.runTime = runTime;
    updatePlayer(dt);
    updateBots(dt);
    updateSoloDirector();
    updateEffects(dt);
    updateCamera(dt);
    updateMusic();
    updateHud();
    leaderboardTimer -= dt;
    if (leaderboardTimer <= 0) {
      leaderboardTimer = 0.7;
      updateLeaderboard();
    }
  }

