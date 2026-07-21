/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0086__*/
  function update(dt) {
    if (state !== "playing") return;
    if (activeMode === "multiplayer") {
      classSpecialCooldown = Math.max(0, classSpecialCooldown - dt);
      updateMultiplayer(dt);
      return;
    }
    runTime += dt;
    runStats.runTime = runTime;
    updatePlayer(dt);
    updateClassCombat(dt);
    updateBotProgression(dt);
    updateBots(dt);
    updateSkills(dt);
    if (activeMode !== "training") updateSoloDirector();
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
    const profileMinimum = state === "playing"
      ? PERFORMANCE_PROFILE.activeMinimumFrameMs
      : PERFORMANCE_PROFILE.idleMinimumFrameMs;
    const fpsLimit = clamp(Number(preparation?.settings?.fps || 60), 30, 120);
    const minimumFrameMs = Math.max(profileMinimum, 1000 / fpsLimit - 0.35);
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
