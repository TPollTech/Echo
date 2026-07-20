/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0065__*/
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

/*__ECHO_SECTION_END:0065__*/
/*__ECHO_SECTION:0079__*/
  function updateEffects(dt) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.035, dt);
      particle.vy *= Math.pow(0.035, dt);
      if (particle.life <= 0) particles.splice(index, 1);
    }
    for (let index = ribbons.length - 1; index >= 0; index -= 1) {
      const ribbon = ribbons[index];
      ribbon.life -= dt;
      if (ribbon.dangerLife > 0 && ribbon.owner === player) {
        const before = ribbon.hitIds.size;
        ribbon.hitIds = damageAlongPath(ribbon.points, ribbon.damage, player, ribbon.hitIds);
        const newHits = ribbon.hitIds.size - before;
        if (player.siphon && newHits > 0) {
          player.energy = clamp(player.energy + newHits * 8, 0, player.maxEnergy);
          player.health = clamp(player.health + newHits * 3 * player.healScale, 0, player.maxHealth);
        }
        ribbon.dangerLife -= dt;
      }
      if (ribbon.life <= 0) ribbons.splice(index, 1);
    }
    for (let index = waves.length - 1; index >= 0; index -= 1) {
      const wave = waves[index];
      wave.life -= dt;
      wave.radius = lerp(wave.radius, wave.maxRadius, 1 - Math.exp(-8 * dt));
      if (wave.life <= 0) waves.splice(index, 1);
    }
    for (let index = scars.length - 1; index >= 0; index -= 1) {
      scars[index].life -= dt;
      if (scars[index].wound && scars[index].life > 0 && state === "playing") {
        const s = scars[index];
        const woundOwner = s.owner;
        const dwp = Math.hypot(player.x - s.x, player.y - s.y);
        if (dwp < s.radius + player.radius && player.hitTimer <= 0) {
          const explode = woundOwner && woundOwner.bossPhaseIndex >= 1 && Math.random() < 0.02;
          damagePlayer(explode ? 12 : 5, s.x, s.y);
        }
      }
      if (scars[index].life <= 0) scars.splice(index, 1);
    }
    screenShake = Math.max(0, screenShake - 22 * dt);
    flash = Math.max(0, flash - 2.4 * dt);
  }

/*__ECHO_SECTION_END:0079__*/
