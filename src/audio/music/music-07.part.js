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

