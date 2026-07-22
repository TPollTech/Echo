"use strict";

let client = null;

function getRedis() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN;
  if (!url || !token) {
    console.warn("Redis não configurado. Usando fallback em memória.");
    return createMemoryFallback();
  }
  const { Redis } = require("@upstash/redis");
  client = new Redis({ url, token });
  return client;
}

function createMemoryFallback() {
  const store = new Map();
  const timers = new Map();

  return {
    async set(key, value, opts) {
      store.set(key, typeof value === "string" ? value : JSON.stringify(value));
      if (opts?.ex) {
        if (timers.has(key)) clearTimeout(timers.get(key));
        timers.set(key, setTimeout(() => store.delete(key), opts.ex * 1000));
      }
      return "OK";
    },
    async get(key) {
      const val = store.get(key);
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    },
    async del(key) {
      store.delete(key);
      if (timers.has(key)) { clearTimeout(timers.get(key)); timers.delete(key); }
      return 1;
    },
    async incr(key) {
      const current = parseInt(store.get(key) || "0", 10);
      store.set(key, String(current + 1));
      return current + 1;
    },
    async expire(key, seconds) {
      if (timers.has(key)) clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => store.delete(key), seconds * 1000));
      return 1;
    },
    async hset(key, obj) {
      let hash = {};
      try { hash = JSON.parse(store.get(key) || "{}"); } catch { hash = {}; }
      Object.assign(hash, obj);
      store.set(key, JSON.stringify(hash));
      return 1;
    },
    async hget(key, field) {
      try {
        const hash = JSON.parse(store.get(key) || "{}");
        return hash[field] ?? null;
      } catch { return null; }
    },
    async hgetall(key) {
      try { return JSON.parse(store.get(key) || "{}"); } catch { return {}; }
    },
    async hdel(key, ...fields) {
      try {
        const hash = JSON.parse(store.get(key) || "{}");
        for (const f of fields) delete hash[f];
        store.set(key, JSON.stringify(hash));
        return fields.length;
      } catch { return 0; }
    },
    async keys(pattern) {
      const prefix = pattern.replace(/\*/g, "");
      return [...store.keys()].filter((k) => k.startsWith(prefix));
    },
    async ping() { return "PONG"; }
  };
}

const ROOM_PREFIX = "room:";
const SESSION_PREFIX = "session:";
const PRESENCE_PREFIX = "presence:";
const RATE_LIMIT_PREFIX = "ratelimit:";

const ROOM_TTL = 600;
const SESSION_TTL = 86400 * 7;
const PRESENCE_TTL = 120;

async function setRoomState(code, state) {
  const redis = getRedis();
  await redis.set(`${ROOM_PREFIX}${code}:state`, JSON.stringify(state), { ex: ROOM_TTL });
}

async function getRoomState(code) {
  const redis = getRedis();
  const raw = await redis.get(`${ROOM_PREFIX}${code}:state`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function setRoomPlayers(code, players) {
  const redis = getRedis();
  await redis.set(`${ROOM_PREFIX}${code}:players`, JSON.stringify(players), { ex: ROOM_TTL });
}

async function getRoomPlayers(code) {
  const redis = getRedis();
  const raw = await redis.get(`${ROOM_PREFIX}${code}:players`);
  if (!raw) return [];
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function addRoomEvent(code, event) {
  const redis = getRedis();
  const key = `${ROOM_PREFIX}${code}:events`;
  const jsonEvent = JSON.stringify(event);
  try {
    await redis.set(key, jsonEvent, { ex: ROOM_TTL });
  } catch {
    // fallback
  }
}

async function deleteRoom(code) {
  const redis = getRedis();
  await redis.del(`${ROOM_PREFIX}${code}:state`);
  await redis.del(`${ROOM_PREFIX}${code}:players`);
  await redis.del(`${ROOM_PREFIX}${code}:events`);
}

async function setSession(token, data) {
  const redis = getRedis();
  await redis.set(`${SESSION_PREFIX}${token}`, JSON.stringify(data), { ex: SESSION_TTL });
}

async function getSession(token) {
  const redis = getRedis();
  const raw = await redis.get(`${SESSION_PREFIX}${token}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function setPresence(playerId, data) {
  const redis = getRedis();
  await redis.set(`${PRESENCE_PREFIX}${playerId}`, JSON.stringify(data), { ex: PRESENCE_TTL });
}

async function getPresence(playerId) {
  const redis = getRedis();
  const raw = await redis.get(`${PRESENCE_PREFIX}${playerId}`);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function deletePresence(playerId) {
  const redis = getRedis();
  await redis.del(`${PRESENCE_PREFIX}${playerId}`);
}

async function checkRateLimit(key, limit, windowSeconds) {
  const redis = getRedis();
  const fullKey = `${RATE_LIMIT_PREFIX}${key}`;
  const count = await redis.incr(fullKey);
  if (count === 1) await redis.expire(fullKey, windowSeconds);
  return count <= limit;
}

module.exports = {
  getRedis,
  setRoomState, getRoomState,
  setRoomPlayers, getRoomPlayers,
  addRoomEvent, deleteRoom,
  setSession, getSession,
  setPresence, getPresence, deletePresence,
  checkRateLimit,
  ROOM_TTL, SESSION_TTL, PRESENCE_TTL
};
