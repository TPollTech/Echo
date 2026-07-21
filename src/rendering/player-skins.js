/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0130__*/
  function drawPlayerSkin(entity, radius, renderHue, time) {
    const skin = skins.find((entry) => entry.id === entity.skinId) || skins[0];
    const style = skin?.style || "electric";
    const motion = time * 0.001;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.rotate(motion * 0.72);
    if (style === "electric") {
      ctx.strokeStyle = hsl(renderHue, 98, 76, 0.82); ctx.lineWidth = 1.8;
      for (let side = 0; side < 2; side += 1) {
        ctx.beginPath();
        for (let step = 0; step <= 5; step += 1) {
          const angle = side * Math.PI + step * 0.24 - 0.62;
          const reach = radius * (1.3 + (step % 2) * 0.18);
          const x = Math.cos(angle) * reach; const y = Math.sin(angle) * reach;
          if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (style === "violet") {
      for (let band = 0; band < 3; band += 1) {
        ctx.rotate(TAU / 3); ctx.strokeStyle = hsl(renderHue + band * 8, 92, 74, 0.6); ctx.lineWidth = 1.4 + band * 0.35;
        ctx.beginPath(); ctx.arc(0, 0, radius * (1.25 + band * 0.14), -0.85, 0.88); ctx.stroke();
      }
    } else if (style === "ember") {
      ctx.strokeStyle = hsl(renderHue, 98, 68, 0.78); ctx.lineWidth = 2;
      for (let flame = 0; flame < 5; flame += 1) {
        const angle = flame * TAU / 5;
        ctx.save(); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(radius * 0.85, 0);
        ctx.quadraticCurveTo(radius * 1.35, -radius * 0.5, radius * (1.65 + Math.sin(motion * 5 + flame) * 0.12), 0);
        ctx.quadraticCurveTo(radius * 1.28, radius * 0.18, radius * 0.85, 0); ctx.stroke(); ctx.restore();
      }
    } else if (style === "champion") {
      ctx.strokeStyle = hsl(renderHue, 98, 75, 0.84); ctx.fillStyle = hsl(renderHue, 98, 72, 0.9); ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(-radius * 0.72, -radius * 1.12); ctx.lineTo(-radius * 0.38, -radius * 1.62);
      ctx.lineTo(0, -radius * 1.18); ctx.lineTo(radius * 0.38, -radius * 1.62); ctx.lineTo(radius * 0.72, -radius * 1.12); ctx.stroke();
      for (let spark = 0; spark < 3; spark += 1) { ctx.beginPath(); ctx.arc((spark - 1) * radius * 0.55, -radius * (1.45 + (spark % 2) * 0.22), 1.8, 0, TAU); ctx.fill(); }
    } else if (style === "ice") {
      ctx.strokeStyle = hsl(renderHue, 96, 84, 0.8); ctx.lineWidth = 1.35;
      for (let shard = 0; shard < 6; shard += 1) {
        ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(radius * 0.82, 0); ctx.lineTo(radius * 1.62, -radius * 0.2); ctx.lineTo(radius * 1.42, radius * 0.22); ctx.closePath(); ctx.stroke();
      }
    } else if (style === "shadow") {
      ctx.strokeStyle = hsl(renderHue, 88, 66, 0.5); ctx.lineWidth = 2;
      for (let wisp = 0; wisp < 4; wisp += 1) {
        ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(radius * 0.72, 0);
        ctx.bezierCurveTo(radius * 1.1, -radius * 0.7, radius * 1.7, radius * 0.35, radius * 1.9, -radius * 0.18); ctx.stroke();
      }
    } else if (style === "prism") {
      for (let color = 0; color < 7; color += 1) {
        const angle = color * TAU / 7; const orbit = radius * (1.35 + 0.12 * Math.sin(motion * 4 + color));
        ctx.fillStyle = hsl((time * 0.05 + color * 51) % 360, 96, 70, 0.9);
        ctx.beginPath(); ctx.arc(Math.cos(angle) * orbit, Math.sin(angle) * orbit, 2.2 + color % 2, 0, TAU); ctx.fill();
      }
    } else if (style === "pearl") {
      ctx.strokeStyle = "rgba(232,244,255,.78)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, radius * 1.45, -2.6, -0.2); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let bead = 0; bead < 4; bead += 1) { const angle = bead * TAU / 4; ctx.beginPath(); ctx.arc(Math.cos(angle) * radius * 1.34, Math.sin(angle) * radius * 1.34, 1.8, 0, TAU); ctx.fill(); }
    } else if (style === "eclipse") {
      ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = "rgba(165,132,255,.58)"; ctx.lineWidth = 2.2; ctx.setLineDash([radius * 0.65, radius * 0.25]);
      ctx.beginPath(); ctx.arc(0, 0, radius * 1.48, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(3,2,8,.55)"; ctx.beginPath(); ctx.arc(radius * 0.18, -radius * 0.08, radius * 0.78, 0, TAU); ctx.fill();
    } else if (style === "toxic") {
      ctx.strokeStyle = hsl(renderHue, 94, 70, 0.72); ctx.fillStyle = hsl(renderHue, 92, 64, 0.46); ctx.lineWidth = 1.2;
      for (let bubble = 0; bubble < 6; bubble += 1) {
        const angle = bubble * TAU / 6; const orbit = radius * (1.22 + (bubble % 3) * 0.2); const size = 2 + (bubble % 3);
        ctx.beginPath(); ctx.arc(Math.cos(angle) * orbit, Math.sin(angle) * orbit, size, 0, TAU); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }

/*__ECHO_SECTION_END:0130__*/
