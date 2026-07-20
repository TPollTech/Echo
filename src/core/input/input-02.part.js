  ui.startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (selectedMode === "multiplayer") connectMultiplayer(ui.roomCode.value);
    else showSkinScreen();
  });

  ui.restart.addEventListener("click", () => {
    if (activeMode === "multiplayer") returnToMenu();
    else startSoloGame();
  });

  ui.soloMode.addEventListener("click", () => setSelectedMode("solo"));
