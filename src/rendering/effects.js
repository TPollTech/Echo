/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0089__*/
  const scarSpriteCache = new Map();

  function scarSprite(scar) {
    const radius = Math.max(1, Math.round(scar.radius));
    const hue = Math.round(scar.hue);
    const key = `${hue}:${radius}`;
    const cached = scarSpriteCache.get(key);
    if (cached) return cached;
    const padding = 4;
    const extent = radius + padding;
    const sprite = document.createElement("canvas");
    sprite.width = extent * 4;
    sprite.height = extent * 4;
    const spriteContext = sprite.getContext("2d");
    spriteContext.setTransform(2, 0, 0, 2, extent * 2, extent * 2);
    const gradient = spriteContext.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, hsl(hue, 85, 55, 1));
    gradient.addColorStop(0.35, hsl(hue, 80, 40, 0.45));
    gradient.addColorStop(1, hsl(hue, 80, 35, 0));
    spriteContext.fillStyle = gradient;
    spriteContext.beginPath();
    spriteContext.arc(0, 0, radius, 0, TAU);
    spriteContext.fill();
    spriteContext.strokeStyle = hsl(hue, 85, 65, 0.75);
    spriteContext.lineWidth = 1;
    spriteContext.beginPath();
    for (let index = 0; index < 5; index += 1) {
      const angle = index * TAU / 5;
      spriteContext.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
      spriteContext.lineTo(Math.cos(angle + 0.18) * radius, Math.sin(angle + 0.18) * radius);
    }
    spriteContext.stroke();
    const result = { canvas: sprite, extent };
    scarSpriteCache.set(key, result);
    return result;
  }

  function drawScars() {
    if (scars.length === 0) return;
    if (!MOBILE_QUALITY) {
      ctx.save();
      ctx.strokeStyle = hsl(350, 88, 58, 0.14);
      ctx.lineWidth = 1;
      ctx.beginPath();
      let previousWoundX = null;
      let previousWoundY = null;
      for (const wound of scars) {
        if (!wound.wound || wound.life <= 0 || !visible(wound.x, wound.y, wound.radius)) continue;
        const woundX = (wound.x - camera.x) * camera.zoom + width / 2;
        const woundY = (wound.y - camera.y) * camera.zoom + height / 2;
        if (previousWoundX != null) {
          ctx.moveTo(previousWoundX, previousWoundY);
          ctx.lineTo(woundX, woundY);
        }
        previousWoundX = woundX;
        previousWoundY = woundY;
      }
      ctx.stroke();
      ctx.restore();
    }
    for (const scar of scars) {
      if (!visible(scar.x, scar.y, scar.radius)) continue;
      const alpha = clamp(scar.life / scar.maxLife, 0, 1) * 0.24;
      const pointX = (scar.x - camera.x) * camera.zoom + width / 2;
      const pointY = (scar.y - camera.y) * camera.zoom + height / 2;
      const sprite = scarSprite(scar);
      const displayExtent = sprite.extent * camera.zoom;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pointX, pointY);
      ctx.rotate(scar.x);
      ctx.drawImage(sprite.canvas, -displayExtent, -displayExtent, displayExtent * 2, displayExtent * 2);
      ctx.restore();
    }
  }

/*__ECHO_SECTION_END:0089__*/
/*__ECHO_SECTION:0091__*/
  function drawRibbon(ribbon, active = false, hueOverride = null, widthOverride = null) {
    if (ribbon.points.length < 2) return;
    const ribbonHue = hueOverride ?? ribbon.hue;
    const ribbonWidth = widthOverride ?? ribbon.width;
    const alpha = active ? 0.75 : clamp(ribbon.life / ribbon.maxLife, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(ribbonHue, 90, 60, 0.8);
      ctx.shadowBlur = active ? 18 : 12;
    }
    const lifeRatio = active ? 1 : clamp(ribbon.life / ribbon.maxLife, 0, 1);
    const taperWidth = ribbonWidth * (0.35 + lifeRatio * 0.65);
    ctx.beginPath();
    ribbon.points.forEach((point, index) => {
      const screen = toScreen(point.x, point.y);
      if (index === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    });
    ctx.strokeStyle = hsl(ribbonHue, 94, 64, alpha * 0.22);
    ctx.lineWidth = taperWidth * 2.8 * camera.zoom;
    ctx.stroke();
    ctx.strokeStyle = hsl(ribbonHue, 95, 74, alpha * 0.78);
    ctx.lineWidth = taperWidth * 0.7 * camera.zoom;
    ctx.stroke();
    if (!MOBILE_QUALITY) {
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.65})`;
      ctx.lineWidth = 1.2 * camera.zoom;
      ctx.stroke();
    }
    ctx.restore();
  }

/*__ECHO_SECTION_END:0091__*/
/*__ECHO_SECTION:0094__*/
  function drawEffects() {
    for (const ribbon of ribbons) drawRibbon(ribbon, false);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const wave of waves) {
      if (!visible(wave.x, wave.y, wave.maxRadius)) continue;
      const pointX = (wave.x - camera.x) * camera.zoom + width / 2;
      const pointY = (wave.y - camera.y) * camera.zoom + height / 2;
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.strokeStyle = hsl(wave.hue, 92, 68, alpha * 0.65);
      ctx.lineWidth = wave.width * alpha;
      ctx.beginPath();
      ctx.arc(pointX, pointY, wave.radius * camera.zoom, 0, TAU);
      ctx.stroke();
    }
    for (const particle of particles) {
      if (!visible(particle.x, particle.y, 10)) continue;
      const pointX = (particle.x - camera.x) * camera.zoom + width / 2;
      const pointY = (particle.y - camera.y) * camera.zoom + height / 2;
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = hsl(particle.hue, 95, 70, alpha * 0.8);
      if (!MOBILE_QUALITY) ctx.shadowColor = hsl(particle.hue, 95, 62, alpha);
      ctx.beginPath();
      ctx.arc(pointX, pointY, particle.radius * alpha * camera.zoom, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

/*__ECHO_SECTION_END:0094__*/
