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
    drawMinimap(time);
  }

