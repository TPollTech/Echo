  function returnToMenu(message = "", isError = false) {
    if (multiplayerSocket) {
      const socket = multiplayerSocket;
      multiplayerSocket = null;
      socket.close();
    }
    stopMusic();
    state = "intro";
    activeMode = selectedMode;
    pausedFromState = null;
    ui.pause.classList.add("is-hidden");
    ui.gameover.classList.add("is-hidden");
    ui.mutation.classList.add("is-hidden");
    ui.skin?.classList.add("is-hidden");
    document.getElementById("modifier-screen")?.classList.add("is-hidden");
    ui.start.classList.remove("is-hidden");
    document.body.classList.remove("is-playing");
    setStartStatus(message, isError);
    loadProfile();
    if (selectedMode === "multiplayer") refreshRooms();
  }

