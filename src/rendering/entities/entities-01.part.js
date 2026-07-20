  function drawMotes(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const mote of motes) {
      if (!visible(mote.x, mote.y, 20)) continue;
      const point = toScreen(mote.x, mote.y);
      const pulse = 0.78 + Math.sin(time * 0.002 * mote.drift + mote.phase) * 0.22;
      const hue = mote.type === "gold" ? 42 : mote.type === "red" ? 0 : mote.type === "violet" ? 268 : 188;
      const radius = mote.radius * pulse * camera.zoom;
      if (!MOBILE_QUALITY) {
        ctx.shadowColor = hsl(hue, 90, mote.type === "red" ? 50 : 65, 0.9);
        ctx.shadowBlur = mote.type === "gold" ? 15 : mote.type === "red" ? 18 : 9;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = hsl(hue, mote.type === "red" ? 95 : 95, mote.type === "red" ? 55 : 68, 0.88);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TAU);
      ctx.fill();
      if (!MOBILE_QUALITY && mote.type === "gold") {
        ctx.strokeStyle = hsl(hue, 90, 72, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 5 + pulse * 2, 0, TAU);
        ctx.stroke();
      }
      if (mote.type === "red" && !MOBILE_QUALITY) {
        const warnPulse = 0.5 + Math.sin(time * 0.006 + mote.phase) * 0.5;
        ctx.strokeStyle = hsl(0, 95, 55, 0.55 * warnPulse);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 6 + pulse * 3, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hsl(30, 90, 60, 0.3 * warnPulse);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 12 + pulse * 5, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

