/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0017__*/
  let networkInputTimer = 0;
  let multiplayerRemaining = 0;
  let multiplayerRoomCode = "";
  let multiplayerPlayerId = "";
  let multiplayerSocket = null;
  let multiplayerSnapshot = null;
/*__ECHO_SECTION_END:0017__*/
/*__ECHO_SECTION:0045__*/
  async function requestJson(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Falha HTTP ${response.status}.`);
    return payload;
  }

/*__ECHO_SECTION_END:0045__*/
/*__ECHO_SECTION:0048__*/
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

/*__ECHO_SECTION_END:0048__*/
/*__ECHO_SECTION:0050__*/
  function finishMultiplayer(standings = []) {
    if (activeMode !== "multiplayer" || state === "gameover") return;
    state = "gameover";
    endPhase(true);
    const rank = Math.max(1, standings.findIndex((entry) => entry.id === multiplayerPlayerId) + 1);
    const self = standings.find((entry) => entry.id === multiplayerPlayerId) || player;
    ui.gameoverKicker.innerHTML = `<span></span> PARTIDA ENCERRADA // SALA ${multiplayerRoomCode}`;
    ui.gameoverKicker.classList.toggle("danger", rank !== 1);
    ui.gameoverTitle.textContent = rank === 1 ? "RESSONÂNCIA DOMINANTE." : `${rank}º LUGAR REGISTRADO.`;
    ui.gameoverCopy.textContent = "O resultado foi persistido no banco local do servidor.";
    ui.finalTimeLabel.textContent = "POSIÇÃO";
    ui.finalScore.textContent = Math.floor(self.score || 0).toString();
    ui.finalKills.textContent = String(self.kills || 0);
    ui.finalTime.textContent = `${rank}º`;
    ui.restart.querySelector("span").textContent = "VOLTAR AO MENU";
    ui.gameover.classList.remove("is-hidden");
  }

/*__ECHO_SECTION_END:0050__*/
/*__ECHO_SECTION:0085__*/
  function updateMultiplayer(dt) {
    if (!multiplayerSnapshot) return;
    runTime += dt;
    multiplayerRemaining = Math.max(0, multiplayerRemaining - dt);
    const blend = 1 - Math.exp(-16 * dt);
    for (const entity of [player, ...bots]) {
      if (Number.isFinite(entity.networkX)) entity.x = lerp(entity.x, entity.networkX, blend);
      if (Number.isFinite(entity.networkY)) entity.y = lerp(entity.y, entity.networkY, blend);
      if (Number.isFinite(entity.networkVx)) entity.vx = lerp(entity.vx || 0, entity.networkVx, blend);
      if (Number.isFinite(entity.networkVy)) entity.vy = lerp(entity.vy || 0, entity.networkVy, blend);
    }
    networkInputTimer -= dt;
    if (networkInputTimer <= 0 && multiplayerSocket?.readyState === WebSocket.OPEN) {
      networkInputTimer = 1 / 20;
      const target = worldTarget();
      multiplayerSocket.send(JSON.stringify({ type: "input", targetX: target.x, targetY: target.y }));
    }
    updateEffects(dt);
    updateCamera(dt);
    updateHud();
  }

/*__ECHO_SECTION_END:0085__*/
/*__ECHO_SECTION:0103__*/
  ui.multiplayerMode.addEventListener("click", () => setSelectedMode("multiplayer"));
  ui.createRoom.addEventListener("click", createRoom);
  ui.refreshRooms.addEventListener("click", refreshRooms);
  ui.roomCode.addEventListener("input", () => { ui.roomCode.value = sanitizeRoomCode(ui.roomCode.value); });
/*__ECHO_SECTION_END:0103__*/
/*__ECHO_SECTION:0109__*/
  window.addEventListener("beforeunload", () => multiplayerSocket?.close());

/*__ECHO_SECTION_END:0109__*/
