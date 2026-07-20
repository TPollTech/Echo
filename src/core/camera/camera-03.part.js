  function updateCamera(dt) {
    const target = player.phasing && player.phase ? player.phase : player;
    const leadX = (target.vx || 0) * 0.28;
    const leadY = (target.vy || 0) * 0.28;
    const amount = 1 - Math.exp(-4.8 * dt);
    camera.x = lerp(camera.x, target.x + leadX, amount);
    camera.y = lerp(camera.y, target.y + leadY, amount);
    const targetZoom = player.phasing ? 0.9 : 1;
    camera.zoom = lerp(camera.zoom, targetZoom, 1 - Math.exp(-3 * dt));
  }

