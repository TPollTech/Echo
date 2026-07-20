  function musicScheduler() {
    if (!musicActive || !audioContext || !musicLayers.input) return;
    while (musicLayers.nextNoteTime < audioContext.currentTime + MUSIC_SCHEDULE_AHEAD) {
      scheduleMusicStep(musicLayers.nextNoteTime, musicLayers.step);
      musicLayers.nextNoteTime += 60 / musicLayers.tempo / 4;
      musicLayers.step = (musicLayers.step + 1) % 64;
    }
  }

