/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0036__*/
  function sound(frequency, duration = 0.12, type = "sine", volume = 0.035, destination = null) {
    if (muted || !audioContext) return;
    const now = audioContext.currentTime;
    const oscillator = new OscillatorNode(audioContext, { type, frequency });
    const gain = new GainNode(audioContext);
    gain.gain.setValueAtTime(Math.max(0.0001, volume * masterVolume * sfxVolume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(destination || audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function playCollectSound(type) {
    const base = type === "gold" ? 680 : type === "red" ? 220 : type === "violet" ? 510 : 390;
    sound(base + Math.min(player.combo, 8) * 22, type === "red" ? 0.18 : 0.09, type === "red" ? "sawtooth" : "sine", type === "gold" ? 0.055 : type === "red" ? 0.045 : 0.022);
  }


/*__ECHO_SECTION_END:0036__*/
