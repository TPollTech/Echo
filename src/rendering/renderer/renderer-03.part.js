  function drawBackground(time) {
    const gradient = ctx.createRadialGradient(width * 0.52, height * 0.48, 0, width * 0.52, height * 0.48, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, "#0d0920");
    gradient.addColorStop(0.52, "#080612");
    gradient.addColorStop(1, "#03030a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const grid = 105 * camera.zoom;
    const offsetX = ((-camera.x * camera.zoom + width / 2) % grid + grid) % grid;
    const offsetY = ((-camera.y * camera.zoom + height / 2) % grid + grid) % grid;
    ctx.strokeStyle = "rgba(132, 105, 202, 0.055)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offsetX; x < width; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = offsetY; y < height; y += grid) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    for (const seed of ambientSeeds) {
      if (!visible(seed.x, seed.y, 10)) continue;
      const point = toScreen(seed.x, seed.y);
      const pulse = 0.65 + Math.sin(time * 0.0007 + seed.x) * 0.25;
      ctx.fillStyle = hsl(seed.hue, 75, 70, seed.alpha * pulse);
      ctx.beginPath();
      ctx.arc(point.x, point.y, seed.radius * camera.zoom, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    drawWorldBoundary();
  }

