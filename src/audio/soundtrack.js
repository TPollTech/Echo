/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0119__*/
  const SOUNDTRACK_LIBRARY = Object.freeze({
    "signal-drift": Object.freeze({
      title: "SIGNAL DRIFT",
      context: "normal",
      tempo: 84,
      progressions: Object.freeze([
        Object.freeze({ chord: [50, 53, 57], bass: 38 }),
        Object.freeze({ chord: [46, 50, 53], bass: 34 }),
        Object.freeze({ chord: [53, 57, 60], bass: 41 }),
        Object.freeze({ chord: [48, 52, 55], bass: 36 })
      ]),
      melody: Object.freeze([69, null, 72, null, 74, null, 72, null, 67, null, 69, null, 65, null, null, null]),
      wave: "sine",
      brightness: 1,
      density: 0.48
    }),
    "glass-current": Object.freeze({
      title: "GLASS CURRENT",
      context: "normal",
      tempo: 92,
      progressions: Object.freeze([
        Object.freeze({ chord: [52, 55, 59], bass: 40 }),
        Object.freeze({ chord: [48, 52, 55], bass: 36 }),
        Object.freeze({ chord: [55, 59, 62], bass: 43 }),
        Object.freeze({ chord: [50, 54, 57], bass: 38 })
      ]),
      melody: Object.freeze([71, null, 74, 76, null, 74, 71, null, 67, null, 69, 71, null, 67, null, null]),
      wave: "triangle",
      brightness: 1.18,
      density: 0.58
    }),
    "violet-engine": Object.freeze({
      title: "VIOLET ENGINE",
      context: "normal",
      tempo: 98,
      progressions: Object.freeze([
        Object.freeze({ chord: [45, 50, 52], bass: 33 }),
        Object.freeze({ chord: [48, 52, 57], bass: 36 }),
        Object.freeze({ chord: [43, 47, 50], bass: 31 }),
        Object.freeze({ chord: [50, 53, 57], bass: 38 })
      ]),
      melody: Object.freeze([64, 67, null, 69, 72, null, 69, null, 62, 64, null, 67, 69, null, null, null]),
      wave: "triangle",
      brightness: 0.9,
      density: 0.7
    }),
    "fracture-run": Object.freeze({
      title: "FRACTURE RUN",
      context: "danger",
      tempo: 112,
      progressions: Object.freeze([
        Object.freeze({ chord: [43, 46, 50], bass: 31 }),
        Object.freeze({ chord: [41, 45, 48], bass: 29 }),
        Object.freeze({ chord: [46, 50, 53], bass: 34 }),
        Object.freeze({ chord: [39, 43, 46], bass: 27 })
      ]),
      melody: Object.freeze([67, 70, 72, null, 67, 65, 63, null, 70, 72, 75, null, 72, 70, null, null]),
      wave: "sawtooth",
      brightness: 1.3,
      density: 0.88
    }),
    crownfall: Object.freeze({
      title: "CROWNFALL",
      context: "boss",
      tempo: 106,
      progressions: Object.freeze([
        Object.freeze({ chord: [42, 46, 49], bass: 30 }),
        Object.freeze({ chord: [39, 42, 46], bass: 27 }),
        Object.freeze({ chord: [44, 47, 51], bass: 32 }),
        Object.freeze({ chord: [37, 42, 44], bass: 25 })
      ]),
      melody: Object.freeze([66, null, 70, 73, 70, null, 66, 63, 61, null, 66, 68, 70, null, null, null]),
      wave: "square",
      brightness: 0.78,
      density: 0.82
    }),
    "deep-quake": Object.freeze({
      title: "DEEP QUAKE",
      context: "boss",
      tempo: 94,
      progressions: Object.freeze([
        Object.freeze({ chord: [38, 43, 45], bass: 26 }),
        Object.freeze({ chord: [36, 41, 43], bass: 24 }),
        Object.freeze({ chord: [41, 45, 48], bass: 29 }),
        Object.freeze({ chord: [34, 38, 41], bass: 22 })
      ]),
      melody: Object.freeze([57, null, 60, null, 62, 60, 57, null, 55, null, 57, 53, null, null, null, null]),
      wave: "sawtooth",
      brightness: 0.62,
      density: 0.74
    }),
    "terminal-light": Object.freeze({
      title: "TERMINAL LIGHT",
      context: "boss-final",
      tempo: 122,
      progressions: Object.freeze([
        Object.freeze({ chord: [47, 50, 54], bass: 35 }),
        Object.freeze({ chord: [45, 49, 52], bass: 33 }),
        Object.freeze({ chord: [50, 54, 57], bass: 38 }),
        Object.freeze({ chord: [43, 47, 50], bass: 31 })
      ]),
      melody: Object.freeze([71, 74, 78, 76, 74, 71, 69, 71, 76, 78, 81, 78, 76, 74, 71, null]),
      wave: "triangle",
      brightness: 1.35,
      density: 1
    })
  });

  const NORMAL_SOUNDTRACK_IDS = Object.freeze(["signal-drift", "glass-current", "violet-engine"]);

  function soundtrackProfile(id) {
    return SOUNDTRACK_LIBRARY[id] || SOUNDTRACK_LIBRARY["signal-drift"];
  }

  function chooseNextSoundtrack(ids, currentId, randomValue = Math.random()) {
    const options = ids.filter((id) => id !== currentId);
    const pool = options.length > 0 ? options : ids;
    return pool[Math.min(pool.length - 1, Math.floor(clamp(randomValue, 0, 0.999999) * pool.length))];
  }

  function bossSoundtrackId(boss) {
    if (!boss) return null;
    if (boss.bossPhaseIndex >= Math.max(1, (boss.bossTemplate?.phases?.length || 2) - 1)) return "terminal-light";
    if (boss.archetype === "tremor-deep") return "deep-quake";
    if (boss.archetype === "coroa-vazia") return "crownfall";
    return "terminal-light";
  }

  function requestSoundtrack(id) {
    if (!musicActive || !musicLayers.input || !SOUNDTRACK_LIBRARY[id]) return false;
    if (musicLayers.trackId === id || musicLayers.pendingTrackId === id) return false;
    musicLayers.pendingTrackId = id;
    return true;
  }

  function activatePendingSoundtrack() {
    if (!musicLayers.pendingTrackId) return;
    musicLayers.previousTrackId = musicLayers.trackId || null;
    musicLayers.trackId = musicLayers.pendingTrackId;
    musicLayers.pendingTrackId = null;
    musicLayers.trackStartedAt = runTime;
    try {
      window.EchoCore?.events?.emit("audio:soundtrack-changed", {
        id: musicLayers.trackId,
        title: soundtrackProfile(musicLayers.trackId).title,
        previousId: musicLayers.previousTrackId
      });
    } catch (_error) {}
  }

  function scheduleSoundtrackStep(start, step) {
    if (!musicActive || !musicLayers.input) return;
    if (step % 64 === 0) activatePendingSoundtrack();
    const track = soundtrackProfile(musicLayers.trackId);
    const intensity = musicLayers.intensity || 0.3;
    const barIndex = Math.floor(step / 16) % track.progressions.length;
    const localStep = step % 16;
    const progression = track.progressions[barIndex];
    const density = track.density;

    if (localStep === 0) schedulePadChord(progression.chord, start, intensity * track.brightness);

    if (localStep % 4 === 0) {
      scheduleMusicKick(start, (localStep === 0 ? 1.08 : 0.84) * (0.82 + density * 0.25));
      const bassNote = localStep === 8 ? progression.bass + (track.context === "boss" ? 5 : 7) : progression.bass;
      scheduleMusicTone({
        note: bassNote,
        start,
        duration: musicLayers.trackId === "deep-quake" ? 0.3 : 0.22,
        type: track.context.startsWith("boss") ? "sawtooth" : "triangle",
        volume: 0.036 + intensity * 0.018,
        attack: 0.008,
        release: 0.24,
        cutoff: (650 + intensity * 520) * track.brightness
      });
    }

    if (localStep === 4 || localStep === 12 || (density > 0.9 && localStep === 8)) {
      scheduleMusicSnare(start, 0.72 + density * 0.45);
    }

    if (intensity > 0.36 && localStep % (density > 0.76 ? 2 : 4) === 0) {
      scheduleMusicNoise(start, 0.045, 0.004 + intensity * 0.004 * density, 5000 * track.brightness, "highpass");
    }

    if (localStep % 2 === 0) {
      const arpeggioIndex = (localStep / 2 + barIndex) % progression.chord.length;
      const arpeggioNote = progression.chord[arpeggioIndex] + 12;
      scheduleMusicTone({
        note: arpeggioNote,
        start,
        duration: 0.065 + (1 - density) * 0.03,
        type: track.wave,
        volume: 0.008 + intensity * 0.013,
        attack: 0.004,
        release: 0.16 + density * 0.08,
        cutoff: (1900 + intensity * 2800) * track.brightness,
        echo: true
      });
    }

    const melodyNote = track.melody[step % track.melody.length];
    if (melodyNote && intensity > 0.43) {
      scheduleMusicTone({
        note: melodyNote,
        start: start + 0.012,
        duration: track.context.startsWith("boss") ? 0.18 : 0.12,
        type: track.wave,
        volume: 0.009 + intensity * 0.011,
        attack: 0.018,
        release: 0.26,
        cutoff: (2800 + intensity * 2500) * track.brightness,
        echo: true
      });
    }

    if (track.context.startsWith("boss") && localStep % 4 === 2) {
      const accentNote = progression.chord[Math.floor(localStep / 4) % progression.chord.length] + 24;
      scheduleMusicTone({
        note: accentNote,
        start,
        duration: 0.05,
        type: "square",
        volume: 0.006 + density * 0.003,
        attack: 0.003,
        release: 0.11,
        cutoff: 2300 * track.brightness
      });
    }
  }

  scheduleMusicStep = scheduleSoundtrackStep;

  const startMusicWithoutSoundtrack = startMusic;
  startMusic = function startMusicWithSoundtrack() {
    const result = startMusicWithoutSoundtrack();
    if (musicActive && musicLayers.input) {
      const initialId = chooseNextSoundtrack(NORMAL_SOUNDTRACK_IDS, null);
      Object.assign(musicLayers, {
        trackId: initialId,
        previousTrackId: null,
        pendingTrackId: null,
        trackStartedAt: runTime,
        rotateAt: runTime + 34 + Math.random() * 14
      });
      musicLayers.tempo = soundtrackProfile(initialId).tempo;
    }
    return result;
  };

  const updateMusicWithoutSoundtrack = updateMusic;
  updateMusic = function updateMusicWithSoundtrack() {
    updateMusicWithoutSoundtrack();
    if (!musicActive || !musicLayers.master) return;
    const bossTrack = bossSoundtrackId(activeBoss && !activeBoss.dead ? activeBoss : null);
    let desiredTrack = bossTrack;
    if (!desiredTrack && Number(soloStage || 0) >= 3) desiredTrack = "fracture-run";
    if (!desiredTrack && runTime >= Number(musicLayers.rotateAt || 0)) {
      desiredTrack = chooseNextSoundtrack(NORMAL_SOUNDTRACK_IDS, musicLayers.trackId);
      musicLayers.rotateAt = runTime + 34 + Math.random() * 14;
    }
    if (!desiredTrack && !NORMAL_SOUNDTRACK_IDS.includes(musicLayers.trackId)) {
      desiredTrack = chooseNextSoundtrack(NORMAL_SOUNDTRACK_IDS, musicLayers.trackId);
    }
    if (desiredTrack) requestSoundtrack(desiredTrack);

    const targetTrack = soundtrackProfile(musicLayers.pendingTrackId || musicLayers.trackId);
    const pressureTempo = targetTrack.tempo + Math.min(8, Number(soloStage || 0) * 1.5);
    musicLayers.tempo += (pressureTempo - musicLayers.tempo) * 0.035;
  };

/*__ECHO_SECTION_END:0119__*/