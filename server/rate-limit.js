"use strict";

const { checkRateLimit } = require("./redis.js");

const LIMITS = {
  ws_message: { limit: 30, window: 1 },
  create_room: { limit: 3, window: 60 },
  join_room: { limit: 10, window: 60 },
  api_profile: { limit: 20, window: 60 },
  api_rooms: { limit: 30, window: 60 },
  login: { limit: 5, window: 60 }
};

async function isRateLimited(type, identifier) {
  const config = LIMITS[type];
  if (!config) return false;
  const key = `${type}:${identifier}`;
  return !(await checkRateLimit(key, config.limit, config.window));
}

async function checkWsRateLimit(ip, sessionId) {
  const ipLimited = await isRateLimited("ws_message", ip);
  if (ipLimited) return { limited: true, reason: "Limite de mensagens por IP excedido." };

  if (sessionId) {
    const sessionLimited = await isRateLimited("ws_message", sessionId);
    if (sessionLimited) return { limited: true, reason: "Limite de mensagens por sessão excedido." };
  }

  return { limited: false };
}

module.exports = {
  isRateLimited,
  checkWsRateLimit,
  LIMITS
};
