  function sound(frequency, duration = 0.12, type = "sine", volume = 0.035, destination = null) {
    if (muted || !audioContext) return;
    const now = audioContext.currentTime;
    const oscillator = new OscillatorNode(audioContext, { type, frequency });
    const gain = new GainNode(audioContext);
    gain.gain.setValueAtTime(Math.max(0.0001, volume * masterVolume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(destination || audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

