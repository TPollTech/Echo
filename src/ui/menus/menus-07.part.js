  function closePause() {
    if (state !== "paused") return;
    state = pausedFromState || "playing";
    pausedFromState = null;
    if (activeMode === "solo") startMusic();
    ui.pause.classList.add("is-hidden");
    canvas.focus?.();
  }

