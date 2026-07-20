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

