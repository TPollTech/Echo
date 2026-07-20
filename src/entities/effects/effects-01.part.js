  function spawnWave(x, y, hue, maxRadius = 70, life = 0.5) {
    waves.push({ x, y, radius: 10, maxRadius, life, maxLife: life, hue, width: 2 });
  }

  function spawnParticle(x, y, hue, speed = 100, life = 0.5) {
    const maxParticles = MOBILE_QUALITY ? 60 : 200;
    if (particles.length >= maxParticles) return;
    const angle = Math.random() * TAU;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed * random(0.45, 1),
      vy: Math.sin(angle) * speed * random(0.45, 1),
      hue,
      life,
      maxLife: life,
      radius: random(1.2, 3.4)
    });
  }

  function burst(x, y, hue, count) {
    const limit = MOBILE_QUALITY ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < limit; i += 1) spawnParticle(x, y, hue, random(80, 260), random(0.28, 0.8));
  }

