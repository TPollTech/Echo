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

