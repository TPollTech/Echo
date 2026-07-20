/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0044__*/
  function setStartStatus(message = "", isError = false) {
    ui.startStatus.textContent = message;
    ui.startStatus.classList.toggle("is-error", isError);
  }

  function setSelectedMode(mode) {
    selectedMode = mode === "multiplayer" ? "multiplayer" : "solo";
    const multiplayer = selectedMode === "multiplayer";
    ui.soloMode.classList.toggle("is-selected", !multiplayer);
    ui.multiplayerMode.classList.toggle("is-selected", multiplayer);
    ui.soloMode.setAttribute("aria-pressed", String(!multiplayer));
    ui.multiplayerMode.setAttribute("aria-pressed", String(multiplayer));
    ui.multiplayerFields.classList.toggle("is-hidden", !multiplayer);
    ui.start.classList.toggle("is-multiplayer", multiplayer);
    ui.startSubmit.querySelector("span").textContent = multiplayer ? "ENTRAR NA SALA" : "INICIAR RUN SOLO";
    setStartStatus();
    if (multiplayer) refreshRooms();
  }

/*__ECHO_SECTION_END:0044__*/
/*__ECHO_SECTION:0047__*/
  function openWorkshop() {
    updateWorkshopUI();
    ui.workshop.classList.remove("is-hidden");
    sound(262, 0.3, "sine", 0.03);
  }

  function closeWorkshop() {
    ui.workshop.classList.add("is-hidden");
    loadProfile();
  }

/*__ECHO_SECTION_END:0047__*/
/*__ECHO_SECTION:0052__*/
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

/*__ECHO_SECTION_END:0052__*/
/*__ECHO_SECTION:0101__*/
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

/*__ECHO_SECTION_END:0101__*/
