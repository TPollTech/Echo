/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0017__*/
  let networkInputTimer = 0;
  let multiplayerRemaining = 0;
  let multiplayerRoomCode = "";
  let multiplayerPlayerId = "";
  let multiplayerSocket = null;
  let multiplayerSnapshot = null;
  let multiplayerHasInitialSnapshot = false;
  let multiplayerMoteRevision = 0;
  let networkInputSequence = 0;
  let networkPingTimer = 0;
  let networkPingMs = 0;
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
        ui.roomList.textContent = "Nenhuma sala ativa. Crie a primeira sala.";
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
      socket.send(JSON.stringify({ type: "join", roomCode: code, name: sanitizeName(ui.name.value), classId: selectedClassId, skinId: getSelectedSkin().id, skillIds: selectedSkillIds }));
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
        multiplayerHasInitialSnapshot = false;
        multiplayerMoteRevision = 0;
        networkInputSequence = 0;
        networkPingTimer = 0;
        networkPingMs = 0;
        resetWorld();
        bots = [];
        motes = [];
        state = "playing";
        document.body.classList.add("is-playing");
        if (ui.joystickZone) ui.joystickZone.classList.add("is-joy-active");
        ui.start.classList.add("is-hidden");
        ui.gameover.classList.add("is-hidden");
        pointer.x = width * 0.66;
        pointer.y = height * 0.5;
        showToast(`SALA ${message.roomCode} // SERVIDOR AUTORITATIVO`, 2400);
        initAudio();
      }
      if (message.type === "snapshot") applyMultiplayerSnapshot(message);
      if (message.type === "pong") {
        const roundTrip = performance.now() - Number(message.clientTime);
        if (Number.isFinite(roundTrip) && roundTrip >= 0 && roundTrip < 10_000) networkPingMs = networkPingMs ? lerp(networkPingMs, roundTrip, 0.25) : roundTrip;
      }
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

  function applyNetworkSkin(entity) {
    const skin = skins.find((entry) => entry.id === entity.skinId);
    if (!skin) return entity;
    entity.hue = skin.hue;
    entity.skinGlow = skin.glowIntensity;
    entity.skinTrail = skin.trailWidth;
    return entity;
  }

  function mergeNetworkEntity(current, incoming, isLocal = false) {
    const entity = current || { ...incoming, x: incoming.x, y: incoming.y };
    const currentPose = current ? { x: entity.x, y: entity.y, vx: entity.vx, vy: entity.vy } : null;
    entity.networkX = incoming.x;
    entity.networkY = incoming.y;
    entity.networkVx = incoming.vx;
    entity.networkVy = incoming.vy;
    Object.assign(entity, incoming);
    if (currentPose && isLocal) Object.assign(entity, currentPose);
    else if (currentPose) Object.assign(entity, { x: currentPose.x, y: currentPose.y, vx: currentPose.vx || incoming.vx, vy: currentPose.vy || incoming.vy });
    entity.dead = incoming.respawnTimer > 0;
    entity.hitTimer = 0;
    return applyNetworkSkin(entity);
  }

  function applyMoteSnapshot(snapshot) {
    if (Array.isArray(snapshot.motes)) {
      motes = snapshot.motes;
    } else if (Array.isArray(snapshot.moteChanges) && snapshot.moteChanges.length) {
      const moteById = new Map(motes.map((mote) => [mote.id, mote]));
      for (const change of snapshot.moteChanges) {
        moteById.delete(change.removeId);
        if (change.add?.id) moteById.set(change.add.id, change.add);
      }
      motes = [...moteById.values()];
    }
    multiplayerMoteRevision = Number(snapshot.moteRevision) || multiplayerMoteRevision;
  }

  function applyMultiplayerSnapshot(snapshot) {
    multiplayerSnapshot = snapshot;
    multiplayerRemaining = snapshot.remaining;
    runTime = snapshot.elapsed;
    const incomingPlayer = snapshot.players.find((entry) => entry.id === multiplayerPlayerId);
    if (incomingPlayer) {
      player = mergeNetworkEntity(player, incomingPlayer, multiplayerHasInitialSnapshot);
      if (!multiplayerHasInitialSnapshot) {
        player.x = incomingPlayer.x;
        player.y = incomingPlayer.y;
        player.vx = incomingPlayer.vx;
        player.vy = incomingPlayer.vy;
        multiplayerHasInitialSnapshot = true;
      }
    }
    const existingBots = new Map(bots.map((bot) => [bot.id, bot]));
    bots = snapshot.players
      .filter((entry) => entry.id !== multiplayerPlayerId)
      .map((entry) => mergeNetworkEntity(existingBots.get(entry.id), entry));
    applyMoteSnapshot(snapshot);
    ribbons = snapshot.ribbons.map((ribbon) => ({ ...ribbon, points: ribbon.points.map((point) => ({ ...point })) }));
    classProjectiles = (snapshot.projectiles || []).map((projectile) => ({ ...projectile, hitIds: new Set() }));
    classTraps = (snapshot.traps || []).map((trap) => ({ ...trap }));
    classFields = (snapshot.fields || []).map((field) => ({ ...field }));
    updateLeaderboard();
    updateHud();
  }

