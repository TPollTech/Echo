"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { sanitizeName, sanitizeRoomCode } = require("../shared/simulation.js");
const { CLASS_IDS, CLASS_CHALLENGES, normalizeClassId, sanitizeSkillLoadout } = require("../src/classes/class-definitions.js");

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
      class_id TEXT NOT NULL DEFAULT 'cutter',
      difficulty TEXT NOT NULL DEFAULT 'normal',
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

    CREATE TABLE IF NOT EXISTS skill_points (
      player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS owned_mutations (
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      mutation_id TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
      PRIMARY KEY (player_id, mutation_id)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS loadout (
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 3),
      mutation_id TEXT,
      PRIMARY KEY (player_id, slot)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS player_preferences (
      player_id INTEGER PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      preferences_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;

    CREATE TABLE IF NOT EXISTS class_progress (
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL,
      experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
      runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
      kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0),
      victories INTEGER NOT NULL DEFAULT 0 CHECK (victories >= 0),
      challenge_claimed INTEGER NOT NULL DEFAULT 0 CHECK (challenge_claimed IN (0,1)),
      PRIMARY KEY (player_id, class_id)
    ) STRICT;
  `);

  const runColumns = new Set(database.prepare("PRAGMA table_info(runs)").all().map((column) => column.name));
  if (!runColumns.has("class_id")) database.exec("ALTER TABLE runs ADD COLUMN class_id TEXT NOT NULL DEFAULT 'cutter'");
  if (!runColumns.has("difficulty")) database.exec("ALTER TABLE runs ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'normal'");

  const insertPlayer = database.prepare(`
    INSERT INTO players (name) VALUES (?)
    ON CONFLICT(name) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP
  `);
  const selectPlayer = database.prepare("SELECT id, name FROM players WHERE name = ? COLLATE NOCASE");
  const insertRun = database.prepare(`
    INSERT INTO runs (player_id, mode, score, kills, duration_ms, outcome, room_code, class_id, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    SELECT mode, score, kills, duration_ms, outcome, room_code, class_id, difficulty, created_at
    FROM runs
    WHERE player_id = ?
    ORDER BY id DESC
    LIMIT 8
  `);

  const UPGRADE_TYPES = ["core", "charge", "calibration", "collection", "regeneration"];
  const UPGRADE_COSTS = [15, 30, 50, 80, 120];

  const MUTATION_IDS = [
    "blade", "shell", "siphon", "drift", "nova", "reweave", "focus", "gravity",
    "resonance", "afterimage", "overclock", "prism", "chain", "ghostwall", "vortex", "reversal", "dualphase"
  ];
  const MUTATION_COSTS = [8, 12, 12, 10, 14, 10, 8, 10, 14, 12, 14, 12, 10, 16, 14, 14, 16];
  const MUTATION_UPGRADE_COSTS = [[20, 35], [28, 48], [28, 48], [22, 38], [32, 55], [22, 38], [18, 30], [22, 38], [32, 55], [28, 48], [32, 55], [28, 48], [22, 38], [36, 62], [32, 55], [32, 55], [36, 62]];
  const MAX_LOADOUT_SLOTS = 4;

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

  const selectSkillPoints = database.prepare("SELECT amount FROM skill_points WHERE player_id = ?");
  const upsertSkillPoints = database.prepare(`
    INSERT INTO skill_points (player_id, amount) VALUES (?, ?)
    ON CONFLICT(player_id) DO UPDATE SET amount = excluded.amount
  `);
  const selectOwnedMutations = database.prepare("SELECT mutation_id, level FROM owned_mutations WHERE player_id = ?");
  const upsertOwnedMutation = database.prepare(`
    INSERT INTO owned_mutations (player_id, mutation_id, level) VALUES (?, ?, ?)
    ON CONFLICT(player_id, mutation_id) DO UPDATE SET level = excluded.level
  `);
  const selectLoadout = database.prepare("SELECT slot, mutation_id FROM loadout WHERE player_id = ? ORDER BY slot");
  const upsertLoadoutSlot = database.prepare(`
    INSERT INTO loadout (player_id, slot, mutation_id) VALUES (?, ?, ?)
    ON CONFLICT(player_id, slot) DO UPDATE SET mutation_id = excluded.mutation_id
  `);
  const clearLoadout = database.prepare("DELETE FROM loadout WHERE player_id = ?");
  const selectPreferences = database.prepare("SELECT preferences_json FROM player_preferences WHERE player_id = ?");
  const upsertPreferences = database.prepare(`
    INSERT INTO player_preferences (player_id, preferences_json) VALUES (?, ?)
    ON CONFLICT(player_id) DO UPDATE SET preferences_json = excluded.preferences_json, updated_at = CURRENT_TIMESTAMP
  `);
  const selectClassProgress = database.prepare("SELECT class_id, experience, runs, kills, victories, challenge_claimed FROM class_progress WHERE player_id = ?");
  const upsertClassProgress = database.prepare(`
    INSERT INTO class_progress (player_id, class_id, experience, runs, kills, victories)
    VALUES (?, ?, ?, 1, ?, ?)
    ON CONFLICT(player_id, class_id) DO UPDATE SET
      experience = class_progress.experience + excluded.experience,
      runs = class_progress.runs + 1,
      kills = class_progress.kills + excluded.kills,
      victories = class_progress.victories + excluded.victories
  `);
  const claimClassChallenge = database.prepare("UPDATE class_progress SET challenge_claimed = 1 WHERE player_id = ? AND class_id = ? AND challenge_claimed = 0");

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
    if (resonance < cost) throw new Error("Créditos insuficientes.");
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

  function calculateSkillPoints(score, kills, bossDefeated) {
    return Math.floor(score / 8) + Math.floor(kills * 1.5) + (bossDefeated ? 15 : 0);
  }

  function getSkillPoints(playerId) {
    const row = selectSkillPoints.get(playerId);
    return row ? row.amount : 0;
  }

  function getOwnedMutations(playerId) {
    const rows = selectOwnedMutations.all(playerId);
    const result = {};
    for (const row of rows) result[row.mutation_id] = row.level;
    return result;
  }

  function getLoadout(playerId) {
    const rows = selectLoadout.all(playerId);
    const result = [null, null, null, null];
    for (const row of rows) result[row.slot] = row.mutation_id;
    return result;
  }

  function getMutationCost(mutationId) {
    const index = MUTATION_IDS.indexOf(mutationId);
    return index >= 0 ? MUTATION_COSTS[index] : Infinity;
  }

  function getMutationUpgradeCost(mutationId, currentLevel) {
    const index = MUTATION_IDS.indexOf(mutationId);
    if (index < 0 || currentLevel < 1 || currentLevel >= 3) return Infinity;
    return MUTATION_UPGRADE_COSTS[index][currentLevel - 1];
  }

  function purchaseMutation(playerId, mutationId) {
    if (!MUTATION_IDS.includes(mutationId)) throw new Error("Bônus inválido.");
    const owned = getOwnedMutations(playerId);
    if (owned[mutationId]) throw new Error("Bônus já desbloqueado.");
    const cost = getMutationCost(mutationId);
    const points = getSkillPoints(playerId);
    if (points < cost) throw new Error("Pontos de habilidade insuficientes.");
    upsertSkillPoints.run(playerId, points - cost);
    upsertOwnedMutation.run(playerId, mutationId, 1);
    return { skillPoints: points - cost, mutations: { ...owned, [mutationId]: 1 } };
  }

  function upgradeMutation(playerId, mutationId) {
    if (!MUTATION_IDS.includes(mutationId)) throw new Error("Bônus inválido.");
    const owned = getOwnedMutations(playerId);
    const level = owned[mutationId];
    if (!level || level >= 3) throw new Error("Nível máximo atingido.");
    const cost = getMutationUpgradeCost(mutationId, level);
    const points = getSkillPoints(playerId);
    if (points < cost) throw new Error("Pontos de habilidade insuficientes.");
    upsertSkillPoints.run(playerId, points - cost);
    upsertOwnedMutation.run(playerId, mutationId, level + 1);
    return { skillPoints: points - cost, mutations: { ...owned, [mutationId]: level + 1 } };
  }

  function saveLoadout(playerId, slots) {
    if (!Array.isArray(slots) || slots.length !== MAX_LOADOUT_SLOTS) throw new Error("Seleção de bônus inválida.");
    const owned = getOwnedMutations(playerId);
    clearLoadout.run(playerId);
    for (let i = 0; i < MAX_LOADOUT_SLOTS; i++) {
      const mutationId = slots[i] || null;
      if (mutationId) {
        if (!MUTATION_IDS.includes(mutationId)) throw new Error(`Bônus inválido: ${mutationId}`);
        if (!owned[mutationId]) throw new Error(`Bônus não desbloqueado: ${mutationId}`);
      }
      upsertLoadoutSlot.run(playerId, i, mutationId);
    }
    return getLoadout(playerId);
  }

  function addSkillPoints(playerId, amount) {
    const current = getSkillPoints(playerId);
    upsertSkillPoints.run(playerId, current + Math.max(0, Math.floor(amount)));
  }

  function sanitizePreferences(value = {}) {
    const classId = normalizeClassId(value.classId);
    const modes = ["solo", "multiplayer", "training"];
    const difficulties = ["easy", "normal", "hard"];
    const safeSettings = {};
    const settings = value.settings && typeof value.settings === "object" ? value.settings : {};
    for (const [key, setting] of Object.entries(settings).slice(0, 40)) {
      if (/^[a-zA-Z][a-zA-Z0-9]{0,30}$/.test(key) && ["string", "number", "boolean"].includes(typeof setting)) safeSettings[key] = typeof setting === "string" ? setting.slice(0, 48) : setting;
    }
    return {
      classId,
      skinId: String(value.skinId || "azul-neon").slice(0, 32),
      skillIds: sanitizeSkillLoadout(classId, value.skillIds),
      mode: modes.includes(value.mode) ? value.mode : "solo",
      difficulty: difficulties.includes(value.difficulty) ? value.difficulty : "normal",
      modifierId: String(value.modifierId || "").slice(0, 32),
      randomClass: Boolean(value.randomClass),
      settings: safeSettings
    };
  }

  function getPreferences(playerId) {
    const row = selectPreferences.get(playerId);
    if (!row) return null;
    try { return sanitizePreferences(JSON.parse(row.preferences_json)); } catch { return null; }
  }

  function getClassProgress(playerId) {
    const result = Object.fromEntries(CLASS_IDS.map((classId) => [classId, { experience: 0, runs: 0, kills: 0, victories: 0, challengeClaimed: false }]));
    for (const row of selectClassProgress.all(playerId)) result[row.class_id] = { experience: row.experience, runs: row.runs, kills: row.kills, victories: row.victories, challengeClaimed: Boolean(row.challenge_claimed) };
    return result;
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
    const classId = normalizeClassId(run.classId);
    const difficulty = ["easy", "normal", "hard"].includes(run.difficulty) ? run.difficulty : "normal";
    const victory = outcome === "victory" ? 1 : 0;
    const experience = Math.max(1, Math.floor(score * 0.35 + kills * 8 + victory * 20));
    const result = insertRun.run(player.id, mode, score, kills, durationMs, outcome, roomCode, classId, difficulty);
    upsertClassProgress.run(player.id, classId, experience, kills, victory);
    const progress = getClassProgress(player.id)[classId];
    const challenge = CLASS_CHALLENGES[classId];
    if (challenge && !progress.challengeClaimed && (progress[challenge.metric] || 0) >= challenge.target) {
      const claim = claimClassChallenge.run(player.id, classId);
      if (claim.changes > 0) { addResonance(player.id, challenge.resonance); addSkillPoints(player.id, challenge.skillPoints); }
    }

    if (mode === "solo") {
      const multiplier = Math.max(1, Math.min(1.05, Number(run.rewardMultiplier) || 1));
      const resonance = Math.ceil(calculateRunResonance(score, kills, bossDefeated) * multiplier);
      const skillPoints = Math.ceil(calculateSkillPoints(score, kills, bossDefeated) * multiplier);
      addResonance(player.id, resonance);
      addSkillPoints(player.id, skillPoints);
      return { id: Number(result.lastInsertRowid), playerId: player.id, resonance, skillPoints };
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
      upgradeCosts: UPGRADE_COSTS,
      skillPoints: getSkillPoints(player.id),
      ownedMutations: getOwnedMutations(player.id),
      loadout: getLoadout(player.id),
      mutationCosts: MUTATION_COSTS,
      mutationUpgradeCosts: MUTATION_UPGRADE_COSTS,
      mutationIds: MUTATION_IDS
      ,preferences: getPreferences(player.id)
      ,classProgress: getClassProgress(player.id)
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
    savePreferences(rawName, preferences) {
      const player = getOrCreatePlayer(rawName);
      const sanitized = sanitizePreferences(preferences);
      upsertPreferences.run(player.id, JSON.stringify(sanitized));
      return sanitized;
    },
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
    getSkillShop(rawName) {
      const player = getOrCreatePlayer(rawName);
      return {
        skillPoints: getSkillPoints(player.id),
        ownedMutations: getOwnedMutations(player.id),
        loadout: getLoadout(player.id),
        mutationCosts: MUTATION_COSTS,
        mutationUpgradeCosts: MUTATION_UPGRADE_COSTS,
        mutationIds: MUTATION_IDS
      };
    },
    purchaseMutation(rawName, mutationId) {
      const player = getOrCreatePlayer(rawName);
      return purchaseMutation(player.id, mutationId);
    },
    upgradeMutation(rawName, mutationId) {
      const player = getOrCreatePlayer(rawName);
      return upgradeMutation(player.id, mutationId);
    },
    saveLoadout(rawName, slots) {
      const player = getOrCreatePlayer(rawName);
      return saveLoadout(player.id, slots);
    },
    close() {
      database.close();
    }
  };
}

module.exports = { createDatabase };
