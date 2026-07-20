  function connectMultiplayer(rawCode) {
    const code = sanitizeRoomCode(rawCode);
    if (code.length !== 6) {
      setStartStatus("Informe um código de sala com 6 caracteres.", true);
      return;
    }
    if (multiplayerSocket) multiplayerSocket.close();
    setStartStatus(`Conectando à sala ${code}...`);
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${location.host}/ws`);
    multiplayerSocket = socket;
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "join", roomCode: code, name: sanitizeName(ui.name.value) }));
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "error") {
        setStartStatus(message.message, true);
        socket.close();
        return;
      }
      if (message.type === "joined") {
        activeMode = "multiplayer";
        multiplayerRoomCode = message.roomCode;
        multiplayerPlayerId = message.playerId;
        resetWorld();
        bots = [];
        motes = [];
        state = "playing";
        document.body.classList.add("is-playing");
        ui.start.classList.add("is-hidden");
        ui.gameover.classList.add("is-hidden");
        pointer.x = width * 0.66;
        pointer.y = height * 0.5;
        showToast(`SALA ${message.roomCode} // SERVIDOR AUTORITATIVO`, 2400);
        initAudio();
      }
      if (message.type === "snapshot") applyMultiplayerSnapshot(message);
      if (message.type === "system" && state === "playing") showToast(message.message, 1300);
      if (message.type === "match_end") finishMultiplayer(message.standings);
    });
    socket.addEventListener("close", () => {
      if (multiplayerSocket !== socket) return;
      multiplayerSocket = null;
      if (activeMode === "multiplayer" && state === "playing") {
        returnToMenu("A conexão com a sala foi encerrada.", true);
      }
    });
    socket.addEventListener("error", () => setStartStatus("Não foi possível abrir o WebSocket local.", true));
  }

