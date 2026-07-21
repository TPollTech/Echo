/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0025__*/
  const camera = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, zoom: 1 };
/*__ECHO_SECTION_END:0025__*/
/*__ECHO_SECTION:0066__*/
  function worldTarget() {
    const sensitivity = clamp(Number(preparation?.settings?.sensitivity ?? 100) / 100, 0.5, 1.5);
    let tx = camera.x + (pointer.x - width / 2) * sensitivity / camera.zoom;
    let ty = camera.y + (pointer.y - height / 2) * sensitivity / camera.zoom;
    if (joystick && joystick.active && (joystick.dx !== 0 || joystick.dy !== 0)) {
      const joyScale = 180;
      tx = player.x + joystick.dx * joyScale;
      ty = player.y + joystick.dy * joyScale;
    }
    return { x: tx, y: ty };
  }

/*__ECHO_SECTION_END:0066__*/
/*__ECHO_SECTION:0080__*/
  function updateCamera(dt) {
    const target = player.phasing && player.phase ? player.phase : player;
    const leadX = (target.vx || 0) * 0.28;
    const leadY = (target.vy || 0) * 0.28;
    const amount = 1 - Math.exp(-4.8 * dt);
    camera.x = lerp(camera.x, target.x + leadX, amount);
    camera.y = lerp(camera.y, target.y + leadY, amount);
    const targetZoom = player.phasing ? 0.9 : 1;
    camera.zoom = lerp(camera.zoom, targetZoom, 1 - Math.exp(-3 * dt));
  }

/*__ECHO_SECTION_END:0080__*/
/*__ECHO_SECTION:0100__*/
  function resize(force = false) {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    const nextDpr = targetRenderDpr();
    const pixelWidth = Math.round(nextWidth * nextDpr);
    const pixelHeight = Math.round(nextHeight * nextDpr);
    if (!force && width === nextWidth && height === nextHeight && dpr === nextDpr
      && canvas.width === pixelWidth && canvas.height === pixelHeight) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    backgroundGradient = null;
    pointer.x = clamp(pointer.x, 0, width);
    pointer.y = clamp(pointer.y, 0, height);
  }

/*__ECHO_SECTION_END:0100__*/
