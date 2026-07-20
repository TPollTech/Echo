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

