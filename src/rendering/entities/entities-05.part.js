  function drawPlayer(time) {
    if (activeMode === "multiplayer" && player.respawnTimer > 0) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(238,232,255,0.88)";
      ctx.font = "600 13px Inter, sans-serif";
      ctx.fillText(`REMATERIALIZANDO // ${Math.ceil(player.respawnTimer)}`, width / 2, height / 2 + 70);
      ctx.restore();
      return;
    }
    if (player.phasing && player.phase) {
      drawRibbon({ points: player.phase.points, hue: player.hue, width: 8 * (player.skinTrail || 1) }, true);
      drawShell(player, time);
      drawEntity({ ...player, x: player.phase.x, y: player.phase.y }, true, true, time);

      const shell = toScreen(player.x, player.y);
      const ghost = toScreen(player.phase.x, player.phase.y);
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 9]);
      ctx.beginPath();
      ctx.moveTo(shell.x, shell.y);
      ctx.lineTo(ghost.x, ghost.y);
      ctx.stroke();
      ctx.restore();
    } else {
      drawEntity(player, true, false, time);
    }
    if (player.silenced) {
      const point = toScreen(player.phasing && player.phase ? player.phase.x : player.x, player.phasing && player.phase ? player.phase.y : player.y);
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.strokeStyle = hsl(280, 90, 68, 0.72 + Math.sin(time * 0.009) * 0.16);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius * camera.zoom + 14, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11, 11);
      ctx.lineTo(11, -11);
      ctx.stroke();
      ctx.restore();
    }
  }

