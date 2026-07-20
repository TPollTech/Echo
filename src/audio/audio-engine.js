/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0011__*/
  let audioContext = null;
  let muted = false;
  let masterVolume = 0.7;
  let musicActive = false;
  let musicLayers = {};
/*__ECHO_SECTION_END:0011__*/
/*__ECHO_SECTION:0035__*/
  function initAudio() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioContext = new AudioContextClass();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

/*__ECHO_SECTION_END:0035__*/
/*__ECHO_SECTION:0037__*/
  const MUSIC_LOOKAHEAD_MS = 25;
  const MUSIC_SCHEDULE_AHEAD = 0.18;
  const MUSIC_PROGRESSIONS = [
    { chord: [50, 53, 57], bass: 38 },
    { chord: [46, 50, 53], bass: 34 },
    { chord: [53, 57, 60], bass: 41 },
    { chord: [48, 52, 55], bass: 36 }
  ];
  const MUSIC_MELODY = [
    69, null, 72, null, 74, null, 72, null,
    67, null, 69, null, 65, null, null, null,
    69, null, 70, null, 72, null, 69, null,
    67, null, 65, null, 62, null, null, null
  ];

/*__ECHO_SECTION_END:0037__*/
/*__ECHO_SECTION:0039__*/
  function scheduleMusicSnare(start, strength = 1) {
    scheduleMusicNoise(start, 0.13, 0.022 * strength, 1500, "bandpass");
    scheduleMusicTone({
      note: 43,
      start,
      duration: 0.04,
      type: "triangle",
      volume: 0.018 * strength,
      attack: 0.003,
      release: 0.1,
      cutoff: 900
    });
  }

/*__ECHO_SECTION_END:0039__*/
/*__ECHO_SECTION:0041__*/
  function scheduleMusicStep(start, step) {
    if (!musicActive || !musicLayers.input) return;
    const intensity = musicLayers.intensity || 0.3;
    const bossMode = Boolean(musicLayers.bossMode);
    const barIndex = Math.floor(step / 16) % MUSIC_PROGRESSIONS.length;
    const localStep = step % 16;
    const progression = MUSIC_PROGRESSIONS[barIndex];

    if (localStep === 0) {
      schedulePadChord(progression.chord, start, intensity);
    }

    if (localStep % 4 === 0) {
      scheduleMusicKick(start, localStep === 0 ? 1.08 : 0.86);
      const bassNote = localStep === 8 ? progression.bass + 7 : progression.bass;
      scheduleMusicTone({
        note: bassNote,
        start,
        duration: 0.22,
        type: "triangle",
        volume: 0.045 + intensity * 0.012,
        attack: 0.008,
        release: 0.22,
        cutoff: 720 + intensity * 420
      });
    }

    if (localStep === 4 || localStep === 12) {
      scheduleMusicSnare(start, bossMode ? 1.12 : 0.9);
    }

    if (intensity > 0.4 && localStep % 2 === 0) {
      scheduleMusicNoise(start, 0.045, 0.0055 + intensity * 0.003, 5600, "highpass");
    }

    if (localStep % 2 === 0) {
      const arpeggioIndex = (localStep / 2 + barIndex) % progression.chord.length;
      const arpeggioNote = progression.chord[arpeggioIndex] + 12;
      scheduleMusicTone({
        note: arpeggioNote,
        start,
        duration: 0.07,
        type: "triangle",
        volume: 0.012 + intensity * 0.012,
        attack: 0.004,
        release: 0.18,
        cutoff: 2200 + intensity * 2600,
        echo: true
      });
    }

    const melodyNote = MUSIC_MELODY[step % MUSIC_MELODY.length];
    if (melodyNote && intensity > 0.52) {
      scheduleMusicTone({
        note: melodyNote,
        start: start + 0.012,
        duration: bossMode ? 0.18 : 0.12,
        type: bossMode ? "triangle" : "sine",
        volume: 0.012 + intensity * 0.009,
        attack: 0.02,
        release: 0.28,
        cutoff: 3000 + intensity * 2600,
        echo: true
      });
    }

    if (bossMode && localStep % 4 === 2) {
      const accentNote = progression.chord[(localStep / 4) % progression.chord.length] + 24;
      scheduleMusicTone({
        note: accentNote,
        start,
        duration: 0.05,
        type: "square",
        volume: 0.007,
        attack: 0.003,
        release: 0.11,
        cutoff: 2500
      });
    }
  }

/*__ECHO_SECTION_END:0041__*/
