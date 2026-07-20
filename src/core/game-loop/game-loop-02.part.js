  function frame(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.034);
    previousTime = now;
    update(dt);
    render(now);
    requestAnimationFrame(frame);
  }

