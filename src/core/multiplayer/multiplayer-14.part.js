  function updateMultiplayer(dt) {
    if (!multiplayerSnapshot) return;
    runTime += dt;
    multiplayerRemaining = Math.max(0, multiplayerRemaining - dt);
    const blend = 1 - Math.exp(-16 * dt);
    for (const entity of [player, ...bots]) {
      if (Number.isFinite(entity.networkX)) entity.x = lerp(entity.x, entity.networkX, blend);
      if (Number.isFinite(entity.networkY)) entity.y = lerp(entity.y, entity.networkY, blend);
      if (Number.isFinite(entity.networkVx)) entity.vx = lerp(entity.vx || 0, entity.networkVx, blend);
      if (Number.isFinite(entity.networkVy)) entity.vy = lerp(entity.vy || 0, entity.networkVy, blend);
    }
    networkInputTimer -= dt;
    if (networkInputTimer <= 0 && multiplayerSocket?.readyState === WebSocket.OPEN) {
      networkInputTimer = 1 / 20;
      const target = worldTarget();
      multiplayerSocket.send(JSON.stringify({ type: "input", targetX: target.x, targetY: target.y }));
    }
    updateEffects(dt);
    updateCamera(dt);
    updateHud();
  }

