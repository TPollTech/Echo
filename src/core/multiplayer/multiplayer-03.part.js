  async function refreshRooms() {
    if (selectedMode !== "multiplayer") return;
    ui.roomList.replaceChildren();
    try {
      const payload = await requestJson("/api/rooms");
      if (!payload.rooms.length) {
        ui.roomList.textContent = "Nenhuma sala ativa. Crie a primeira ressonância.";
        return;
      }
      for (const room of payload.rooms) {
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `<strong>${room.code}</strong><span>${room.players}/${room.maxPlayers} SINAIS</span><span>${formatTime(room.remaining)}</span>`;
        button.addEventListener("click", () => {
          ui.roomCode.value = room.code;
          setStartStatus(`Sala ${room.code} selecionada.`);
        });
        ui.roomList.append(button);
      }
    } catch (error) {
      setStartStatus(`Servidor local indisponível: ${error.message}`, true);
    }
  }

  async function createRoom() {
    setStartStatus("Criando sala local...");
    try {
      const payload = await requestJson("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value) })
      });
      ui.roomCode.value = payload.room.code;
      connectMultiplayer(payload.room.code);
    } catch (error) {
      setStartStatus(error.message, true);
    }
  }

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

  function mergeNetworkEntity(current, incoming) {
    const entity = current || { ...incoming, x: incoming.x, y: incoming.y };
    entity.networkX = incoming.x;
    entity.networkY = incoming.y;
    entity.networkVx = incoming.vx;
    entity.networkVy = incoming.vy;
    Object.assign(entity, incoming, { x: entity.x, y: entity.y, vx: entity.vx || incoming.vx, vy: entity.vy || incoming.vy });
    entity.dead = incoming.respawnTimer > 0;
    entity.hitTimer = 0;
    return entity;
  }

  function applyMultiplayerSnapshot(snapshot) {
    multiplayerSnapshot = snapshot;
    multiplayerRemaining = snapshot.remaining;
    runTime = snapshot.elapsed;
    const incomingPlayer = snapshot.players.find((entry) => entry.id === multiplayerPlayerId);
    if (incomingPlayer) player = mergeNetworkEntity(player.id === incomingPlayer.id ? player : null, incomingPlayer);
    const existingBots = new Map(bots.map((bot) => [bot.id, bot]));
    bots = snapshot.players
      .filter((entry) => entry.id !== multiplayerPlayerId)
      .map((entry) => mergeNetworkEntity(existingBots.get(entry.id), entry));
    motes = snapshot.motes;
    ribbons = snapshot.ribbons.map((ribbon) => ({ ...ribbon, points: ribbon.points.map((point) => ({ ...point })) }));
    updateLeaderboard();
    updateHud();
  }

