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

