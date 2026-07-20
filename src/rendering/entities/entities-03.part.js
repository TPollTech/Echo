  function drawShell(entity, time) {
    const point = toScreen(entity.x, entity.y);
    const radius = entity.radius * camera.zoom;
    drawEntity(entity, entity === player, false, time);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.strokeStyle = hsl(entity.hue, 90, 70, 0.45 + Math.sin(time * 0.006) * 0.12);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 10, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

