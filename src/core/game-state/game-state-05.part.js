  if (!simulation) throw new Error("O módulo compartilhado de simulação não foi carregado.");
  const {
    TAU,
    WORLD_SIZE,
    WORLD_MARGIN,
    clamp,
    lerp,
    distanceSq,
    pointToSegmentDistance,
    steerVelocity,
    sanitizeName,
    sanitizeRoomCode,
    formatTime
  } = simulation;
