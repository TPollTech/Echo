  function drawMinimap(time) {
    if (state !== "playing" || activeMode !== "solo") {
      ui.minimap.classList.add("is-hidden");
      return;
    }
    ui.minimap.classList.remove("is-hidden");

    minimapFrame += 1;
    if (minimapFrame % 6 !== 0 && ui.minimap.dataset.drawn === "1") return;
    ui.minimap.dataset.drawn = "1";

    const mctx = ui.minimap.getContext("2d");
    const mw = MINIMAP_SIZE;
    const mh = MINIMAP_SIZE;
    const scale = mw / WORLD_SIZE;

    mctx.clearRect(0, 0, mw, mh);

    mctx.fillStyle = "rgba(11, 9, 24, 0.85)";
    mctx.fillRect(0, 0, mw, mh);

    mctx.strokeStyle = "rgba(132, 105, 202, 0.15)";
    mctx.lineWidth = 0.5;
    const gridStep = mw / 3;
    for (let i = 1; i < 3; i += 1) {
      mctx.beginPath();
      mctx.moveTo(i * gridStep, 0);
      mctx.lineTo(i * gridStep, mh);
      mctx.stroke();
      mctx.beginPath();
      mctx.moveTo(0, i * gridStep);
      mctx.lineTo(mw, i * gridStep);
      mctx.stroke();
    }

    for (const bot of bots) {
      if (bot.dead) continue;
      const bx = bot.x * scale;
      const by = bot.y * scale;
      if (bot.boss) {
        mctx.fillStyle = `hsl(${bot.hue}, 85%, 60%, 0.9)`;
        mctx.beginPath();
        mctx.arc(bx, by, 4, 0, TAU);
        mctx.fill();
        const bossGlow = 0.3 + Math.sin(time * 0.006) * 0.2;
        mctx.strokeStyle = `hsla(${bot.hue}, 85%, 60%, ${bossGlow})`;
        mctx.lineWidth = 1;
        mctx.beginPath();
        mctx.arc(bx, by, 7, 0, TAU);
        mctx.stroke();
      } else {
        mctx.fillStyle = `hsla(${bot.hue}, 80%, 60%, 0.65)`;
        mctx.beginPath();
        mctx.arc(bx, by, 1.8, 0, TAU);
        mctx.fill();
      }
    }

    const px = player.x * scale;
    const py = player.y * scale;
    mctx.fillStyle = "rgba(69, 230, 255, 0.95)";
    mctx.beginPath();
    mctx.arc(px, py, 3, 0, TAU);
    mctx.fill();
    mctx.strokeStyle = "rgba(69, 230, 255, 0.35)";
    mctx.lineWidth = 1;
    const viewW = (width / camera.zoom) * scale * 0.5;
    const viewH = (height / camera.zoom) * scale * 0.5;
    mctx.strokeRect(px - viewW, py - viewH, viewW * 2, viewH * 2);
  }

