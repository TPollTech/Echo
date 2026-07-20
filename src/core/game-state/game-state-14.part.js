  function drawWorldBoundary() {
    const topLeft = toScreen(0, 0);
    const bottomRight = toScreen(WORLD_SIZE, WORLD_SIZE);
    ctx.save();
    ctx.strokeStyle = "rgba(255, 79, 216, 0.13)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 12]);
    ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.setLineDash([]);

    if (!MOBILE_QUALITY) {
      const edgeGradient = ctx.createLinearGradient(topLeft.x, 0, topLeft.x + 130, 0);
      edgeGradient.addColorStop(0, "rgba(255, 50, 130, 0.08)");
      edgeGradient.addColorStop(1, "rgba(255, 50, 130, 0)");
      ctx.fillStyle = edgeGradient;
      ctx.fillRect(topLeft.x, topLeft.y, 130, bottomRight.y - topLeft.y);
    }
    ctx.restore();
  }

