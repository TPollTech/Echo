"use strict";

const { randomUUID } = require("node:crypto");
const { getSkinDefinition } = require("../shared/skin-definitions.js");
const redis = require("./redis.js");
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
const {
  CLASS_IDS,
  getClassDefinition,
  getClassLevel,
  getClassEvolution,
  normalizeClassId,
  sanitizeSkillLoadout,
  createBalancedBotClassComposition,
  decideClassAi
} = require("../src/classes/class-definitions.js");

const TICK_RATE = 30;
const SNAPSHOT_RATE = 20;
const SNAPSHOT_BUFFER_LIMIT = 64 * 1024;
const MOTE_CHANGE_LOG_LIMIT = 512;
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
  const definition = getClassDefinition(options.classId);
  const skin = getSkinDefinition(options.skinId);
  return {
    id: options.id || randomUUID(),
    name: sanitizeName(name, isBot ? "BOT" : "Jogador"),
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
    hue: skin.hue < 0 ? PLAYER_COLORS[index % PLAYER_COLORS.length] : skin.hue,
    skinId: skin.id,
    skillIds: sanitizeSkillLoadout(definition.id, options.skillIds),
    classId: definition.id,
    className: definition.name,
    classLevel: 1,
    classExperience: 0,
    classResource: definition.resource.max,
    classResourceMax: definition.resource.max,
    classResourceName: definition.resource.name,
    classCooldown: 0,
    specialCooldown: 0,
    classActionTimer: 0,
    classCharging: false,
    classCharge: 0,
    classShieldTimer: 0,
    classStealthTimer: 0,
    classDashHitIds: new Set(),
    blueAmmo: definition.id === "loader" ? 8 : 0,
    violetAmmo: definition.id === "loader" ? 4 : 0,
    health: definition.attributes.health,
    maxHealth: definition.attributes.health,
    energy: 100,
    maxEnergy: 100,
    moveSpeed: definition.attributes.speed,
    damageTakenScale: definition.attributes.resistance,
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
    this.moteRevision = 1;
    this.moteChanges = [];
    this.ribbons = [];
    this.projectiles = [];
    this.traps = [];
    this.fields = [];
    this.snapshotAccumulator = 0;
    this.finishedAt = 0;
    const botClasses = createBalancedBotClassComposition({ botCount: TRAINING_BOT_COUNT });
    for (let index = 0; index < TRAINING_BOT_COUNT; index += 1) {
      const bot = createArenaPlayer(BOT_NAMES[index], index, { isBot: true, id: `training-${index}-${code}`, classId: botClasses[index] });
      this.players.set(bot.id, bot);
    }
  }

  get humanPlayers() {
    return [...this.players.values()].filter((player) => !player.isBot);
  }

  addPlayer(socket, rawName, options = {}) {
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
    const player = createArenaPlayer(name, this.players.size, { socket, classId: options.classId, skinId: options.skinId, skillIds: options.skillIds });
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
      deaths: player.deaths,
      durationMs: this.elapsed * 1000,
      outcome,
      roomCode: this.code,
      classId: player.classId,
      difficulty: "normal"
    }).catch(() => {});
  }

  handleInput(playerId, message) {
    const player = this.players.get(playerId);
    if (!player || player.isBot || player.respawnTimer > 0 || this.status !== "active") return;
    if (message.type === "input") {
      player.targetX = clamp(Number(message.targetX) || player.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.targetY = clamp(Number(message.targetY) || player.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.lastInputSequence = Math.max(player.lastInputSequence || 0, Math.floor(Number(message.sequence) || 0));
      return;
    }
    if (message.type === "phase_begin" || message.type === "primary_begin") this.beginPrimary(player);
    if (message.type === "phase_end" || message.type === "primary_end") this.endPrimary(player);
    if (message.type === "class_special") this.useClassSpecial(player);
  }

  aimAngle(player) {
    return Math.atan2(player.targetY - player.y, player.targetX - player.x);
  }

  nearestOpponent(player, maximum = Infinity) {
    let best = null;
    let bestDistance = maximum;
    for (const target of this.players.values()) {
      if (target.id === player.id || target.respawnTimer > 0) continue;
      const distance = Math.hypot(target.x - player.x, target.y - player.y);
      if (distance < bestDistance) { best = target; bestDistance = distance; }
    }
    return best;
  }

  melee(player, range, damage) {
    const target = this.nearestOpponent(player, range);
    if (target) this.damagePlayer(target, damage, player);
    player.classActionTimer = Math.max(player.classActionTimer, 0.12);
    return Boolean(target);
  }

  fireProjectile(player, angle = this.aimAngle(player), options = {}) {
    const speed = options.speed || 620;
    this.projectiles.push({ id: randomUUID().slice(0, 8), ownerId: player.id, x: player.x, y: player.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: options.damage || 16, radius: options.radius || 6, life: options.life || 1.3, pierce: options.pierce || 0, explosive: options.explosive || 0, hue: player.hue, hitIds: new Set() });
  }

  placeTrap(player) {
    this.traps.push({ id: randomUUID().slice(0, 8), ownerId: player.id, x: player.x, y: player.y, radius: 76, damage: 22, life: 12, armed: 0.45, hue: player.hue });
    player.classResource = Math.max(0, player.classResource - 1);
  }

  createGravityField(player) {
    this.fields.push({ id: randomUUID().slice(0, 8), ownerId: player.id, x: player.targetX, y: player.targetY, radius: 155, damage: 5, life: 3.2, tick: 0, hue: player.hue });
  }

  beginPrimary(player) {
    if (player.classCooldown > 0 || player.respawnTimer > 0) return;
    const angle = this.aimAngle(player);
    if (player.classId === "cutter") return this.beginPhase(player);
    if (player.classId === "marksman") { player.classCharging = true; player.classCharge = 0; return; }
    if (player.classId === "charger") { player.classActionTimer = 0.3; player.classDashAngle = angle; player.classDashHitIds = new Set(); player.classResource = Math.max(0, player.classResource - 18); return; }
    if (player.classId === "trapper") this.fireProjectile(player, angle, { damage: 13, speed: 560 });
    if (player.classId === "defender") this.melee(player, 118, 18);
    if (player.classId === "assassin") { this.melee(player, 100, player.classStealthTimer > 0 ? 50 : 24); player.classStealthTimer = 0; }
    if (player.classId === "controller") this.fireProjectile(player, angle, { damage: 11, speed: 480, radius: 11 });
    if (player.classId === "summoner") { this.fireProjectile(player, angle, { damage: 15, speed: 500 }); player.classActionTimer = 0.2; }
    if (player.classId === "orbiter") { this.fireProjectile(player, angle, { damage: 20, radius: 8 }); player.classResource = Math.max(0, player.classResource - 1); }
    if (player.classId === "loader" && player.classResource > 0) { this.fireProjectile(player, angle, { damage: player.violetAmmo > 0 ? 31 : 18, explosive: player.violetAmmo > 0 ? 65 : 0 }); if (player.violetAmmo > 0) player.violetAmmo -= 1; else player.blueAmmo -= 1; player.classResource = player.blueAmmo + player.violetAmmo; }
    player.classCooldown = 0.3;
  }

  endPrimary(player) {
    if (player.classId === "cutter") return this.endPhase(player);
    if (player.classId === "marksman" && player.classCharging) {
      player.classCharging = false;
      const charge = clamp(player.classCharge || 0.12, 0.12, 1);
      this.fireProjectile(player, this.aimAngle(player), { damage: 14 + charge * 42, speed: 520 + charge * 520, radius: 4 + charge * 7, life: 1.8 });
      player.classResource = Math.max(0, player.classResource - (8 + charge * 18));
      player.classCooldown = 0.3;
    }
  }

  useClassSpecial(player) {
    if (player.specialCooldown > 0 || player.respawnTimer > 0) return;
    const spend = (amount) => { if (player.classResource < amount) return false; player.classResource -= amount; return true; };
    if (player.classId === "cutter") { if (!spend(28)) return; this.fields.push({ id: randomUUID().slice(0, 8), ownerId: player.id, x: player.x, y: player.y, radius: 125, damage: 12, life: 0.8, tick: 0, hue: player.hue }); }
    if (player.classId === "marksman") { if (!spend(32)) return; this.fireProjectile(player, this.aimAngle(player), { speed: 980, damage: 38, pierce: 5, life: 1.8 }); }
    if (player.classId === "charger") { if (!spend(34)) return; this.fields.push({ id: randomUUID().slice(0, 8), ownerId: player.id, x: player.x, y: player.y, radius: 155, damage: 30, life: 0.5, tick: 0, hue: player.hue }); }
    if (player.classId === "trapper") { if (player.classResource < 1) return; this.placeTrap(player); }
    if (player.classId === "defender") { if (!spend(18)) return; player.classShieldTimer = 2.4; }
    if (player.classId === "assassin") { if (!spend(24)) return; player.classStealthTimer = 2.6; player.x = clamp(player.x + Math.cos(this.aimAngle(player)) * 145, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN); player.y = clamp(player.y + Math.sin(this.aimAngle(player)) * 145, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN); }
    if (player.classId === "controller") { if (!spend(30)) return; this.createGravityField(player); }
    if (player.classId === "summoner") { if (!spend(1)) return; for (let index = -1; index <= 1; index += 1) this.fireProjectile(player, this.aimAngle(player) + index * 0.3, { damage: 13, speed: 470 }); }
    if (player.classId === "orbiter") { const count = Math.floor(player.classResource); if (count < 1) return; for (let index = 0; index < count; index += 1) this.fireProjectile(player, index * TAU / count, { damage: 20, explosive: 42 }); player.classResource = 0; }
    if (player.classId === "loader") { const ammo = Math.floor(player.classResource); if (ammo < 2) return; this.fields.push({ id: randomUUID().slice(0, 8), ownerId: player.id, x: player.x, y: player.y, radius: 105 + ammo * 7, damage: 12 + ammo * 4, life: 0.5, tick: 0, hue: player.hue }); player.blueAmmo = 0; player.violetAmmo = 0; player.classResource = 0; }
    player.specialCooldown = 1.1;
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
    let applied = amount * (target.damageTakenScale || 1);
    if (target.classShieldTimer > 0) applied *= 0.22;
    target.health -= Math.max(1, applied);
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
    player.classCooldown = Math.max(0, player.classCooldown - dt);
    player.specialCooldown = Math.max(0, player.specialCooldown - dt);
    player.classShieldTimer = Math.max(0, player.classShieldTimer - dt);
    player.classStealthTimer = Math.max(0, player.classStealthTimer - dt);
    player.hitTimer = Math.max(0, player.hitTimer - dt);
    if (player.classCharging) {
      player.classCharge = Math.min(1, player.classCharge + dt * 0.75);
      player.classResource = Math.max(0, player.classResource - dt * 2);
    }
    if (player.classActionTimer > 0 && player.classId === "charger") {
      player.classActionTimer -= dt;
      player.x = clamp(player.x + Math.cos(player.classDashAngle) * 840 * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + Math.sin(player.classDashAngle) * 840 * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      for (const target of this.players.values()) {
        if (target.id === player.id || target.respawnTimer > 0 || player.classDashHitIds.has(target.id)) continue;
        if (Math.hypot(target.x - player.x, target.y - player.y) < target.radius + player.radius + 10) { player.classDashHitIds.add(target.id); this.damagePlayer(target, 27, player); }
      }
    } else player.classActionTimer = Math.max(0, player.classActionTimer - dt);
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
      steerVelocity(player, player.targetX, player.targetY, player.moveSpeed || 205, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.min(player.maxEnergy, player.energy + 13 * dt);
      if (player.hitTimer <= 0 && player.health < 100) player.health = Math.min(100, player.health + 0.45 * dt);
      this.collectMotes(player, player);
    }
    const regen = { cutter: 15, marksman: 14, charger: 18, trapper: 0.16, defender: 16, assassin: 18, controller: 15, summoner: 0.08, orbiter: 0.32, loader: 0 }[player.classId] || 12;
    if (!player.classCharging && player.classId !== "loader") player.classResource = Math.min(player.classResourceMax, player.classResource + regen * dt);
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
          const decision = decideClassAi(player.classId, { distance: Math.hypot(target.x - player.x, target.y - player.y), resourceRatio: player.classResource / Math.max(1, player.classResourceMax), healthRatio: player.health / player.maxHealth, cooldownReady: player.classCooldown <= 0, allyCount: 0, targetCount: this.humanPlayers.length });
          if (decision.special) this.useClassSpecial(player);
          else this.beginPrimary(player);
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
      player.classExperience += value;
      player.classLevel = getClassLevel(player.classExperience + player.score * 0.35);
      player.energy = clamp(player.energy + value, 0, 100);
      if (player.classId === "loader") {
        if (mote.type === "violet") player.violetAmmo = Math.min(4, player.violetAmmo + 1);
        else player.blueAmmo = Math.min(8, player.blueAmmo + 1);
        player.classResource = player.blueAmmo + player.violetAmmo;
      }
      const replacement = createMote();
      this.motes.splice(index, 1, replacement);
      this.moteRevision += 1;
      this.moteChanges.push({ revision: this.moteRevision, removeId: mote.id, add: replacement });
      if (this.moteChanges.length > MOTE_CHANGE_LOG_LIMIT) this.moteChanges.splice(0, this.moteChanges.length - MOTE_CHANGE_LOG_LIMIT);
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
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.classResource = player.classResourceMax;
    player.hitTimer = 1.2;
    player.respawnTimer = 0;
  }

  updateProjectiles(dt) {
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const projectile = this.projectiles[index];
      projectile.life -= dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      const owner = this.players.get(projectile.ownerId);
      for (const target of this.players.values()) {
        if (target.id === projectile.ownerId || target.respawnTimer > 0 || projectile.hitIds.has(target.id)) continue;
        if (Math.hypot(target.x - projectile.x, target.y - projectile.y) > target.radius + projectile.radius) continue;
        projectile.hitIds.add(target.id);
        this.damagePlayer(target, projectile.damage, owner);
        if (projectile.explosive > 0) {
          for (const nearby of this.players.values()) if (nearby.id !== projectile.ownerId && nearby.respawnTimer <= 0 && Math.hypot(nearby.x - projectile.x, nearby.y - projectile.y) < projectile.explosive) this.damagePlayer(nearby, projectile.damage * 0.55, owner);
        }
        if (projectile.pierce > 0) projectile.pierce -= 1;
        else projectile.life = 0;
        break;
      }
      if (projectile.life <= 0 || projectile.x < 0 || projectile.x > WORLD_SIZE || projectile.y < 0 || projectile.y > WORLD_SIZE) this.projectiles.splice(index, 1);
    }
  }

  updateTraps(dt) {
    for (let index = this.traps.length - 1; index >= 0; index -= 1) {
      const trap = this.traps[index];
      trap.life -= dt;
      trap.armed -= dt;
      if (trap.armed <= 0) {
        const owner = this.players.get(trap.ownerId);
        const target = [...this.players.values()].find((entry) => entry.id !== trap.ownerId && entry.respawnTimer <= 0 && Math.hypot(entry.x - trap.x, entry.y - trap.y) < trap.radius + entry.radius);
        if (target) { this.damagePlayer(target, trap.damage, owner); trap.life = 0; }
      }
      if (trap.life <= 0) this.traps.splice(index, 1);
    }
  }

  updateFields(dt) {
    for (let index = this.fields.length - 1; index >= 0; index -= 1) {
      const field = this.fields[index];
      field.life -= dt;
      field.tick -= dt;
      if (field.tick <= 0) {
        field.tick = 0.24;
        const owner = this.players.get(field.ownerId);
        for (const target of this.players.values()) {
          if (target.id === field.ownerId || target.respawnTimer > 0 || Math.hypot(target.x - field.x, target.y - field.y) > field.radius + target.radius) continue;
          target.hitTimer = 0;
          this.damagePlayer(target, field.damage, owner);
          const dx = field.x - target.x;
          const dy = field.y - target.y;
          const distance = Math.hypot(dx, dy) || 1;
          target.vx += dx / distance * 45;
          target.vy += dy / distance * 45;
        }
      }
      if (field.life <= 0) this.fields.splice(index, 1);
    }
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
    this.updateProjectiles(dt);
    this.updateTraps(dt);
    this.updateFields(dt);
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
      skinId: player.skinId,
      skillIds: player.skillIds,
      classId: player.classId,
      className: player.className,
      classLevel: player.classLevel,
      classResource: Math.round(player.classResource * 10) / 10,
      classResourceMax: player.classResourceMax,
      classResourceName: player.classResourceName,
      classShieldTimer: player.classShieldTimer,
      classStealthTimer: player.classStealthTimer,
      health: Math.round(player.health),
      maxHealth: player.maxHealth,
      energy: Math.round(player.energy),
      score: player.score,
      kills: player.kills,
      deaths: player.deaths,
      phasing: player.phasing,
      respawnTimer: Math.max(0, player.respawnTimer),
      moveSpeed: player.moveSpeed,
      lastInputSequence: player.lastInputSequence || 0,
      phase: player.phase ? {
        x: player.phase.x,
        y: player.phase.y,
        vx: player.phase.vx,
        vy: player.phase.vy,
        points: player.phase.points
      } : null
    };
  }

  snapshotFor(playerId, options = {}) {
    const knownMoteRevision = Number(options.moteRevision);
    const oldestChangeRevision = this.moteChanges[0]?.revision ?? this.moteRevision;
    const canSendMoteDelta = Number.isInteger(knownMoteRevision)
      && knownMoteRevision >= oldestChangeRevision - 1
      && knownMoteRevision <= this.moteRevision;
    const snapshot = {
      type: "snapshot",
      roomCode: this.code,
      selfId: playerId,
      status: this.status,
      elapsed: this.elapsed,
      remaining: Math.max(0, MATCH_DURATION - this.elapsed),
      players: [...this.players.values()].map((player) => this.serializePlayer(player)),
      moteRevision: this.moteRevision,
      ribbons: this.ribbons
      ,projectiles: this.projectiles.map(({ hitIds, ...projectile }) => projectile)
      ,traps: this.traps
      ,fields: this.fields
    };
    if (canSendMoteDelta) snapshot.moteChanges = this.moteChanges.filter((change) => change.revision > knownMoteRevision);
    else snapshot.motes = this.motes;
    return snapshot;
  }

  broadcastSnapshot() {
    for (const player of this.humanPlayers) {
      const socket = player.socket;
      if (socket?.readyState !== 1 || socket.bufferedAmount > SNAPSHOT_BUFFER_LIMIT) continue;
      const snapshot = this.snapshotFor(player.id, { moteRevision: socket.echoMoteRevision });
      socket.send(JSON.stringify(snapshot));
      socket.echoMoteRevision = snapshot.moteRevision;
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

  async saveStateToRedis() {
    const players = this.humanPlayers.map((p) => ({
      id: p.id, name: p.name, classId: p.classId, skinId: p.skinId,
      score: p.score, kills: p.kills, deaths: p.deaths,
      x: Math.round(p.x), y: Math.round(p.y),
      health: Math.round(p.health), connected: p.connected
    }));
    await redis.setRoomState(this.code, {
      status: this.status, elapsed: this.elapsed,
      matchId: this.code, createdAt: Date.now()
    });
    await redis.setRoomPlayers(this.code, players);
  }

  findDisconnectedPlayer(playerId) {
    for (const player of this.players.values()) {
      if (!player.isBot && player.id === playerId && !player.connected) return player;
    }
    return null;
  }

  reconnectPlayer(playerId, socket) {
    const player = this.findDisconnectedPlayer(playerId);
    if (!player) return null;
    player.connected = true;
    player.socket = socket;
    player.disconnectedAt = 0;
    socket.echoRoomCode = this.code;
    socket.echoPlayerId = player.id;
    return player;
  }
}

class RoomManager {
  constructor(database, options = {}) {
    this.database = database;
    this.rooms = new Map();
    this.interval = null;
    this.lastTick = Date.now();
    this.redisSaveCounter = 0;
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

    this.redisSaveCounter += dt;
    const shouldSaveRedis = this.redisSaveCounter >= 5;
    if (shouldSaveRedis) this.redisSaveCounter = 0;

    for (const [code, room] of this.rooms) {
      room.update(dt);

      if (room.status === "finished" && now - room.finishedAt > 30_000) {
        this.rooms.delete(code);
        redis.deleteRoom(code).catch(() => {});
      }

      if (room.status === "active" && room.humanPlayers.length === 0 && room.elapsed > 10 * 60) {
        room.finish();
      }

      if (shouldSaveRedis && room.status === "active") {
        room.saveStateToRedis().catch(() => {});
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
    this.database.createRoom(code).catch(() => {});
    return room;
  }

  getRoom(rawCode) {
    return this.rooms.get(sanitizeRoomCode(rawCode));
  }

  listRooms() {
    return [...this.rooms.values()].filter((room) => room.status === "active").map((room) => room.summary());
  }

  join(socket, rawCode, rawName, options = {}) {
    const room = this.getRoom(rawCode);
    if (!room) throw new Error("Sala não encontrada. Crie outra ou confira o código.");
    const player = room.addPlayer(socket, rawName, options);
    socket.echoRoomCode = room.code;
    socket.echoPlayerId = player.id;
    socket.send(JSON.stringify({ type: "joined", roomCode: room.code, playerId: player.id, matchDuration: MATCH_DURATION, protocolVersion: 1 }));
    const initialSnapshot = room.snapshotFor(player.id);
    socket.send(JSON.stringify(initialSnapshot));
    socket.echoMoteRevision = initialSnapshot.moteRevision;
    room.broadcast({ type: "system", message: `${player.name} entrou na sala.` });
    room.saveStateToRedis().catch(() => {});
    return { room, player };
  }

  reconnect(socket, message) {
    const room = this.getRoom(message.matchId);
    if (!room) throw new Error("Partida não encontrada.");
    if (room.status !== "active") throw new Error("Partida já encerrada.");

    const player = room.reconnectPlayer(message.playerId, socket);
    if (!player) throw new Error("Jogador não encontrado nesta partida.");

    socket.send(JSON.stringify({ type: "reconnect_ok", roomCode: room.code, playerId: player.id, matchDuration: MATCH_DURATION, protocolVersion: 1 }));
    const snapshot = room.snapshotFor(player.id);
    socket.send(JSON.stringify(snapshot));
    socket.echoMoteRevision = snapshot.moteRevision;
    room.broadcast({ type: "system", message: `${player.name} reconectou.` });
    return { room, player };
  }

  handleMessage(socket, message) {
    if (message.type === "ping") {
      if (socket.readyState === 1) socket.send(JSON.stringify({ type: "pong", clientTime: Number(message.clientTime) || 0, serverTime: Date.now() }));
      return null;
    }
    if (message.type === "join") return this.join(socket, message.roomCode, message.name, { classId: message.classId, skinId: message.skinId, skillIds: message.skillIds });
    if (message.type === "reconnect") return this.reconnect(socket, message);
    const room = this.getRoom(socket.echoRoomCode);
    if (room && socket.echoPlayerId) room.handleInput(socket.echoPlayerId, message);
    return null;
  }

  disconnect(socket) {
    const room = this.getRoom(socket.echoRoomCode);
    if (!room || !socket.echoPlayerId) return;
    const player = room.players.get(socket.echoPlayerId);
    if (!player || player.isBot) return;

    player.connected = false;
    player.socket = null;
    player.disconnectedAt = Date.now();

    setTimeout(() => {
      if (!player.connected && room.status === "active") {
        room.removePlayer(socket.echoPlayerId, "disconnected");
        room.broadcast({ type: "system", message: `${player.name} desconectou.` });
        room.saveStateToRedis().catch(() => {});
      }
    }, 30000);
  }
}

module.exports = {
  ArenaRoom,
  RoomManager,
  constants: { TICK_RATE, SNAPSHOT_RATE, MATCH_DURATION, MAX_PLAYERS, MOTE_COUNT }
};
