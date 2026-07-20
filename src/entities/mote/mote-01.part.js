  function createMote(forceNear = false) {
    const roll = Math.random();
    const type = roll > 0.94 ? "gold" : roll > 0.78 ? "red" : roll > 0.58 ? "violet" : "cyan";
    const angle = Math.random() * TAU;
    const nearDistance = random(80, 700);
    const x = forceNear ? player.x + Math.cos(angle) * nearDistance : random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    const y = forceNear ? player.y + Math.sin(angle) * nearDistance : random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    return {
      x: clamp(x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      y: clamp(y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      radius: type === "gold" ? random(3.5, 5) : type === "red" ? random(3, 4.5) : random(2.2, 4),
      type,
      phase: Math.random() * TAU,
      drift: random(0.4, 1.2)
    };
  }

