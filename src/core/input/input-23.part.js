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

