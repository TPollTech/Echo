(function () {
  "use strict";

  const canvas = document.querySelector("#arena");
  const ctx = canvas.getContext("2d", { alpha: false });
  const simulation = window.EchoSimulation;
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
