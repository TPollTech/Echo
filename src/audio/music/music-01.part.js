  function midiToFrequency(note) {
    return 440 * 2 ** ((note - 69) / 12);
  }

