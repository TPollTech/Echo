  function openPause() {
    if (state !== "playing") return;
    endPhase();
    stopMusic();
    pausedFromState = state;
    state = "paused";
    ui.pauseCopy.textContent = activeMode === "multiplayer"
      ? "A interface está pausada, mas a partida continua no servidor local."
      : "A simulação solo está congelada.";
    ui.pause.classList.remove("is-hidden");
    ui.resume.focus();
  }

  function closePause() {
    if (state !== "paused") return;
    state = pausedFromState || "playing";
    pausedFromState = null;
    if (activeMode === "solo") startMusic();
    ui.pause.classList.add("is-hidden");
    canvas.focus?.();
  }

