(function exposeEchoSimulation(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EchoSimulation = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function createEchoSimulation() {
  "use strict";

  const WORLD_SIZE = 3600;
  const WORLD_MARGIN = 90;
  const TAU = Math.PI * 2;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function distanceSq(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSq = abx * abx + aby * aby;
    if (!lengthSq) return Math.hypot(px - ax, py - ay);
    const projection = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSq, 0, 1);
    return Math.hypot(px - (ax + abx * projection), py - (ay + aby * projection));
  }

  function steerVelocity(entity, targetX, targetY, speed, dt, responsiveness = 5.5) {
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const distance = Math.hypot(dx, dy) || 1;
    const slow = clamp(distance / 120, 0.12, 1);
    const desiredVx = (dx / distance) * speed * slow;
    const desiredVy = (dy / distance) * speed * slow;
    const blend = 1 - Math.exp(-responsiveness * dt);
    entity.vx = lerp(entity.vx || 0, desiredVx, blend);
    entity.vy = lerp(entity.vy || 0, desiredVy, blend);
    return entity;
  }

  function sanitizeName(value, fallback = "Viajante") {
    const normalized = String(value || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 14);
    return normalized || fallback;
  }

  function sanitizeRoomCode(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, seconds);
    const mins = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
    const secs = Math.floor(safeSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  return Object.freeze({
    WORLD_SIZE,
    WORLD_MARGIN,
    TAU,
    clamp,
    lerp,
    distanceSq,
    pointToSegmentDistance,
    steerVelocity,
    sanitizeName,
    sanitizeRoomCode,
    formatTime
  });
}));