/*__ECHO_SECTION_END:0048__*/
/*__ECHO_SECTION:0050__*/
  function finishMultiplayer(standings = []) {
    if (activeMode !== "multiplayer" || state === "gameover") return;
    state = "gameover";
    if (ui.joystickZone) ui.joystickZone.classList.remove("is-joy-active");
    endPhase(true);
    const rank = Math.max(1, standings.findIndex((entry) => entry.id === multiplayerPlayerId) + 1);
    const self = standings.find((entry) => entry.id === multiplayerPlayerId) || player;
    ui.gameoverKicker.innerHTML = `<span></span> PARTIDA ENCERRADA // SALA ${multiplayerRoomCode}`;
    ui.gameoverKicker.classList.toggle("danger", rank !== 1);
    ui.gameoverTitle.textContent = rank === 1 ? "VOCÊ VENCEU!" : `${rank}º LUGAR.`;
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
    const target = worldTarget();
    if (player.respawnTimer <= 0 && !player.phasing) {
      steerVelocity(player, target.x, target.y, player.moveSpeed || 205, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    }
    const localError = Math.hypot((player.networkX || player.x) - player.x, (player.networkY || player.y) - player.y);
    const localBlend = localError > 180 ? 1 : 1 - Math.exp(-9 * dt);
    if (Number.isFinite(player.networkX)) player.x = lerp(player.x, player.networkX, localBlend);
    if (Number.isFinite(player.networkY)) player.y = lerp(player.y, player.networkY, localBlend);
    const remoteBlend = 1 - Math.exp(-22 * dt);
    for (const entity of bots) {
      if (Number.isFinite(entity.networkX)) entity.x = lerp(entity.x, entity.networkX, remoteBlend);
      if (Number.isFinite(entity.networkY)) entity.y = lerp(entity.y, entity.networkY, remoteBlend);
      if (Number.isFinite(entity.networkVx)) entity.vx = lerp(entity.vx || 0, entity.networkVx, remoteBlend);
      if (Number.isFinite(entity.networkVy)) entity.vy = lerp(entity.vy || 0, entity.networkVy, remoteBlend);
    }
    networkInputTimer -= dt;
    if (networkInputTimer <= 0 && multiplayerSocket?.readyState === WebSocket.OPEN) {
      networkInputTimer = 1 / 30;
      if (multiplayerSocket.bufferedAmount < 16_384) {
        networkInputSequence += 1;
        multiplayerSocket.send(JSON.stringify({ type: "input", sequence: networkInputSequence, targetX: target.x, targetY: target.y, moteRevision: multiplayerMoteRevision }));
      }
    }
    networkPingTimer -= dt;
    if (networkPingTimer <= 0 && multiplayerSocket?.readyState === WebSocket.OPEN) {
      networkPingTimer = 1;
      multiplayerSocket.send(JSON.stringify({ type: "ping", clientTime: performance.now() }));
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
