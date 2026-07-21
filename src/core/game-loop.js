/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0086__*/
  function update(dt) {
    if (state !== "playing") return;
    if (activeMode === "multiplayer") {
      updateMultiplayer(dt);
      return;
    }
    runTime += dt;
    runStats.runTime = runTime;
    updatePlayer(dt);
    updateBotProgression(dt);
    updateBots(dt);
    updateSkills(dt);
    updateSoloDirector();
    updateEffects(dt);
    updateCamera(dt);
    musicUpdateTimer -= dt;
    if (musicUpdateTimer <= 0) {
      musicUpdateTimer = 0.08;
      updateMusic();
    }
    hudUpdateTimer -= dt;
    if (hudUpdateTimer <= 0) {
      hudUpdateTimer = PERFORMANCE_PROFILE.hudInterval;
      updateHud();
      updateLevelHud();
    }
    leaderboardTimer -= dt;
    if (leaderboardTimer <= 0) {
      leaderboardTimer = 0.7;
      updateLeaderboard();
    }
  }

/*__ECHO_SECTION_END:0086__*/
/*__ECHO_SECTION:0099__*/
  function frame(now) {
    if (document.hidden) {
      previousTime = now;
      requestAnimationFrame(frame);
      return;
    }
    const elapsed = now - previousTime;
    const minimumFrameMs = state === "playing"
      ? PERFORMANCE_PROFILE.activeMinimumFrameMs
      : PERFORMANCE_PROFILE.idleMinimumFrameMs;
    if (elapsed < minimumFrameMs) {
      requestAnimationFrame(frame);
      return;
    }
    const workStartedAt = performance.now();
    const dt = Math.min(elapsed / 1000, 0.034);
    previousTime = now;
    update(dt);
    render(now);
    updateAdaptiveResolution(elapsed, performance.now() - workStartedAt, now);
    requestAnimationFrame(frame);
  }

/*__ECHO_SECTION_END:0099__*/
