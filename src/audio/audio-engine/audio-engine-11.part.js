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

