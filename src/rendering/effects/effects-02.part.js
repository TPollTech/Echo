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

