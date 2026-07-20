/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0038__*/
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

/*__ECHO_SECTION_END:0038__*/
/*__ECHO_SECTION:0042__*/
  function musicScheduler() {
    if (!musicActive || !audioContext || !musicLayers.input) return;
    while (musicLayers.nextNoteTime < audioContext.currentTime + MUSIC_SCHEDULE_AHEAD) {
      scheduleMusicStep(musicLayers.nextNoteTime, musicLayers.step);
      musicLayers.nextNoteTime += 60 / musicLayers.tempo / 4;
      musicLayers.step = (musicLayers.step + 1) % 64;
    }
  }

  function startMusic() {
    if (!audioContext || musicActive) return;
    const input = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    const master = audioContext.createGain();
    const echoInput = audioContext.createGain();
    const delay = audioContext.createDelay(0.6);
    const feedback = audioContext.createGain();
    const wet = audioContext.createGain();
    const now = audioContext.currentTime;

    filter.type = "lowpass";
    filter.frequency.value = 2600;
    filter.Q.value = 0.45;
    compressor.threshold.value = -24;
    compressor.knee.value = 20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.24;
    delay.delayTime.value = 0.28;
    feedback.gain.value = 0.16;
    wet.gain.value = 0.16;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, masterVolume * 0.55), now + 0.8);

    input.connect(filter).connect(compressor).connect(master).connect(audioContext.destination);
    echoInput.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(compressor);

    musicActive = true;
    musicLayers = {
      input,
      filter,
      compressor,
      master,
      echoInput,
      delay,
      feedback,
      wet,
      noiseBuffer: createMusicNoiseBuffer(),
      timer: null,
      nextNoteTime: now + 0.08,
      step: 0,
      tempo: 86,
      intensity: 0.32,
      bossMode: false
    };
    musicLayers.timer = window.setInterval(musicScheduler, MUSIC_LOOKAHEAD_MS);
    musicScheduler();
  }

  function stopMusic() {
    if (!musicActive) return;
    musicActive = false;
    const closingLayers = musicLayers;
    musicLayers = {};
    if (closingLayers.timer) window.clearInterval(closingLayers.timer);
    if (!audioContext || !closingLayers.master) return;
    const now = audioContext.currentTime;
    closingLayers.master.gain.cancelScheduledValues(now);
    closingLayers.master.gain.setValueAtTime(Math.max(0.0001, closingLayers.master.gain.value), now);
    closingLayers.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    window.setTimeout(() => {
      for (const node of [
        closingLayers.input,
        closingLayers.filter,
        closingLayers.compressor,
        closingLayers.master,
        closingLayers.echoInput,
        closingLayers.delay,
        closingLayers.feedback,
        closingLayers.wet
      ]) {
        try { node?.disconnect(); } catch (_error) {}
      }
    }, 450);
  }

  function updateMusic() {
    if (!musicActive || !audioContext || !musicLayers.master) return;
    const hp = player.health / (player.maxHealth || 100);
    const combo = player.combo || 0;
    const isBoss = Boolean(activeBoss && !activeBoss.dead);
    const isPhasing = Boolean(player.phasing);
    const stage = Number(soloStage || 0);
    const intensity = clamp(
      0.3
        + stage * 0.08
        + Math.min(combo, 12) * 0.012
        + (isBoss ? 0.24 : 0)
        + (isPhasing ? 0.06 : 0),
      0.28,
      0.92
    );
    const targetTempo = isBoss ? 104 : 86 + Math.min(12, stage * 4);
    const targetGain = muted ? 0.0001 : Math.max(0.0001, masterVolume * 0.55);
    const now = audioContext.currentTime;

    musicLayers.intensity = intensity;
    musicLayers.bossMode = isBoss;
    musicLayers.tempo += (targetTempo - musicLayers.tempo) * 0.025;
    musicLayers.master.gain.cancelScheduledValues(now);
    musicLayers.master.gain.setTargetAtTime(targetGain, now, 0.08);
    musicLayers.filter.frequency.setTargetAtTime(
      2100 + intensity * 2500 + (hp < 0.3 ? -350 : 0),
      now,
      0.12
    );
    musicLayers.wet.gain.setTargetAtTime(isBoss ? 0.2 : 0.14, now, 0.15);
  }

/*__ECHO_SECTION_END:0042__*/
