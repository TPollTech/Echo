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

