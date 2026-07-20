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

  function finishSolo(outcome = "defeat") {
    if (state === "gameover") return;
    endPhase(true);
    restorePlayerMutations();
    stopMusic();
    checkChallenges();
    state = "gameover";
    const victory = outcome === "victory";
    const bossBonus = bossDefeatedThisRun ? 10 : 0;
    pendingResonance = Math.floor(player.score / 10) + player.kills * 2 + bossBonus;
    if (runModifiers.length > 0) pendingResonance += runModifiers[0].bonusResonance;
    ui.gameoverKicker.innerHTML = `<span></span> ${victory ? "PROTOCOLO CONCLUÍDO" : "SINAL INTERROMPIDO"}`;
    ui.gameoverKicker.classList.toggle("danger", !victory);
    const modifierLabel = runModifiers.length > 0 ? ` [${runModifiers[0].name}]` : "";
    ui.gameoverTitle.textContent = victory ? "A COROA FOI ROMPIDA." : "VOCÊ DEIXOU UM ECO.";
    ui.gameoverCopy.textContent = `${victory ? "A arena reconheceu sua trajetória. Uma nova frequência foi registrada." : "Todo fim altera o campo. Toda volta encontra um mundo diferente."}${modifierLabel}`;
    ui.finalTimeLabel.textContent = "SOBREVIVÊNCIA";
    ui.restart.querySelector("span").textContent = "RESSOAR NOVAMENTE";
    ui.finalScore.textContent = Math.floor(player.score).toString();
    ui.finalKills.textContent = player.kills.toString();
    ui.finalTime.textContent = formatTime(runTime);
    if (ui.resonanceEarned) ui.resonanceEarned.textContent = `+${pendingResonance}`;
    ui.gameover.classList.remove("is-hidden");
    updateSkinProgress(player.score, bossDefeatedThisRun);
    sound(victory ? 392 : 132, 0.8, victory ? "triangle" : "sawtooth", 0.045);
    saveRun({ mode: "solo", outcome, bossDefeated: bossDefeatedThisRun });
  }

