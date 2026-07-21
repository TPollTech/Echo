/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0090__*/
  function drawMotes(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const mote of motes) {
      if (!visible(mote.x, mote.y, 20)) continue;
      const point = toScreen(mote.x, mote.y);
      const pulse = 0.78 + Math.sin(time * 0.002 * mote.drift + mote.phase) * 0.22;
      const hue = mote.type === "gold" ? 42 : mote.type === "red" ? 0 : mote.type === "violet" ? 268 : 188;
      const radius = mote.radius * pulse * camera.zoom;
      if (!MOBILE_QUALITY) {
        ctx.shadowColor = hsl(hue, 90, mote.type === "red" ? 50 : 65, 0.9);
        ctx.shadowBlur = mote.type === "gold" ? 15 : mote.type === "red" ? 18 : 9;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = hsl(hue, mote.type === "red" ? 95 : 95, mote.type === "red" ? 55 : 68, 0.88);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TAU);
      ctx.fill();
      if (!MOBILE_QUALITY && mote.type === "gold") {
        ctx.strokeStyle = hsl(hue, 90, 72, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 5 + pulse * 2, 0, TAU);
        ctx.stroke();
      }
      if (mote.type === "red" && !MOBILE_QUALITY) {
        const warnPulse = 0.5 + Math.sin(time * 0.006 + mote.phase) * 0.5;
        ctx.strokeStyle = hsl(0, 95, 55, 0.55 * warnPulse);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 6 + pulse * 3, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hsl(30, 90, 60, 0.3 * warnPulse);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 12 + pulse * 5, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

/*__ECHO_SECTION_END:0090__*/
/*__ECHO_SECTION:0092__*/
  function drawEntity(entity, isPlayer = false, spectral = false, time = 0) {
    if (!visible(entity.x, entity.y, 70)) return;
    const point = toScreen(entity.x, entity.y);
    const radius = (entity.radius || 16) * camera.zoom * (spectral ? 0.85 : 1);
    const healthRatio = clamp(entity.health / (entity.maxHealth || 100), 0, 1);
    const pulse = 1 + Math.sin(time * 0.004 + entity.x) * 0.035;
    const isLowHealth = !isPlayer && !spectral && healthRatio < 0.3 && healthRatio > 0;
    const renderHue = isPlayer && entity.skinId === "caotico" ? (time * 0.05) % 360 : entity.hue;
    const glow = isPlayer ? entity.skinGlow || 1 : 1;

    if (!isPlayer && !spectral && entity.archetype === "sniper" && entity.sniperAimTimer > 0) {
      const aimPoint = toScreen(entity.sniperAimX, entity.sniperAimY);
      const charge = 1 - clamp(entity.sniperAimTimer / Math.max(0.01, entity.sniperAimDuration), 0, 1);
      ctx.save();
      ctx.strokeStyle = hsl(entity.hue, 96, 68, 0.35 + charge * 0.55);
      ctx.lineWidth = 1.2 + charge * 1.8;
      ctx.setLineDash([8 - charge * 4, 7]);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(aimPoint.x, aimPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(aimPoint.x, aimPoint.y, 9 + charge * 8, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(aimPoint.x - 15, aimPoint.y);
      ctx.lineTo(aimPoint.x + 15, aimPoint.y);
      ctx.moveTo(aimPoint.x, aimPoint.y - 15);
      ctx.lineTo(aimPoint.x, aimPoint.y + 15);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    if (entity.alpha != null) ctx.globalAlpha = entity.alpha;
    ctx.translate(point.x, point.y);
    ctx.globalCompositeOperation = "lighter";
    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(renderHue, 90, 62, spectral ? 0.9 : 0.65);
      ctx.shadowBlur = (spectral ? 24 : 16) * glow;
    }

    if (!MOBILE_QUALITY || isPlayer) {
      const auraRadius = (isLowHealth ? radius * 2.8 : radius * 2.1) * glow;
      const auraAlpha = isLowHealth ? 0.42 + Math.sin(time * 0.008) * 0.18 : spectral ? 0.42 : 0.34;
      const aura = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, auraRadius);
      aura.addColorStop(0, hsl(isLowHealth ? 0 : renderHue, 95, isLowHealth ? 55 : 72, auraAlpha));
      aura.addColorStop(0.35, hsl(isLowHealth ? 0 : renderHue, 85, 55, spectral ? 0.14 : 0.1));
      aura.addColorStop(1, hsl(isLowHealth ? 0 : renderHue, 80, 40, 0));
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, TAU);
      ctx.fill();
    }

    if (!MOBILE_QUALITY) {
      ctx.rotate(time * 0.00045 * (isPlayer ? 1 : -1) + entity.x * 0.002);
      ctx.strokeStyle = hsl(renderHue, 92, 70, spectral ? 0.75 : 0.46);
      ctx.lineWidth = 1.15 * glow;
      ctx.setLineDash(spectral ? [3, 5] : []);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.35 * pulse, radius * 0.86, 0.4, 0, TAU);
      ctx.stroke();
      ctx.rotate(-time * 0.0009);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.75, radius * 1.45, -0.6, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (!MOBILE_QUALITY) {
      const coreGradient = ctx.createRadialGradient(-radius * 0.25, -radius * 0.3, 0, 0, 0, radius);
      coreGradient.addColorStop(0, spectral ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.92)");
      coreGradient.addColorStop(0.2, hsl(renderHue, 95, 75, spectral ? 0.75 : 0.95));
      coreGradient.addColorStop(0.72, hsl(renderHue, 85, 45, spectral ? 0.23 : 0.68));
      coreGradient.addColorStop(1, hsl(renderHue, 85, 35, 0.08));
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      for (let index = 0; index <= 18; index += 1) {
        const angle = index / 18 * TAU;
        const distortion = 1 + Math.sin(angle * 3 + time * 0.003 + entity.x) * 0.07;
        const x = Math.cos(angle) * radius * distortion;
        const y = Math.sin(angle) * radius * distortion;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = hsl(renderHue, 85, 50, spectral ? 0.5 : 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fill();
    }

    if (isPlayer && !spectral && !MOBILE_QUALITY) {
      const skinId = entity.skinId;
      ctx.save();
      ctx.rotate(time * 0.0012);
      if (skinId === "fenix" || skinId === "sangue") {
        const count = skinId === "fenix" ? 6 : 4;
        for (let index = 0; index < count; index += 1) {
          const angle = index * TAU / count;
          const distance = radius * (1.35 + 0.18 * Math.sin(time * 0.006 + index));
          ctx.fillStyle = hsl(renderHue + index * 5, 95, 62, 0.58);
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, skinId === "fenix" ? 2.2 : 1.7, 0, TAU);
          ctx.fill();
        }
      } else if (skinId === "gelo") {
        ctx.strokeStyle = hsl(renderHue, 95, 78, 0.62);
        for (let index = 0; index < 6; index += 1) {
          const angle = index * TAU / 6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          ctx.lineTo(Math.cos(angle) * radius * 1.55, Math.sin(angle) * radius * 1.55);
          ctx.stroke();
        }
      } else if (skinId === "neon" || skinId === "dourado" || skinId === "caotico") {
        ctx.strokeStyle = hsl(renderHue, 96, 70, 0.72);
        ctx.lineWidth = skinId === "neon" ? 2.3 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.45, 0, TAU);
        ctx.stroke();
      } else if (skinId === "sombra") {
        ctx.strokeStyle = hsl(280, 80, 55, 0.38);
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.7, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    if (!isPlayer && !spectral && entity.faction != null && !entity.boss && !entity.bossClone) {
      const factionHues = [15, 200, 280];
      ctx.strokeStyle = hsl(factionHues[entity.faction] || renderHue, 88, 62, 0.34);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, -Math.PI * 0.75, Math.PI * 0.15);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    if (!MOBILE_QUALITY) ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(-radius * 0.18, -radius * 0.2, Math.max(1.4, radius * 0.12), 0, TAU);
    ctx.fill();
    ctx.restore();

    if (!spectral) {
      ctx.save();
      ctx.textAlign = "center";
      if (!MOBILE_QUALITY || isPlayer || entity.boss) {
        if (entity.roleLabel) {
          ctx.font = `600 ${entity.boss ? 12 : 10}px Inter, sans-serif`;
          ctx.fillStyle = entity.boss ? "rgba(255,85,122,0.95)" : hsl(renderHue, 88, 72, 0.7);
          ctx.fillText(entity.roleLabel, point.x, point.y - radius - 27);
        }
        ctx.font = `${isPlayer || entity.boss ? 700 : 600} ${entity.boss ? 16 : isPlayer ? 13 : 12}px Inter, sans-serif`;
        ctx.fillStyle = isPlayer ? "rgba(222,250,255,0.9)" : "rgba(205,197,220,0.72)";
        ctx.fillText(entity.name, point.x, point.y - radius - 15);
      }
      if (!isPlayer && (healthRatio < 0.99 || entity.boss)) {
        const barWidth = entity.boss ? 74 : 32;
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(point.x - barWidth / 2, point.y + radius + 10, barWidth, 2);
        ctx.fillStyle = hsl(renderHue, 90, 64, 0.85);
        ctx.fillRect(point.x - barWidth / 2, point.y + radius + 10, barWidth * healthRatio, 2);
      }
      ctx.restore();
    }
  }

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

/*__ECHO_SECTION_END:0092__*/
/*__ECHO_SECTION:0093__*/
  function drawBots(time) {
    for (const bot of bots) {
      if (bot.dead) continue;
      drawBossTelegraph(bot);
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

/*__ECHO_SECTION_END:0093__*/
