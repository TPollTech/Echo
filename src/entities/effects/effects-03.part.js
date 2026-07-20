  function burst(x, y, hue, count) {
    const limit = MOBILE_QUALITY ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < limit; i += 1) spawnParticle(x, y, hue, random(80, 260), random(0.28, 0.8));
  }

