  function scheduleMusicNoise(start, duration, volume, frequency, type = "highpass") {
    if (!musicActive || !musicLayers.input || muted || !musicLayers.noiseBuffer) return;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const stopTime = start + duration;

    source.buffer = musicLayers.noiseBuffer;
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, start);
    filter.Q.setValueAtTime(0.8, start);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    source.connect(filter).connect(gain).connect(musicLayers.input);
    source.start(start);
    source.stop(stopTime);
    source.addEventListener("ended", () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, { once: true });
  }

