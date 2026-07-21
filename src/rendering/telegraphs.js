/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0097__*/
  function drawCursor() {
    if (state !== "playing" || pointer.type !== "mouse") return;
    ctx.save();
    ctx.translate(pointer.x, pointer.y);
    ctx.strokeStyle = player.phasing ? "rgba(69,230,255,0.72)" : "rgba(191,179,224,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, player.phasing ? 11 : 7, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(-9, 0);
    ctx.moveTo(15, 0); ctx.lineTo(9, 0);
    ctx.moveTo(0, -15); ctx.lineTo(0, -9);
    ctx.moveTo(0, 15); ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.restore();
  }

/*__ECHO_SECTION_END:0097__*/
/*__ECHO_SECTION:0114__*/
  function drawBossTelegraph(bot) {
    if (!bot.boss || !bot.telegraphType || bot.telegraphTimer <= 0 || bot.dead) return;
    if (!visible(bot.x, bot.y, bot.telegraphRadius || 200)) return;
    const point = toScreen(bot.x, bot.y);
    const progress = 1 - (bot.telegraphTimer / bot.telegraphMaxTimer);
    const alpha = 0.25 + progress * 0.5;
    ctx.save();
    if (bot.telegraphType === "radial-burst") {
      const radius = (bot.telegraphRadius || 160) * (0.3 + progress * 0.7) * camera.zoom;
      ctx.strokeStyle = hsl(bot.hue, 95, 65, alpha * 0.8);
      ctx.lineWidth = 2.5 * camera.zoom;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = hsl(bot.hue, 90, 55, alpha * 0.3);
      ctx.lineWidth = 8 * camera.zoom;
      ctx.stroke();
      const tickCount = bot.telegraphProjectiles || 8;
      for (let i = 0; i < tickCount; i++) {
        const angle = (i / tickCount) * TAU + runTime * 0.4;
        const tickX = point.x + Math.cos(angle) * radius;
        const tickY = point.y + Math.sin(angle) * radius;
        ctx.fillStyle = hsl(bot.hue, 100, 75, alpha * 0.9);
        ctx.beginPath();
        ctx.arc(tickX, tickY, 3 * camera.zoom, 0, TAU);
        ctx.fill();
      }
    } else if (bot.telegraphType === "dash") {
      const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
      const dashDist = (bot.telegraphRadius || 200) * camera.zoom;
      const endX = point.x + Math.cos(angle) * dashDist;
      const endY = point.y + Math.sin(angle) * dashDist;
      ctx.strokeStyle = hsl(bot.hue, 95, 65, alpha * 0.7);
      ctx.lineWidth = 4 * camera.zoom;
      ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      const headSize = 12 * camera.zoom;
      ctx.fillStyle = hsl(bot.hue, 100, 70, alpha * 0.85);
      ctx.beginPath();
      ctx.moveTo(endX + Math.cos(angle) * headSize, endY + Math.sin(angle) * headSize);
      ctx.lineTo(endX + Math.cos(angle + 2.4) * headSize * 0.6, endY + Math.sin(angle + 2.4) * headSize * 0.6);
      ctx.lineTo(endX + Math.cos(angle - 2.4) * headSize * 0.6, endY + Math.sin(angle - 2.4) * headSize * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (bot.telegraphType === "area-slam") {
      const radius = (bot.telegraphRadius || 120) * camera.zoom;
      const pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.08;
      ctx.fillStyle = hsl(bot.hue, 85, 45, alpha * 0.15);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * pulse, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hsl(bot.hue, 95, 60, alpha * 0.75);
      ctx.lineWidth = 2 * camera.zoom;
      ctx.setLineDash([6 * camera.zoom, 4 * camera.zoom]);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * pulse, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

/*__ECHO_SECTION_END:0114__*/
