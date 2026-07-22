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
  let multiplayerReconnectAttempts = 0;
  const MULTIPLAYER_MAX_RECONNECT = 5;
  const PROTOCOL_VERSION = 1;
/*__ECHO_SECTION_END:0017__*/
/*__ECHO_SECTION:0045__*/
  async function requestJson(path, options = {}) {
    const baseUrl = window.ECHO_API_URL || "";
    const response = await fetch(baseUrl + path, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Falha HTTP ${response.status}.`);
    return payload;
  }

  function getWsUrl() {
    if (window.ECHO_WS_URL) return window.ECHO_WS_URL;
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    if (location.port === "4174" || location.port === "3000") return `${proto}//${location.host}/server/ws`;
    return `${proto}//${location.hostname}/server/ws`;
  }

  function saveReconnectInfo(matchId, playerId) {
    try {
      localStorage.setItem("echo_reconnect", JSON.stringify({ matchId, playerId, ts: Date.now() }));
    } catch {}
  }

  function loadReconnectInfo() {
    try {
      const raw = localStorage.getItem("echo_reconnect");
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.ts > 120000) { localStorage.removeItem("echo_reconnect"); return null; }
      return data;
    } catch { return null; }
  }

  function clearReconnectInfo() {
    try { localStorage.removeItem("echo_reconnect"); } catch {}
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
      setStartStatus(`Servidor indisponível: ${error.message}`, true);
    }
  }

  async function createRoom() {
    setStartStatus("Criando sala...");
    try {
      const payload = await requestJson("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value) })
      });
      ui.roomCode.value = payload.room.code;
      const inviteBox = document.getElementById("invite-link-box");
      const inviteInput = document.getElementById("invite-link");
      if (inviteBox && inviteInput) {
        const baseUrl = window.ECHO_PUBLIC_URL || location.origin;
        inviteInput.value = `${baseUrl}/?room=${payload.room.code}`;
        inviteBox.classList.remove("is-hidden");
      }
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
    const wsUrl = getWsUrl();
    const socket = new WebSocket(wsUrl);
    multiplayerSocket = socket;
    socket.addEventListener("open", () => {
      multiplayerReconnectAttempts = 0;
      socket.send(JSON.stringify({ type: "join", roomCode: code, name: sanitizeName(ui.name.value), classId: selectedClassId, skinId: getSelectedSkin().id, skillIds: selectedSkillIds }));
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "error") {
        setStartStatus(message.message, true);
        if (message.message.includes("não encontrada")) socket.close();
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
        saveReconnectInfo(message.roomCode, message.playerId);
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
      if (message.type === "reconnect_ok") {
        activeMode = "multiplayer";
        multiplayerRoomCode = message.roomCode;
        multiplayerPlayerId = message.playerId;
        multiplayerHasInitialSnapshot = false;
        multiplayerMoteRevision = 0;
        networkInputSequence = 0;
        clearReconnectInfo();
        showToast(`RECONECTADO À SALA ${message.roomCode}`, 2000);
      }
      if (message.type === "snapshot") applyMultiplayerSnapshot(message);
      if (message.type === "pong") {
        const roundTrip = performance.now() - Number(message.clientTime);
        if (Number.isFinite(roundTrip) && roundTrip >= 0 && roundTrip < 10_000) networkPingMs = networkPingMs ? lerp(networkPingMs, roundTrip, 0.25) : roundTrip;
      }
      if (message.type === "system" && state === "playing") showToast(message.message, 1300);
      if (message.type === "match_end") {
        clearReconnectInfo();
        finishMultiplayer(message.standings);
      }
    });
    socket.addEventListener("close", () => {
      if (multiplayerSocket !== socket) return;
      multiplayerSocket = null;
      if (activeMode === "multiplayer" && state === "playing") {
        attemptReconnect();
      }
    });
    socket.addEventListener("error", () => setStartStatus("Não foi possível conectar ao servidor.", true));
  }

  function attemptReconnect() {
    const reconnectInfo = loadReconnectInfo();
    if (!reconnectInfo || multiplayerReconnectAttempts >= MULTIPLAYER_MAX_RECONNECT) {
      clearReconnectInfo();
      returnToMenu("A conexão com a sala foi encerrada.", true);
      return;
    }
    multiplayerReconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, multiplayerReconnectAttempts - 1), 10000);
    showToast(`Reconectando em ${Math.round(delay / 1000)}s...`, delay);
    setTimeout(() => {
      if (multiplayerSocket || activeMode !== "multiplayer") return;
      setStartStatus(`Tentativa ${multiplayerReconnectAttempts}/${MULTIPLAYER_MAX_RECONNECT}...`);
      const wsUrl = getWsUrl();
      const socket = new WebSocket(wsUrl);
      multiplayerSocket = socket;
      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ type: "reconnect", matchId: reconnectInfo.matchId, playerId: reconnectInfo.playerId }));
      });
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "reconnect_ok") {
          multiplayerReconnectAttempts = 0;
          activeMode = "multiplayer";
          multiplayerRoomCode = message.roomCode;
          multiplayerPlayerId = message.playerId;
          multiplayerHasInitialSnapshot = false;
          showToast(`RECONECTADO À SALA ${message.roomCode}`, 2000);
        }
        if (message.type === "error") {
          setStartStatus(message.message, true);
          socket.close();
        }
        if (message.type === "snapshot") applyMultiplayerSnapshot(message);
        if (message.type === "match_end") {
          clearReconnectInfo();
          finishMultiplayer(message.standings);
        }
      });
      socket.addEventListener("close", () => {
        if (multiplayerSocket !== socket) return;
        multiplayerSocket = null;
        if (activeMode === "multiplayer" && state === "playing") attemptReconnect();
      });
      socket.addEventListener("error", () => {
        if (activeMode === "multiplayer" && state === "playing") attemptReconnect();
      });
    }, delay);
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

  const quickJoinButton = document.getElementById("quick-join-button");
  if (quickJoinButton) {
    quickJoinButton.addEventListener("click", async () => {
      setStartStatus("Procurando sala...");
      try {
        const payload = await requestJson("/api/rooms");
        const available = payload.rooms.find((r) => r.players < r.maxPlayers);
        if (available) {
          ui.roomCode.value = available.code;
          connectMultiplayer(available.code);
        } else {
          const createPayload = await requestJson("/api/rooms", {
            method: "POST",
            body: JSON.stringify({ name: sanitizeName(ui.name.value) })
          });
          ui.roomCode.value = createPayload.room.code;
          connectMultiplayer(createPayload.room.code);
        }
      } catch (error) {
        setStartStatus(error.message, true);
      }
    });
  }

  const copyInviteButton = document.getElementById("copy-invite-button");
  const inviteLinkInput = document.getElementById("invite-link");
  if (copyInviteButton && inviteLinkInput) {
    copyInviteButton.addEventListener("click", () => {
      inviteLinkInput.select();
      navigator.clipboard?.writeText(inviteLinkInput.value).then(() => {
        showToast("Link copiado!", 1500);
      }).catch(() => {});
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const roomFromUrl = urlParams.get("room");
  if (roomFromUrl && /^[A-Z0-9]{6}$/.test(roomFromUrl)) {
    setSelectedMode("multiplayer");
    ui.roomCode.value = roomFromUrl;
    setTimeout(() => connectMultiplayer(roomFromUrl), 500);
  }

  const reconnectInfo = loadReconnectInfo();
  if (reconnectInfo && reconnectInfo.matchId) {
    setSelectedMode("multiplayer");
    ui.roomCode.value = reconnectInfo.matchId;
  }

/*__ECHO_SECTION_END:0103__*/
/*__ECHO_SECTION:0109__*/
  window.addEventListener("beforeunload", () => multiplayerSocket?.close());

/*__ECHO_SECTION_END:0109__*/
