"use strict";

const { randomUUID } = require("node:crypto");
const {
  WORLD_SIZE,
  WORLD_MARGIN,
  TAU,
  clamp,
  distanceSq,
  pointToSegmentDistance,
  steerVelocity,
  sanitizeName,
  sanitizeRoomCode
} = require("../shared/simulation.js");

const TICK_RATE = 30;
const SNAPSHOT_RATE = 12;
const MATCH_DURATION = 6 * 60;
const MAX_PLAYERS = 8;
const MOTE_COUNT = 180;
const TRAINING_BOT_COUNT = 2;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PLAYER_COLORS = [188, 218, 268, 302, 326, 42, 152, 18];
const BOT_NAMES = ["NARA", "VANTA", "AION", "KORA", "NYX", "UMBRA"];

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createMote() {
  const roll = Math.random();
  const type = roll > 0.94 ? "gold" : roll > 0.65 ? "violet" : "cyan";
  return {
    id: randomUUID().slice(0, 8),
    x: random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
    y: random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
    radius: type === "gold" ? random(3.5, 5) : random(2.2, 4),
    type,
    phase: Math.random() * TAU,
    drift: random(0.4, 1.2)
  };
}

function createArenaPlayer(name, index, options = {}) {
  const angle = (index / Math.max(1, MAX_PLAYERS)) * TAU + random(-0.25, 0.25);
  const spawnDistance = random(90, 240);
  const isBot = Boolean(options.isBot);
  return {
    id: options.id || randomUUID(),
    name: sanitizeName(name, isBot ? "SINAL" : "Viajante"),
    isBot,
    connected: !isBot,
    socket: options.socket || null,
    x: WORLD_SIZE / 2 + Math.cos(angle) * spawnDistance,
    y: WORLD_SIZE / 2 + Math.sin(angle) * spawnDistance,
    vx: 0,
    vy: 0,
    targetX: WORLD_SIZE / 2,
    targetY: WORLD_SIZE / 2,
    radius: isBot ? 17 : 18,
    hue: PLAYER_COLORS[index % PLAYER_COLORS.length],
    health: 100,
    maxHealth: 100,
    energy: 100,
    score: 0,
    kills: 0,
    deaths: 0,
    phasing: false,
    phase: null,
    cooldown: isBot ? random(1.5, 4) : 0,
    hitTimer: 1,
    respawnTimer: 0,
    thinkTimer: 0,
    persisted: false
  };
}

class ArenaRoom {
  constructor(code, database) {
    this.code = code;
    this.database = database;
    this.status = "active";
    this.elapsed = 0;
    this.players = new Map();
    this.motes = Array.from({ length: MOTE_COUNT }, createMote);
    this.ribbons = [];
    this.snapshotAccumulator = 0;
    this.finishedAt = 0;
    for (let index = 0; index < TRAINING_BOT_COUNT; index += 1) {
      const bot = createArenaPlayer(BOT_NAMES[index], index, { isBot: true, id: `training-${index}-${code}` });
      this.players.set(bot.id, bot);
    }
  }

  get humanPlayers() {
    return [...this.players.values()].filter((player) => !player.isBot);
  }

  addPlayer(socket, rawName) {
    if (this.status !== "active") throw new Error("A partida desta sala já terminou.");
    if (this.humanPlayers.length >= MAX_PLAYERS) throw new Error("A sala está cheia.");
    const requestedName = sanitizeName(rawName);
    const usedNames = new Set([...this.players.values()].map((player) => player.name.toLowerCase()));
    let name = requestedName;
    let suffix = 2;
    while (usedNames.has(name.toLowerCase())) {
      name = `${requestedName.slice(0, 11)} ${suffix}`.slice(0, 14);
      suffix += 1;
    }
    const player = createArenaPlayer(name, this.players.size, { socket });
    this.players.set(player.id, player);
    return player;
  }

  removePlayer(playerId, outcome = "left") {
    const player = this.players.get(playerId);
    if (!player || player.isBot) return;
    this.persistPlayer(player, outcome);
    this.players.delete(playerId);
  }

