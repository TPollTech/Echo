  function playCollectSound(type) {
    const base = type === "gold" ? 680 : type === "red" ? 220 : type === "violet" ? 510 : 390;
    sound(base + Math.min(player.combo, 8) * 22, type === "red" ? 0.18 : 0.09, type === "red" ? "sawtooth" : "sine", type === "gold" ? 0.055 : type === "red" ? 0.045 : 0.022);
  }


