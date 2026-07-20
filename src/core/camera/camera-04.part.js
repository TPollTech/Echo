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