  persistPlayer(player, outcome) {
    if (player.persisted) return;
    player.persisted = true;
    this.database.saveRun({
      name: player.name,
      mode: "multiplayer",
      score: player.score,
      kills: player.kills,
      durationMs: this.elapsed * 1000,
      outcome,
      roomCode: this.code
    });
  }

  handleInput(playerId, message) {
    const player = this.players.get(playerId);
    if (!player || player.isBot || player.respawnTimer > 0 || this.status !== "active") return;
    if (message.type === "input") {
      player.targetX = clamp(Number(message.targetX) || player.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.targetY = clamp(Number(message.targetY) || player.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      return;
    }
    if (message.type === "phase_begin") this.beginPhase(player);
    if (message.type === "phase_end") this.endPhase(player);
  }

  beginPhase(player) {
    if (player.phasing || player.cooldown > 0 || player.energy < 12 || player.respawnTimer > 0) return;
    player.phasing = true;
    player.phase = {
      x: player.x,
      y: player.y,
      vx: player.vx * 0.4,
      vy: player.vy * 0.4,
      points: [{ x: player.x, y: player.y }],
      distance: 0
    };
    player.vx *= 0.25;
    player.vy *= 0.25;
  }

  endPhase(player) {
    if (!player.phasing || !player.phase) return;
    const phase = player.phase;
    const points = phase.points.map((point) => ({ x: point.x, y: point.y }));
    const hasAttack = phase.distance > 55;
    player.x = clamp(phase.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.y = clamp(phase.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.vx = phase.vx * 0.42;
    player.vy = phase.vy * 0.42;
    player.phasing = false;
    player.phase = null;
    player.cooldown = hasAttack ? 0.72 : 0.28;
    if (!hasAttack) return;

    const hitIds = new Set();
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      for (const target of this.players.values()) {
        if (target.id === player.id || target.respawnTimer > 0 || hitIds.has(target.id)) continue;
        if (pointToSegmentDistance(target.x, target.y, a.x, a.y, b.x, b.y) < target.radius + 12) {
          hitIds.add(target.id);
          this.damagePlayer(target, 34, player);
        }
      }
    }
    this.ribbons.push({
      id: randomUUID().slice(0, 8),
      points,
      hue: player.hue,
      life: 0.65,
      maxLife: 0.65,
      width: 11
    });
  }

  damagePlayer(target, amount, attacker) {
    if (target.hitTimer > 0 || target.respawnTimer > 0) return;
    target.health -= amount;
    target.hitTimer = 0.45;
    if (target.health > 0) return;
    target.health = 0;
    target.deaths += 1;
    target.respawnTimer = 4;
    target.phasing = false;
    target.phase = null;
    if (attacker && attacker.id !== target.id) {
      attacker.kills += 1;
      attacker.score += 24;
      attacker.energy = clamp(attacker.energy + 18, 0, 100);
    }
  }

  updatePlayer(player, dt) {
    if (player.respawnTimer > 0) {
      player.respawnTimer -= dt;
      if (player.respawnTimer <= 0) this.respawnPlayer(player);
      return;
    }
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.hitTimer = Math.max(0, player.hitTimer - dt);
    if (player.phasing && player.phase) {
      const phase = player.phase;
      steerVelocity(phase, player.targetX, player.targetY, 430, dt, 8.5);
      phase.x = clamp(phase.x + phase.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      phase.y = clamp(phase.y + phase.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.max(0, player.energy - 29 * dt);
      const last = phase.points[phase.points.length - 1];
      const segmentDistance = Math.hypot(phase.x - last.x, phase.y - last.y);
      if (segmentDistance > 11) {
        phase.points.push({ x: phase.x, y: phase.y });
        phase.distance += segmentDistance;
        if (phase.points.length > 80) phase.points.shift();
      }
      this.collectMotes(player, phase);
      if (player.energy <= 0) this.endPhase(player);
    } else {
      steerVelocity(player, player.targetX, player.targetY, 205, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.min(100, player.energy + 13 * dt);
      if (player.hitTimer <= 0 && player.health < 100) player.health = Math.min(100, player.health + 0.45 * dt);
      this.collectMotes(player, player);
    }
  }

  updateBot(player, dt) {
    if (player.respawnTimer > 0) return this.updatePlayer(player, dt);
    player.thinkTimer -= dt;
    if (player.thinkTimer <= 0) {
      player.thinkTimer = random(0.35, 0.9);
      const humans = this.humanPlayers.filter((target) => target.respawnTimer <= 0);
      const target = humans.sort((a, b) => distanceSq(player.x, player.y, a.x, a.y) - distanceSq(player.x, player.y, b.x, b.y))[0];
      if (target && Math.hypot(target.x - player.x, target.y - player.y) < 560) {
        player.targetX = target.x;
        player.targetY = target.y;
        if (!player.phasing && player.cooldown <= 0 && player.energy > 44 && Math.hypot(target.x - player.x, target.y - player.y) < 370) {
          this.beginPhase(player);
        }
      } else {
        const mote = this.motes[Math.floor(Math.random() * this.motes.length)];
        if (mote) {
          player.targetX = mote.x;
          player.targetY = mote.y;
        }
      }
    }
    if (player.phasing && player.phase && player.phase.distance > 300) this.endPhase(player);
    this.updatePlayer(player, dt);
  }

  collectMotes(player, entity) {
    for (let index = this.motes.length - 1; index >= 0; index -= 1) {
      const mote = this.motes[index];
      const range = player.radius + mote.radius + 6;
      if (distanceSq(entity.x, entity.y, mote.x, mote.y) > range * range) continue;
      const value = mote.type === "gold" ? 7 : mote.type === "violet" ? 3 : 1;
      player.score += value;
      player.energy = clamp(player.energy + value, 0, 100);
      this.motes.splice(index, 1, createMote());
      break;
    }
  }

  respawnPlayer(player) {
    const angle = Math.random() * TAU;
    const distance = random(160, 520);
    player.x = clamp(WORLD_SIZE / 2 + Math.cos(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.y = clamp(WORLD_SIZE / 2 + Math.sin(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.vx = 0;
    player.vy = 0;
    player.targetX = player.x;
    player.targetY = player.y;
    player.health = 100;
    player.energy = 100;
    player.hitTimer = 1.2;
    player.respawnTimer = 0;
  }

  update(dt) {
    if (this.status !== "active") return;
    this.elapsed += dt;
    for (const player of this.players.values()) {
      if (player.isBot) this.updateBot(player, dt);
      else this.updatePlayer(player, dt);
    }
    for (let index = this.ribbons.length - 1; index >= 0; index -= 1) {
      this.ribbons[index].life -= dt;
      if (this.ribbons[index].life <= 0) this.ribbons.splice(index, 1);
    }
    this.snapshotAccumulator += dt;
    if (this.snapshotAccumulator >= 1 / SNAPSHOT_RATE) {
      this.snapshotAccumulator = 0;
      this.broadcastSnapshot();
    }
    if (this.elapsed >= MATCH_DURATION) this.finish();
  }

  serializePlayer(player) {
    return {
      id: player.id,
      name: player.name,
      isBot: player.isBot,
      x: Math.round(player.x * 10) / 10,
      y: Math.round(player.y * 10) / 10,
      vx: Math.round(player.vx * 10) / 10,
      vy: Math.round(player.vy * 10) / 10,
      radius: player.radius,
      hue: player.hue,
      health: Math.round(player.health),
      maxHealth: player.maxHealth,
      energy: Math.round(player.energy),
      score: player.score,
      kills: player.kills,
      deaths: player.deaths,
      phasing: player.phasing,
      respawnTimer: Math.max(0, player.respawnTimer),
      phase: player.phase ? {
        x: player.phase.x,
        y: player.phase.y,
        vx: player.phase.vx,
        vy: player.phase.vy,
        points: player.phase.points
      } : null
    };
  }

  snapshotFor(playerId) {
    return {
      type: "snapshot",
      roomCode: this.code,
      selfId: playerId,
      status: this.status,
      elapsed: this.elapsed,
      remaining: Math.max(0, MATCH_DURATION - this.elapsed),
      players: [...this.players.values()].map((player) => this.serializePlayer(player)),
      motes: this.motes,
      ribbons: this.ribbons
    };
  }

  broadcastSnapshot() {
    for (const player of this.humanPlayers) {
      if (player.socket?.readyState === 1) player.socket.send(JSON.stringify(this.snapshotFor(player.id)));
    }
  }

  broadcast(payload) {
    const message = JSON.stringify(payload);
    for (const player of this.humanPlayers) {
      if (player.socket?.readyState === 1) player.socket.send(message);
    }
  }

  finish() {
    if (this.status !== "active") return;
    this.status = "finished";
    this.finishedAt = Date.now();
    const standings = [...this.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((player) => ({ id: player.id, name: player.name, score: player.score, kills: player.kills, deaths: player.deaths }));
    for (const player of this.humanPlayers) this.persistPlayer(player, standings[0]?.id === player.id ? "victory" : "defeat");
    this.database.finishRoom(this.code);
    this.broadcast({ type: "match_end", roomCode: this.code, standings });
  }

  summary() {
    return {
      code: this.code,
      status: this.status,
      players: this.humanPlayers.length,
      maxPlayers: MAX_PLAYERS,
      elapsed: Math.floor(this.elapsed),
      remaining: Math.max(0, Math.ceil(MATCH_DURATION - this.elapsed))
    };
  }
}

class RoomManager {
  constructor(database, options = {}) {
    this.database = database;
    this.rooms = new Map();
    this.interval = null;
    this.lastTick = Date.now();
    if (options.autoStart !== false) this.start();
  }

  start() {
    if (this.interval) return;
    this.lastTick = Date.now();
    this.interval = setInterval(() => this.tick(), 1000 / TICK_RATE);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  tick() {
    const now = Date.now();
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;
    for (const [code, room] of this.rooms) {
      room.update(dt);
      if (room.status === "finished" && now - room.finishedAt > 30_000) this.rooms.delete(code);
      if (room.status === "active" && room.humanPlayers.length === 0 && room.elapsed > 10 * 60) {
        room.finish();
      }
    }
  }

  generateCode() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      let code = "";
      for (let index = 0; index < 6; index += 1) code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
      if (!this.rooms.has(code)) return code;
    }
    throw new Error("Não foi possível criar uma sala agora.");
  }

  createRoom() {
    const code = this.generateCode();
    const room = new ArenaRoom(code, this.database);
    this.rooms.set(code, room);
    this.database.createRoom(code);
    return room;
  }

  getRoom(rawCode) {
    return this.rooms.get(sanitizeRoomCode(rawCode));
  }

  listRooms() {
    return [...this.rooms.values()].filter((room) => room.status === "active").map((room) => room.summary());
  }

  join(socket, rawCode, rawName) {
    const room = this.getRoom(rawCode);
    if (!room) throw new Error("Sala não encontrada. Crie outra ou confira o código.");
    const player = room.addPlayer(socket, rawName);
    socket.echoRoomCode = room.code;
    socket.echoPlayerId = player.id;
    socket.send(JSON.stringify({ type: "joined", roomCode: room.code, playerId: player.id, matchDuration: MATCH_DURATION }));
    socket.send(JSON.stringify(room.snapshotFor(player.id)));
    room.broadcast({ type: "system", message: `${player.name} entrou na ressonância.` });
    return { room, player };
  }

  handleMessage(socket, message) {
    if (message.type === "join") return this.join(socket, message.roomCode, message.name);
    const room = this.getRoom(socket.echoRoomCode);
    if (room && socket.echoPlayerId) room.handleInput(socket.echoPlayerId, message);
    return null;
  }

  disconnect(socket) {
    const room = this.getRoom(socket.echoRoomCode);
    if (room && socket.echoPlayerId) room.removePlayer(socket.echoPlayerId);
  }
}

module.exports = {
  ArenaRoom,
  RoomManager,
  constants: { TICK_RATE, SNAPSHOT_RATE, MATCH_DURATION, MAX_PLAYERS, MOTE_COUNT }
};
