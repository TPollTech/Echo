  requestAnimationFrame((now) => {
    previousTime = now;
    requestAnimationFrame(frame);
  });

