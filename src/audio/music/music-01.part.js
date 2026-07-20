  function midiToFrequency(note) {
    return 440 * 2 ** ((note - 69) / 12);
  }

  function createMusicNoiseBuffer() {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

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

