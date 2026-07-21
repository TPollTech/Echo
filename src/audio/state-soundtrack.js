/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0121__*/
  const STATE_SOUNDTRACK_LIBRARY = Object.freeze({
    "menu-echo": Object.freeze({
      title: "MENU ECHO",
      context: "menu",
      tempo: 72,
      progressions: Object.freeze([
        Object.freeze({ chord: [48, 52, 55], bass: 36 }),
        Object.freeze({ chord: [46, 50, 53], bass: 34 }),
        Object.freeze({ chord: [43, 48, 50], bass: 31 }),
        Object.freeze({ chord: [45, 48, 52], bass: 33 })
      ]),
      melody: Object.freeze([67, null, null, 71, null, null, 69, null, 64, null, null, 67, null, null, null, null]),
      wave: "sine",
      brightness: 0.72,
      density: 0.28
    }),
    "victory-rise": Object.freeze({
      title: "VICTORY RISE",
      context: "victory",
      tempo: 98,
      progressions: Object.freeze([
        Object.freeze({ chord: [53, 57, 60], bass: 41 }),
        Object.freeze({ chord: [55, 59, 62], bass: 43 }),
        Object.freeze({ chord: [57, 60, 64], bass: 45 }),
        Object.freeze({ chord: [60, 64, 67], bass: 48 })
      ]),
      melody: Object.freeze([72, 76, 79, null, 76, 79, 84, null, 81, 79, 76, 79, 84, null, null, null]),
      wave: "triangle",
      brightness: 1.32,
      density: 0.66
    }),
    "defeat-fall": Object.freeze({
      title: "DEFEAT FALL",
      context: "defeat",
      tempo: 66,
      progressions: Object.freeze([
        Object.freeze({ chord: [45, 48, 52], bass: 33 }),
        Object.freeze({ chord: [43, 46, 50], bass: 31 }),
        Object.freeze({ chord: [41, 45, 48], bass: 29 }),
        Object.freeze({ chord: [38, 43, 45], bass: 26 })
      ]),
      melody: Object.freeze([64, null, 62, null, 60, null, 57, null, 55, null, 52, null, 50, null, null, null]),
      wave: "sine",
      brightness: 0.58,
      density: 0.32
    })
  });

  const soundtrackProfileWithoutStateTracks = soundtrackProfile;
  soundtrackProfile = function soundtrackProfileWithStateTracks(id) {
    return STATE_SOUNDTRACK_LIBRARY[id] || soundtrackProfileWithoutStateTracks(id);
  };

  let stateSoundtrackToken = 0;

  function activateStateSoundtrack(id, expectedState = null) {
    if (expectedState && state !== expectedState) return false;
    initAudio();
    if (!audioContext) return false;
    if (!musicActive) startMusic();
    if (!musicLayers.input) return false;
    const profile = soundtrackProfile(id);
    musicLayers.previousTrackId = musicLayers.trackId || null;
    musicLayers.trackId = id;
    musicLayers.pendingTrackId = null;
    musicLayers.trackStartedAt = runTime;
    musicLayers.rotateAt = Number.POSITIVE_INFINITY;
    musicLayers.step = 0;
    musicLayers.nextNoteTime = audioContext.currentTime + 0.06;
    musicLayers.tempo = profile.tempo;
    musicLayers.intensity = id === "victory-rise" ? 0.7 : id === "defeat-fall" ? 0.42 : 0.3;
    try {
      window.EchoCore?.events?.emit("audio:soundtrack-changed", {
        id,
        title: profile.title,
        previousId: musicLayers.previousTrackId,
        state: expectedState || state
      });
    } catch (_error) {}
    return true;
  }

  function scheduleStateSoundtrack(id, expectedState, delay = 420) {
    const token = ++stateSoundtrackToken;
    window.setTimeout(() => {
      if (token !== stateSoundtrackToken) return;
      activateStateSoundtrack(id, expectedState);
    }, delay);
  }

  const finishSoloWithoutStateSoundtrack = finishSolo;
  finishSolo = function finishSoloWithStateSoundtrack(outcome = "defeat") {
    const result = finishSoloWithoutStateSoundtrack(outcome);
    scheduleStateSoundtrack(outcome === "victory" ? "victory-rise" : "defeat-fall", "gameover");
    return result;
  };

  const finishMultiplayerWithoutStateSoundtrack = finishMultiplayer;
  finishMultiplayer = function finishMultiplayerWithStateSoundtrack(standings = []) {
    const rank = Math.max(1, standings.findIndex((entry) => entry.id === multiplayerPlayerId) + 1);
    const result = finishMultiplayerWithoutStateSoundtrack(standings);
    stopMusic();
    scheduleStateSoundtrack(rank === 1 ? "victory-rise" : "defeat-fall", "gameover");
    return result;
  };

  const returnToMenuWithoutStateSoundtrack = returnToMenu;
  returnToMenu = function returnToMenuWithStateSoundtrack(message = "", isError = false) {
    const result = returnToMenuWithoutStateSoundtrack(message, isError);
    scheduleStateSoundtrack("menu-echo", "intro");
    return result;
  };

  const startSoloGameWithoutStateSoundtrack = startSoloGame;
  startSoloGame = function startSoloGameWithoutMenuTrack() {
    stateSoundtrackToken += 1;
    if (musicActive) stopMusic();
    return startSoloGameWithoutStateSoundtrack();
  };

  const connectMultiplayerWithoutStateSoundtrack = connectMultiplayer;
  connectMultiplayer = function connectMultiplayerWithoutMenuTrack(roomCode = "") {
    stateSoundtrackToken += 1;
    if (musicActive) stopMusic();
    return connectMultiplayerWithoutStateSoundtrack(roomCode);
  };

  const applyMultiplayerSnapshotWithoutSoundtrack = applyMultiplayerSnapshot;
  applyMultiplayerSnapshot = function applyMultiplayerSnapshotWithSoundtrack(snapshot) {
    const result = applyMultiplayerSnapshotWithoutSoundtrack(snapshot);
    if (activeMode === "multiplayer" && state === "playing" && !musicActive) {
      initAudio();
      startMusic();
    }
    return result;
  };

  const updateMultiplayerWithoutSoundtrack = updateMultiplayer;
  updateMultiplayer = function updateMultiplayerWithSoundtrack(dt) {
    const result = updateMultiplayerWithoutSoundtrack(dt);
    if (activeMode === "multiplayer" && state === "playing") updateMusic();
    return result;
  };

  function enableInitialMenuSoundtrack() {
    if (state !== "intro" || musicActive) return;
    activateStateSoundtrack("menu-echo", "intro");
  }

  document.addEventListener("pointerdown", enableInitialMenuSoundtrack, { once: true, capture: true });
  document.addEventListener("keydown", enableInitialMenuSoundtrack, { once: true, capture: true });

  window.EchoSoundtrack = Object.freeze({
    library: Object.freeze({ ...SOUNDTRACK_LIBRARY, ...STATE_SOUNDTRACK_LIBRARY }),
    normalTrackIds: NORMAL_SOUNDTRACK_IDS,
    chooseNextSoundtrack,
    activateStateSoundtrack,
    current() {
      const id = musicLayers.trackId || null;
      return id ? { id, ...soundtrackProfile(id) } : null;
    }
  });

/*__ECHO_SECTION_END:0121__*/