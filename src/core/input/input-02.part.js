  ui.startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (selectedMode === "multiplayer") connectMultiplayer(ui.roomCode.value);
    else showSkinScreen();
  });

