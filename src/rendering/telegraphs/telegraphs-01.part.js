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

