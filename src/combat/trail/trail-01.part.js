  function beginPhase() {
    if (state !== "playing" || mutationPending || player.phasing || player.cooldown > 0 || player.energy < 12) return;
    if (player.dualPhase && player.dualPhaseUsed >= player.dualPhaseCharges) return;
    if (activeMode === "multiplayer") {
      if (multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "phase_begin" }));
      ui.mobilePhase.classList.add("is-active");
      sound(220, 0.2, "sine", 0.025);
      return;
    }
    player.phasing = true;
    player.phase = {
      x: player.x,
      y: player.y,
      vx: player.vx * 0.4,
      vy: player.vy * 0.4,
      points: [{ x: player.x, y: player.y }],
      distance: 0
    };
    player.vx *= 0.25;
    player.vy *= 0.25;
    ui.mobilePhase.classList.add("is-active");
    sound(220, 0.32, "sine", 0.035);
    spawnWave(player.x, player.y, player.hue, 22, 0.35);
  }

