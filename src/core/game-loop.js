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
    updateBots(dt);
    updateSkills(dt);
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

/*__ECHO_SECTION_END:0086__*/
/*__ECHO_SECTION:0099__*/
  function frame(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.034);
    previousTime = now;
    update(dt);
    render(now);
    requestAnimationFrame(frame);
  }

/*__ECHO_SECTION_END:0099__*/
