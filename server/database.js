"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { sanitizeName, sanitizeRoomCode } = require("../shared/simulation.js");

function createDatabase(options = {}) {
  const databasePath = options.path || path.join(__dirname, "..", "data", "echo.sqlite");
  if (databasePath !== ":memory:") fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;

    CREATE TABLE IF NOT EXISTS rooms (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('active', 'finished')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      finished_at TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      mode TEXT NOT NULL CHECK (mode IN ('solo', 'multiplayer')),
      score INTEGER NOT NULL CHECK (score >= 0),
      kills INTEGER NOT NULL CHECK (kills >= 0),
      duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
      outcome TEXT NOT NULL,
      room_code TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;

    CREATE INDEX IF NOT EXISTS runs_player_created_idx
      ON runs(player_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS resonance (
      player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS upgrades (
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      upgrade_type TEXT NOT NULL CHECK (upgrade_type IN ('core','charge','calibration','collection','regeneration')),
      level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 5),
      PRIMARY KEY (player_id, upgrade_type)
    ) STRICT;
  `);

  const insertPlayer = database.prepare(`
    INSERT INTO players (name) VALUES (?)
    ON CONFLICT(name) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP
  `);
  const selectPlayer = database.prepare("SELECT id, name FROM players WHERE name = ? COLLATE NOCASE");
  const insertRun = database.prepare(`
    INSERT INTO runs (player_id, mode, score, kills, duration_ms, outcome, room_code)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRoom = database.prepare(`
    INSERT INTO rooms (code, status) VALUES (?, 'active')
    ON CONFLICT(code) DO UPDATE SET status = 'active', created_at = CURRENT_TIMESTAMP, finished_at = NULL
  `);
  const finishRoom = database.prepare(`
    UPDATE rooms SET status = 'finished', finished_at = CURRENT_TIMESTAMP WHERE code = ?
  `);
  const playerStats = database.prepare(`
    SELECT
      COUNT(*) AS runs,
      COALESCE(MAX(score), 0) AS best_score,
      COALESCE(SUM(kills), 0) AS total_kills,
      COALESCE(MAX(duration_ms), 0) AS longest_run_ms
    FROM runs
    WHERE player_id = ? AND mode = ?
  `);
  const recentRuns = database.prepare(`
    SELECT mode, score, kills, duration_ms, outcome, room_code, created_at
    FROM runs
    WHERE player_id = ?
    ORDER BY id DESC
    LIMIT 8
  `);

  const UPGRADE_TYPES = ["core", "charge", "calibration", "collection", "regeneration"];
  const UPGRADE_COSTS = [15, 30, 50, 80, 120];

  const selectResonance = database.prepare("SELECT amount FROM resonance WHERE player_id = ?");
  const upsertResonance = database.prepare(`
    INSERT INTO resonance (player_id, amount) VALUES (?, ?)
    ON CONFLICT(player_id) DO UPDATE SET amount = excluded.amount
  `);
  const selectUpgrades = database.prepare("SELECT upgrade_type, level FROM upgrades WHERE player_id = ?");
  const upsertUpgrade = database.prepare(`
    INSERT INTO upgrades (player_id, upgrade_type, level) VALUES (?, ?, ?)
    ON CONFLICT(player_id, upgrade_type) DO UPDATE SET level = excluded.level
  `);

  function getResonance(playerId) {
    const row = selectResonance.get(playerId);
    return row ? row.amount : 0;
  }

  function getUpgrades(playerId) {
    const rows = selectUpgrades.all(playerId);
    const result = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    for (const row of rows) result[row.upgrade_type] = row.level;
    return result;
  }

  function upgradeCost(currentLevel) {
    return currentLevel < 5 ? UPGRADE_COSTS[currentLevel] : Infinity;
  }

  function purchaseUpgrade(playerId, upgradeType) {
    if (!UPGRADE_TYPES.includes(upgradeType)) throw new Error("Tipo de upgrade inválido.");
    const current = getUpgrades(playerId);
    const level = current[upgradeType];
    if (level >= 5) throw new Error("Nível máximo atingido.");
    const cost = UPGRADE_COSTS[level];
    const resonance = getResonance(playerId);
    if (resonance < cost) throw new Error("Ressonância insuficiente.");
    upsertResonance.run(playerId, resonance - cost);
    upsertUpgrade.run(playerId, upgradeType, level + 1);
    return { resonance: resonance - cost, upgrades: { ...current, [upgradeType]: level + 1 } };
  }

  function addResonance(playerId, amount) {
    const current = getResonance(playerId);
    upsertResonance.run(playerId, current + Math.max(0, Math.floor(amount)));
  }

  function calculateRunResonance(score, kills, bossDefeated) {
    return Math.floor(score / 10) + kills * 2 + (bossDefeated ? 10 : 0);
  }

  function getOrCreatePlayer(rawName) {
    const name = sanitizeName(rawName);
    insertPlayer.run(name);
    return selectPlayer.get(name);
  }

  function saveRun(run) {
    const player = getOrCreatePlayer(run.name);
    const mode = run.mode === "multiplayer" ? "multiplayer" : "solo";
    const score = Math.max(0, Math.floor(Number(run.score) || 0));
    const kills = Math.max(0, Math.floor(Number(run.kills) || 0));
    const durationMs = Math.max(0, Math.floor(Number(run.durationMs) || 0));
    const outcome = String(run.outcome || "completed").slice(0, 24);
    const roomCode = mode === "multiplayer" ? sanitizeRoomCode(run.roomCode) || null : null;
    const bossDefeated = Boolean(run.bossDefeated);
    const result = insertRun.run(player.id, mode, score, kills, durationMs, outcome, roomCode);

    if (mode === "solo") {
      const resonance = calculateRunResonance(score, kills, bossDefeated);
      addResonance(player.id, resonance);
      return { id: Number(result.lastInsertRowid), playerId: player.id, resonance };
    }

    return { id: Number(result.lastInsertRowid), playerId: player.id };
  }

  function getProfile(rawName) {
    const player = getOrCreatePlayer(rawName);
    return {
      player,
      solo: playerStats.get(player.id, "solo"),
      multiplayer: playerStats.get(player.id, "multiplayer"),
      recentRuns: recentRuns.all(player.id),
      resonance: getResonance(player.id),
      upgrades: getUpgrades(player.id),
      upgradeCosts: UPGRADE_COSTS
    };
  }

  return {
    path: databasePath,
    createRoom(rawCode) {
      const code = sanitizeRoomCode(rawCode);
      if (!code) throw new Error("Código de sala inválido.");
      insertRoom.run(code);
      return code;
    },
    finishRoom(rawCode) {
      const code = sanitizeRoomCode(rawCode);
      if (code) finishRoom.run(code);
    },
    getProfile,
    saveRun,
    getUpgrades(rawName) {
      const player = getOrCreatePlayer(rawName);
      return getUpgrades(player.id);
    },
    getResonance(rawName) {
      const player = getOrCreatePlayer(rawName);
      return getResonance(player.id);
    },
    purchaseUpgrade(rawName, upgradeType) {
      const player = getOrCreatePlayer(rawName);
      return purchaseUpgrade(player.id, upgradeType);
    },
    close() {
      database.close();
    }
  };
}

module.exports = { createDatabase };
