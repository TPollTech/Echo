  function scheduleMusicTone({
    note,
    start,
    duration,
    type = "sine",
    volume = 0.025,
    attack = 0.01,
    release = 0.16,
    detune = 0,
    cutoff = 2800,
    echo = false
  }) {
    if (!musicActive || !musicLayers.input || muted) return;
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const peak = Math.max(0.0002, volume);
    const attackEnd = start + Math.max(0.004, attack);
    const holdEnd = start + Math.max(attack + 0.01, duration);
    const stopTime = holdEnd + Math.max(0.04, release);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(midiToFrequency(note), start);
    oscillator.detune.setValueAtTime(detune, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, start);
    filter.Q.setValueAtTime(0.7, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, attackEnd);
    gain.gain.setValueAtTime(peak * 0.82, holdEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(filter).connect(gain).connect(musicLayers.input);
    if (echo && musicLayers.echoInput) gain.connect(musicLayers.echoInput);

    oscillator.start(start);
    oscillator.stop(stopTime + 0.03);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, { once: true });
  }

