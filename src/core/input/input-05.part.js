  canvas.addEventListener("pointerup", releaseCanvasPointer);
  canvas.addEventListener("pointercancel", releaseCanvasPointer);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  ui.mobilePhase.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ui.mobilePhase.setPointerCapture?.(event.pointerId);
    beginPhase();
  });
  ui.mobilePhase.addEventListener("pointerup", (event) => { event.preventDefault(); endPhase(); });
  ui.mobilePhase.addEventListener("pointercancel", endPhase);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape") {
      event.preventDefault();
      if (state === "paused") closePause();
      else openPause();
      return;
    }
    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      beginPhase();
    }
    if (event.code === "KeyM") ui.sound.click();
    if (qaMode && activeMode === "solo" && event.code === "KeyU" && state === "playing") {
      player.score = Math.max(player.score, MUTATION_THRESHOLDS[player.nextMutationIndex] || player.score);
      checkMutation();
    }
    if (qaMode && activeMode === "solo" && event.code === "KeyB" && state === "playing") spawnSoloBoss();
    if (qaMode && activeMode === "solo" && event.code === "KeyV" && state === "playing") finishSolo("victory");
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      endPhase();
    }
  });

  window.addEventListener("blur", () => {
    if (state === "playing") endPhase();
  });
  window.addEventListener("resize", resize);
