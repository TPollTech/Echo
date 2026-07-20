  ui.restart.addEventListener("click", () => {
    if (activeMode === "multiplayer") returnToMenu();
    else startSoloGame();
  });

