  function drawBots(time) {
    for (const bot of bots) {
      if (bot.dead) continue;
      if (!MOBILE_QUALITY && bot.boss && bot.bossPhaseTransitioning) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        const pulse = 0.3 + Math.sin(time * 0.01) * 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 20 + Math.sin(time * 0.008) * 8, 0, TAU);
        ctx.strokeStyle = hsl(bot.hue, 80, 50, pulse);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        const phasePulse = 0.06 + bot.bossPhaseIndex * 0.04 + Math.sin(time * 0.004) * 0.03;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const gradient = ctx.createRadialGradient(point.x, point.y, radius * 0.5, point.x, point.y, radius + 22);
        gradient.addColorStop(0, hsl(bot.hue, 80, 40, phasePulse));
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(point.x - radius - 22, point.y - radius - 22, (radius + 22) * 2, (radius + 22) * 2);
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "necrostro" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const healPulse = 0.08 + Math.sin(time * 0.003) * 0.05;
        const healRadius = 400 * camera.zoom;
        const grad = ctx.createRadialGradient(point.x, point.y, radius, point.x, point.y, healRadius);
        grad.addColorStop(0, hsl(120, 80, 50, healPulse));
        grad.addColorStop(0.5, hsl(120, 70, 40, healPulse * 0.4));
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(point.x - healRadius, point.y - healRadius, healRadius * 2, healRadius * 2);
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "vortice" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        for (let i = 0; i < 3; i++) {
          const angle = time * 0.002 + (i * TAU / 3);
          const spiralR = radius + 20 + i * 15;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * spiralR, Math.sin(angle) * spiralR, 3, 0, TAU);
          ctx.fillStyle = hsl(240, 80, 60, 0.5);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, radius + 15, 0, TAU);
        ctx.strokeStyle = hsl(240, 70, 50, 0.15 + Math.sin(time * 0.005) * 0.08);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "cicatriz" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.strokeStyle = hsl(350, 90, 58, 0.32 + Math.sin(time * 0.006) * 0.12);
        ctx.lineWidth = 1.5;
        for (let index = 0; index < 5; index += 1) {
          const angle = index * TAU / 5 + time * 0.0004;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * radius * 0.4, Math.sin(angle) * radius * 0.4);
          ctx.lineTo(Math.cos(angle + 0.16) * radius * 2.2, Math.sin(angle + 0.16) * radius * 2.2);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "mimico" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        const copied = bot.copiedMutationIds || [];
        copied.forEach((id, index) => {
          const mutation = mutations.find((entry) => entry.id === id);
          const angle = time * 0.0018 + index * TAU / Math.max(1, copied.length);
          ctx.fillStyle = mutation?.color || hsl(bot.hue, 90, 65, 0.7);
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * (radius + 14), Math.sin(angle) * (radius + 14), 3, 0, TAU);
          ctx.fill();
        });
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "silenciador" && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        for (let index = 0; index < 3; index += 1) {
          const wave = (time * 0.05 + index * 18) % 58;
          ctx.strokeStyle = hsl(280, 78, 60, 0.3 * (1 - wave / 58));
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, radius + wave, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "prisma" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * TAU + time * 0.001;
          const d = radius + 10 + Math.sin(time * 0.004 + i) * 5;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * d, Math.sin(angle) * d, 2.5, 0, TAU);
          ctx.fillStyle = hsl((time * 0.05 + i * 60) % 360, 80, 65, 0.6);
          ctx.fill();
        }
        ctx.restore();
      }
      if (bot.prismaIllusion) {
        drawEntity({ ...bot, alpha: 0.22 }, false, false, time);
        continue;
      }
      if (bot.archetype === "phantom" && bot.stealthed) {
        if (bot.phasing && bot.phase) {
          drawRibbon({ points: bot.phase.points, hue: bot.hue, width: 4 }, true);
          drawEntity({ ...bot, x: bot.phase.x, y: bot.phase.y, alpha: 0.3 }, false, true, time);
        } else {
          drawEntity({ ...bot, alpha: 0.25 }, false, false, time);
        }
        continue;
      }
      if (!MOBILE_QUALITY && bot.archetype === "berserker" && bot.health < bot.maxHealth * 0.4) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const ragePulse = 0.15 + Math.sin(time * 0.012) * 0.1;
        const rageGrad = ctx.createRadialGradient(point.x, point.y, radius * 0.3, point.x, point.y, radius * 2.5);
        rageGrad.addColorStop(0, hsl(0, 90, 55, ragePulse));
        rageGrad.addColorStop(1, "transparent");
        ctx.fillStyle = rageGrad;
        ctx.fillRect(point.x - radius * 2.5, point.y - radius * 2.5, radius * 5, radius * 5);
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "bulwark" && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.beginPath();
        ctx.arc(0, 0, radius + 6, 0, TAU);
        ctx.strokeStyle = hsl(bot.hue, 60, 55, 0.25 + Math.sin(time * 0.004) * 0.1);
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      if (bot.phasing && bot.phase) {
        drawRibbon({ points: bot.phase.points, hue: bot.hue, width: 6 }, true);
        drawShell(bot, time);
        drawEntity({ ...bot, x: bot.phase.x, y: bot.phase.y }, false, true, time);
      } else {
        drawEntity(bot, false, false, time);
      }
    }
  }

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

