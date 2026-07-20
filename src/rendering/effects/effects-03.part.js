  function drawEffects() {
    for (const ribbon of ribbons) drawRibbon(ribbon, false);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const wave of waves) {
      if (!visible(wave.x, wave.y, wave.maxRadius)) continue;
      const point = toScreen(wave.x, wave.y);
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.strokeStyle = hsl(wave.hue, 92, 68, alpha * 0.65);
      ctx.lineWidth = wave.width * alpha;
      ctx.beginPath();
      ctx.arc(point.x, point.y, wave.radius * camera.zoom, 0, TAU);
      ctx.stroke();
    }
    for (const particle of particles) {
      if (!visible(particle.x, particle.y, 10)) continue;
      const point = toScreen(particle.x, particle.y);
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = hsl(particle.hue, 95, 70, alpha * 0.8);
      if (!MOBILE_QUALITY) ctx.shadowColor = hsl(particle.hue, 95, 62, alpha);
      ctx.beginPath();
      ctx.arc(point.x, point.y, particle.radius * alpha * camera.zoom, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

