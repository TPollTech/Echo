  function startSoloGame() {
    if (multiplayerSocket) {
      multiplayerSocket.close();
      multiplayerSocket = null;
    }
    activeMode = "solo";
    bossDefeatedThisRun = false;
    loadUpgrades().then(() => {
      resetWorld();
      applyModifiers();
      captureMutationBaseline(player);
      initAudio();
      startMusic();
      runStats = { kills: 0, score: 0, maxCombo: 0, bossDefeated: 0, bossSpeedKill: 0, runTime: 0, redMotes: 0, noHitBoss: 0 };
      state = "playing";
      document.body.classList.add("is-playing");
      ui.start.classList.add("is-hidden");
      ui.gameover.classList.add("is-hidden");
      pointer.x = width * 0.66;
      pointer.y = height * 0.5;
      showToast("SINAL ESTABILIZADO — SEGURE ESPAÇO PARA PROJETAR", 2600);
      sound(146, 0.6, "sine", 0.055);
      setTimeout(() => sound(293, 0.4, "sine", 0.035), 110);
    });
  }

