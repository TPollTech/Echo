  function scheduleMusicKick(start, strength = 1) {
    if (!musicActive || !musicLayers.input || muted) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const stopTime = start + 0.32;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(118, start);
    oscillator.frequency.exponentialRampToValueAtTime(44, stopTime);
    gain.gain.setValueAtTime(0.075 * strength, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(gain).connect(musicLayers.input);
    oscillator.start(start);
    oscillator.stop(stopTime + 0.02);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
  }

