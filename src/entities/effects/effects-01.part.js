  function spawnWave(x, y, hue, maxRadius = 70, life = 0.5) {
    waves.push({ x, y, radius: 10, maxRadius, life, maxLife: life, hue, width: 2 });
  }

