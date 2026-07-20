/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0025__*/
  const camera = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, zoom: 1 };
/*__ECHO_SECTION_END:0025__*/
/*__ECHO_SECTION:0066__*/
  function worldTarget() {
    return {
      x: camera.x + (pointer.x - width / 2) / camera.zoom,
      y: camera.y + (pointer.y - height / 2) / camera.zoom
    };
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
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, MOBILE_QUALITY ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    pointer.x = clamp(pointer.x, 0, width);
    pointer.y = clamp(pointer.y, 0, height);
  }

/*__ECHO_SECTION_END:0100__*/
