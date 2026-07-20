  function schedulePadChord(chord, start, intensity) {
    chord.forEach((note, index) => {
      scheduleMusicTone({
        note,
        start: start + index * 0.018,
        duration: 1.5,
        type: index === 1 ? "triangle" : "sine",
        volume: (0.012 + intensity * 0.004) / (index === 1 ? 1.05 : 1),
        attack: 0.28,
        release: 0.72,
        detune: (index - 1) * 3,
        cutoff: 1500 + intensity * 1800,
        echo: true
      });
    });
  }

