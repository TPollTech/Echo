/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0087__*/
  let backgroundGradient = null;

  function toScreen(x, y) {
    return {
      x: (x - camera.x) * camera.zoom + width / 2,
      y: (y - camera.y) * camera.zoom + height / 2
    };
  }

  function visible(x, y, padding = 80) {
    const pointX = (x - camera.x) * camera.zoom + width / 2;
    const pointY = (y - camera.y) * camera.zoom + height / 2;
    return pointX > -padding && pointX < width + padding && pointY > -padding && pointY < height + padding;
  }

  function drawBackground(time) {
    if (!backgroundGradient) {
      backgroundGradient = ctx.createRadialGradient(width * 0.52, height * 0.48, 0, width * 0.52, height * 0.48, Math.max(width, height) * 0.72);
      backgroundGradient.addColorStop(0, "#0d0920");
      backgroundGradient.addColorStop(0.52, "#080612");
      backgroundGradient.addColorStop(1, "#03030a");
    }
    ctx.fillStyle = backgroundGradient;
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
      const pointX = (seed.x - camera.x) * camera.zoom + width / 2;
      const pointY = (seed.y - camera.y) * camera.zoom + height / 2;
      const pulse = 0.65 + Math.sin(time * 0.0007 + seed.x) * 0.25;
      ctx.fillStyle = hsl(seed.hue, 75, 70, seed.alpha * pulse);
      ctx.beginPath();
      ctx.arc(pointX, pointY, seed.radius * camera.zoom, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    drawWorldBoundary();
  }

/*__ECHO_SECTION_END:0087__*/
/*__ECHO_SECTION:0098__*/
  function render(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const shakeX = screenShake ? random(-screenShake, screenShake) : 0;
    const shakeY = screenShake ? random(-screenShake, screenShake) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground(time);
    drawScars();
    drawMotes(time);
    drawEffects();
    drawBots(time);
    drawPlayer(time);
    ctx.restore();

    if (flashEnabled && flash > 0) {
      ctx.fillStyle = `rgba(118, 63, 190, ${flash * 0.22})`;
      ctx.fillRect(0, 0, width, height);
    }
    drawCursor();
    drawSkillHud();
    drawMinimap(time);
  }

/*__ECHO_SECTION_END:0098__*/
