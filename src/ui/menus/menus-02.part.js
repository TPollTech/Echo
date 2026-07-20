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

