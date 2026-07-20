/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0089__*/
  function drawScars() {
    if (!MOBILE_QUALITY) {
      const wounds = scars.filter((scar) => scar.wound && scar.life > 0 && visible(scar.x, scar.y, scar.radius));
      ctx.save();
      ctx.strokeStyle = hsl(350, 88, 58, 0.14);
      ctx.lineWidth = 1;
      for (let index = 1; index < wounds.length; index += 1) {
        const previous = toScreen(wounds[index - 1].x, wounds[index - 1].y);
        const current = toScreen(wounds[index].x, wounds[index].y);
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const scar of scars) {
      if (!visible(scar.x, scar.y, scar.radius)) continue;
      const point = toScreen(scar.x, scar.y);
      const alpha = clamp(scar.life / scar.maxLife, 0, 1) * 0.24;
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, scar.radius * camera.zoom);
      gradient.addColorStop(0, hsl(scar.hue, 85, 55, alpha));
      gradient.addColorStop(0.35, hsl(scar.hue, 80, 40, alpha * 0.45));
      gradient.addColorStop(1, hsl(scar.hue, 80, 35, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, scar.radius * camera.zoom, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hsl(scar.hue, 85, 65, alpha * 0.75);
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        const angle = i * TAU / 5 + scar.x;
        ctx.beginPath();
        ctx.moveTo(point.x + Math.cos(angle) * 6, point.y + Math.sin(angle) * 6);
        ctx.lineTo(point.x + Math.cos(angle + 0.18) * scar.radius * camera.zoom, point.y + Math.sin(angle + 0.18) * scar.radius * camera.zoom);
        ctx.stroke();
      }
    }
  }

/*__ECHO_SECTION_END:0089__*/
/*__ECHO_SECTION:0091__*/
  function drawRibbon(ribbon, active = false) {
    if (ribbon.points.length < 2) return;
    const alpha = active ? 0.75 : clamp(ribbon.life / ribbon.maxLife, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(ribbon.hue, 90, 60, 0.8);
      ctx.shadowBlur = active ? 18 : 12;
    }
    const lifeRatio = clamp(ribbon.life / ribbon.maxLife, 0, 1);
    const taperWidth = ribbon.width * (0.35 + lifeRatio * 0.65);
    ctx.beginPath();
    ribbon.points.forEach((point, index) => {
      const screen = toScreen(point.x, point.y);
      if (index === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    });
    ctx.strokeStyle = hsl(ribbon.hue, 94, 64, alpha * 0.22);
    ctx.lineWidth = taperWidth * 2.8 * camera.zoom;
    ctx.stroke();
    ctx.strokeStyle = hsl(ribbon.hue, 95, 74, alpha * 0.78);
    ctx.lineWidth = taperWidth * 0.7 * camera.zoom;
    ctx.stroke();
    if (!MOBILE_QUALITY) {
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.65})`;
      ctx.lineWidth = 1.2 * camera.zoom;
      ctx.stroke();
    }
    ctx.restore();
  }

/*__ECHO_SECTION_END:0091__*/
/*__ECHO_SECTION:0094__*/
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

/*__ECHO_SECTION_END:0094__*/
