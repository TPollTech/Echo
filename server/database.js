"use strict";

const path = require("node:path");
const { sanitizeName, sanitizeRoomCode } = require("../shared/simulation.js");
const { CLASS_IDS, CLASS_CHALLENGES, normalizeClassId, sanitizeSkillLoadout } = require("../src/classes/class-definitions.js");

const UPGRADE_TYPES = ["core", "charge", "calibration", "collection", "regeneration"];
const UPGRADE_COSTS = [15, 30, 50, 80, 120];
const MUTATION_IDS = [
  "blade", "shell", "siphon", "drift", "nova", "reweave", "focus", "gravity",
  "resonance", "afterimage", "overclock", "prism", "chain", "ghostwall", "vortex", "reversal", "dualphase"
];
const MUTATION_COSTS = [8, 12, 12, 10, 14, 10, 8, 10, 14, 12, 14, 12, 10, 16, 14, 14, 16];
const MUTATION_UPGRADE_COSTS = [
  [20, 35], [28, 48], [28, 48], [22, 38], [32, 55], [22, 38], [18, 30], [22, 38],
  [32, 55], [28, 48], [32, 55], [28, 48], [22, 38], [36, 62], [32, 55], [32, 55], [36, 62]
];
const MAX_LOADOUT_SLOTS = 4;

function createDatabase(options = {}) {
  const databaseUrl = options.databaseUrl || process.env.DATABASE_URL;
  const sqlitePath = options.path;

  if (databaseUrl && !sqlitePath) {
    try {
      return createPostgresDatabase(databaseUrl);
    } catch (error) {
      console.warn(`PostgreSQL indisponível (${error.message}), usando SQLite.`);
    }
  }
  return createSqliteDatabase(options);
}

function createSqliteDatabase(options = {}) {
  const fs = require("node:fs");
  const { DatabaseSync } = require("node:sqlite");
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
      deaths INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
      outcome TEXT NOT NULL,
      room_code TEXT,
      class_id TEXT NOT NULL DEFAULT 'cutter',
      difficulty TEXT NOT NULL DEFAULT 'normal',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) STRICT;

    CREATE INDEX IF NOT EXISTS runs_player_created_idx ON runs(player_id, created_at DESC);

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
  if (!runColumns.has("deaths")) database.exec("ALTER TABLE runs ADD COLUMN deaths INTEGER NOT NULL DEFAULT 0");

  const insertPlayer = database.prepare(`
    INSERT INTO players (name) VALUES (?)
    ON CONFLICT(name) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP
  `);
  const selectPlayer = database.prepare("SELECT id, name FROM players WHERE name = ? COLLATE NOCASE");
  const insertRun = database.prepare(`
    INSERT INTO runs (player_id, mode, score, kills, deaths, duration_ms, outcome, room_code, class_id, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRoom = database.prepare(`
    INSERT INTO rooms (code, status) VALUES (?, 'active')
    ON CONFLICT(code) DO UPDATE SET status = 'active', created_at = CURRENT_TIMESTAMP, finished_at = NULL
  `);
  const finishRoom = database.prepare(`
    UPDATE rooms SET status = 'finished', finished_at = CURRENT_TIMESTAMP WHERE code = ?
  `);
  const playerStats = database.prepare(`
    SELECT COUNT(*) AS runs, COALESCE(MAX(score), 0) AS best_score,
           COALESCE(SUM(kills), 0) AS total_kills, COALESCE(MAX(duration_ms), 0) AS longest_run_ms
    FROM runs WHERE player_id = ? AND mode = ?
  `);
  const recentRuns = database.prepare(`
    SELECT mode, score, kills, duration_ms, outcome, room_code, class_id, difficulty, created_at
    FROM runs WHERE player_id = ? ORDER BY id DESC LIMIT 8
  `);

  const UPGRADE_COSTS_ARR = [15, 30, 50, 80, 120];
  const selectResonance = database.prepare("SELECT amount FROM resonance WHERE player_id = ?");
  const upsertResonance = database.prepare(`INSERT INTO resonance (player_id, amount) VALUES (?, ?) ON CONFLICT(player_id) DO UPDATE SET amount = excluded.amount`);
  const selectUpgrades = database.prepare("SELECT upgrade_type, level FROM upgrades WHERE player_id = ?");
  const upsertUpgrade = database.prepare(`INSERT INTO upgrades (player_id, upgrade_type, level) VALUES (?, ?, ?) ON CONFLICT(player_id, upgrade_type) DO UPDATE SET level = excluded.level`);
  const selectSkillPoints = database.prepare("SELECT amount FROM skill_points WHERE player_id = ?");
  const upsertSkillPoints = database.prepare(`INSERT INTO skill_points (player_id, amount) VALUES (?, ?) ON CONFLICT(player_id) DO UPDATE SET amount = excluded.amount`);
  const selectOwnedMutations = database.prepare("SELECT mutation_id, level FROM owned_mutations WHERE player_id = ?");
  const upsertOwnedMutation = database.prepare(`INSERT INTO owned_mutations (player_id, mutation_id, level) VALUES (?, ?, ?) ON CONFLICT(player_id, mutation_id) DO UPDATE SET level = excluded.level`);
  const selectLoadout = database.prepare("SELECT slot, mutation_id FROM loadout WHERE player_id = ? ORDER BY slot");
  const upsertLoadoutSlot = database.prepare(`INSERT INTO loadout (player_id, slot, mutation_id) VALUES (?, ?, ?) ON CONFLICT(player_id, slot) DO UPDATE SET mutation_id = excluded.mutation_id`);
  const clearLoadout = database.prepare("DELETE FROM loadout WHERE player_id = ?");
  const selectPreferences = database.prepare("SELECT preferences_json FROM player_preferences WHERE player_id = ?");
  const upsertPreferences = database.prepare(`INSERT INTO player_preferences (player_id, preferences_json) VALUES (?, ?) ON CONFLICT(player_id) DO UPDATE SET preferences_json = excluded.preferences_json, updated_at = CURRENT_TIMESTAMP`);
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

  function getResonance(playerId) { const row = selectResonance.get(playerId); return row ? row.amount : 0; }
  function getUpgrades(playerId) {
    const rows = selectUpgrades.all(playerId);
    const result = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    for (const row of rows) result[row.upgrade_type] = row.level;
    return result;
  }

  function purchaseUpgrade(playerId, upgradeType) {
    if (!UPGRADE_TYPES.includes(upgradeType)) throw new Error("Tipo de upgrade inválido.");
    const current = getUpgrades(playerId);
    const level = current[upgradeType];
    if (level >= 5) throw new Error("Nível máximo atingido.");
    const cost = UPGRADE_COSTS_ARR[level];
    const resonance = getResonance(playerId);
    if (resonance < cost) throw new Error("Créditos insuficientes.");
    upsertResonance.run(playerId, resonance - cost);
    upsertUpgrade.run(playerId, upgradeType, level + 1);
    return { resonance: resonance - cost, upgrades: { ...current, [upgradeType]: level + 1 } };
  }

  function addResonance(playerId, amount) { const current = getResonance(playerId); upsertResonance.run(playerId, current + Math.max(0, Math.floor(amount))); }
  function addSkillPoints(playerId, amount) { const current = getSkillPoints(playerId); upsertSkillPoints.run(playerId, current + Math.max(0, Math.floor(amount))); }
  function getSkillPoints(playerId) { const row = selectSkillPoints.get(playerId); return row ? row.amount : 0; }
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
  function purchaseMutation(playerId, mutationId) {
    if (!MUTATION_IDS.includes(mutationId)) throw new Error("Bônus inválido.");
    const owned = getOwnedMutations(playerId);
    if (owned[mutationId]) throw new Error("Bônus já desbloqueado.");
    const index = MUTATION_IDS.indexOf(mutationId);
    const cost = MUTATION_COSTS[index];
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
    const index = MUTATION_IDS.indexOf(mutationId);
    const cost = MUTATION_UPGRADE_COSTS[index][level - 1];
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
    const deaths = Math.max(0, Math.floor(Number(run.deaths) || 0));
    const durationMs = Math.max(0, Math.floor(Number(run.durationMs) || 0));
    const outcome = String(run.outcome || "completed").slice(0, 24);
    const roomCode = mode === "multiplayer" ? sanitizeRoomCode(run.roomCode) || null : null;
    const bossDefeated = Boolean(run.bossDefeated);
    const classId = normalizeClassId(run.classId);
    const difficulty = ["easy", "normal", "hard"].includes(run.difficulty) ? run.difficulty : "normal";
    const victory = outcome === "victory" ? 1 : 0;
    const experience = Math.max(1, Math.floor(score * 0.35 + kills * 8 + victory * 20));
    const result = insertRun.run(player.id, mode, score, kills, deaths, durationMs, outcome, roomCode, classId, difficulty);
    upsertClassProgress.run(player.id, classId, experience, kills, victory);
    const progress = getClassProgress(player.id)[classId];
    const challenge = CLASS_CHALLENGES[classId];
    if (challenge && !progress.challengeClaimed && (progress[challenge.metric] || 0) >= challenge.target) {
      const claim = claimClassChallenge.run(player.id, classId);
      if (claim.changes > 0) { addResonance(player.id, challenge.resonance); addSkillPoints(player.id, challenge.skillPoints); }
    }
    if (mode === "solo") {
      const multiplier = Math.max(1, Math.min(1.05, Number(run.rewardMultiplier) || 1));
      const resonance = Math.ceil((Math.floor(score / 10) + kills * 2 + (bossDefeated ? 10 : 0)) * multiplier);
      const skillPoints = Math.ceil((Math.floor(score / 8) + Math.floor(kills * 1.5) + (bossDefeated ? 15 : 0)) * multiplier);
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
      upgradeCosts: UPGRADE_COSTS_ARR,
      skillPoints: getSkillPoints(player.id),
      ownedMutations: getOwnedMutations(player.id),
      loadout: getLoadout(player.id),
      mutationCosts: MUTATION_COSTS,
      mutationUpgradeCosts: MUTATION_UPGRADE_COSTS,
      mutationIds: MUTATION_IDS,
      preferences: getPreferences(player.id),
      classProgress: getClassProgress(player.id)
    };
  }

  return {
    path: databasePath,
    pool: null,
    createRoom(rawCode) { const code = sanitizeRoomCode(rawCode); if (!code) throw new Error("Código de sala inválido."); insertRoom.run(code); return Promise.resolve(code); },
    finishRoom(rawCode) { const code = sanitizeRoomCode(rawCode); if (code) finishRoom.run(code); return Promise.resolve(); },
    getProfile,
    saveRun(run) { return Promise.resolve(saveRun(run)); },
    savePreferences(rawName, preferences) { const player = getOrCreatePlayer(rawName); const sanitized = sanitizePreferences(preferences); upsertPreferences.run(player.id, JSON.stringify(sanitized)); return Promise.resolve(sanitized); },
    getUpgrades(rawName) { return Promise.resolve(getUpgrades(getOrCreatePlayer(rawName).id)); },
    purchaseUpgrade(rawName, upgradeType) { return Promise.resolve(purchaseUpgrade(getOrCreatePlayer(rawName).id, upgradeType)); },
    getSkillShop(rawName) {
      const player = getOrCreatePlayer(rawName);
      return Promise.resolve({
        skillPoints: getSkillPoints(player.id),
        ownedMutations: getOwnedMutations(player.id),
        loadout: getLoadout(player.id),
        mutationCosts: MUTATION_COSTS,
        mutationUpgradeCosts: MUTATION_UPGRADE_COSTS,
        mutationIds: MUTATION_IDS
      });
    },
    purchaseMutation(rawName, mutationId) { return Promise.resolve(purchaseMutation(getOrCreatePlayer(rawName).id, mutationId)); },
    upgradeMutation(rawName, mutationId) { return Promise.resolve(upgradeMutation(getOrCreatePlayer(rawName).id, mutationId)); },
    saveLoadout(rawName, slots) { return Promise.resolve(saveLoadout(getOrCreatePlayer(rawName).id, slots)); },
    getPlayerByToken() { return Promise.resolve(null); },
    getOrCreatePlayer(rawName) { return Promise.resolve(getOrCreatePlayer(rawName)); },
    close() { database.close(); }
  };
}

function createPostgresDatabase(databaseUrl) {
  const { Pool } = require("pg");
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000
  });

  async function getOrCreatePlayer(rawName) {
    const name = sanitizeName(rawName);
    const existing = await pool.query("SELECT id, display_name FROM players WHERE display_name = $1 COLLATE NOCASE", [name]);
    if (existing.rows.length) return existing.rows[0];

    const token = require("node:crypto").randomUUID();
    const result = await pool.query(
      `INSERT INTO players (session_token, display_name, is_guest) VALUES ($1, $2, true) RETURNING id, display_name`,
      [token, name]
    );
    const player = result.rows[0];

    await pool.query(
      `INSERT INTO progression (player_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [player.id]
    );

    return player;
  }

  async function getPlayerByToken(token) {
    if (!token) return null;
    const result = await pool.query(
      "SELECT id, display_name, is_guest FROM players WHERE session_token = $1",
      [token]
    );
    return result.rows[0] || null;
  }

  async function saveRun(run) {
    const player = await getOrCreatePlayer(run.name);
    const mode = run.mode === "multiplayer" ? "multiplayer" : "solo";
    const score = Math.max(0, Math.floor(Number(run.score) || 0));
    const kills = Math.max(0, Math.floor(Number(run.kills) || 0));
    const durationMs = Math.max(0, Math.floor(Number(run.durationMs) || 0));
    const outcome = String(run.outcome || "completed").slice(0, 24);
    const roomCode = mode === "multiplayer" ? sanitizeRoomCode(run.roomCode) || null : null;
    const classId = normalizeClassId(run.classId);
    const bossDefeated = Boolean(run.bossDefeated);
    const victory = outcome === "victory" ? 1 : 0;
    const experience = Math.max(1, Math.floor(score * 0.35 + kills * 8 + victory * 20));

    const result = await pool.query(
      `INSERT INTO match_results (room_code, player_id, class_id, score, kills, deaths, duration_ms, outcome)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
       ON CONFLICT (room_code, player_id) DO NOTHING
       RETURNING id`,
      [roomCode || `SOLO-${Date.now()}`, player.id, classId, score, kills, durationMs, outcome]
    );

    await pool.query(
      `INSERT INTO class_mastery (player_id, class_id, experience, runs, kills, victories)
       VALUES ($1, $2, $3, 1, $4, $5)
       ON CONFLICT (player_id, class_id) DO UPDATE SET
         experience = class_mastery.experience + excluded.experience,
         runs = class_mastery.runs + 1,
         kills = class_mastery.kills + excluded.kills,
         victories = class_mastery.victories + excluded.victories`,
      [player.id, classId, experience, kills, victory]
    );

    if (mode === "solo") {
      const multiplier = Math.max(1, Math.min(1.05, Number(run.rewardMultiplier) || 1));
      const resonance = Math.ceil((Math.floor(score / 10) + kills * 2 + (bossDefeated ? 10 : 0)) * multiplier);
      const skillPoints = Math.ceil((Math.floor(score / 8) + Math.floor(kills * 1.5) + (bossDefeated ? 15 : 0)) * multiplier);

      await pool.query(
        `INSERT INTO resonance (player_id, amount) VALUES ($1, $2)
         ON CONFLICT (player_id) DO UPDATE SET amount = resonance.amount + excluded.amount`,
        [player.id, resonance]
      );
      await pool.query(
        `INSERT INTO skill_points (player_id, amount) VALUES ($1, $2)
         ON CONFLICT (player_id) DO UPDATE SET amount = skill_points.amount + excluded.amount`,
        [player.id, skillPoints]
      );

      const challenge = CLASS_CHALLENGES[classId];
      if (challenge) {
        const progress = await pool.query(
          "SELECT experience, runs, kills, victories FROM class_mastery WHERE player_id = $1 AND class_id = $2",
          [player.id, classId]
        );
        if (progress.rows.length) {
          const p = progress.rows[0];
          if ((p[challenge.metric] || 0) >= challenge.target) {
            const claimed = await pool.query(
              "SELECT 1 FROM class_mastery WHERE player_id = $1 AND class_id = $2 AND challenge_claimed = true",
              [player.id, classId]
            );
            if (!claimed.rows.length) {
              await pool.query(
                "UPDATE class_mastery SET challenge_claimed = true WHERE player_id = $1 AND class_id = $2",
                [player.id, classId]
              );
              await pool.query(
                `INSERT INTO resonance (player_id, amount) VALUES ($1, $2)
                 ON CONFLICT (player_id) DO UPDATE SET amount = resonance.amount + excluded.amount`,
                [player.id, challenge.resonance]
              );
              await pool.query(
                `INSERT INTO skill_points (player_id, amount) VALUES ($1, $2)
                 ON CONFLICT (player_id) DO UPDATE SET amount = skill_points.amount + excluded.amount`,
                [player.id, challenge.skillPoints]
              );
            }
          }
        }
      }

      return { id: result.rows[0]?.id, playerId: player.id, resonance, skillPoints };
    }

    return { id: result.rows[0]?.id, playerId: player.id };
  }

  async function getProfile(rawName) {
    const player = await getOrCreatePlayer(rawName);

    const soloStats = await pool.query(`
      SELECT COUNT(*) AS runs, COALESCE(MAX(score), 0) AS best_score,
             COALESCE(SUM(kills), 0) AS total_kills, COALESCE(MAX(duration_ms), 0) AS longest_run_ms
      FROM match_results WHERE player_id = $1 AND outcome != 'multiplayer'
    `, [player.id]);

    const mpStats = await pool.query(`
      SELECT COUNT(*) AS runs, COALESCE(MAX(score), 0) AS best_score,
             COALESCE(SUM(kills), 0) AS total_kills, COALESCE(MAX(duration_ms), 0) AS longest_run_ms
      FROM match_results WHERE player_id = $1 AND room_code IS NOT NULL
    `, [player.id]);

    const recentRuns = await pool.query(`
      SELECT class_id, score, kills, duration_ms, outcome, room_code, created_at
      FROM match_results WHERE player_id = $1 ORDER BY created_at DESC LIMIT 8
    `, [player.id]);

    const resRow = await pool.query("SELECT amount FROM resonance WHERE player_id = $1", [player.id]);
    const spRow = await pool.query("SELECT amount FROM skill_points WHERE player_id = $1", [player.id]);
    const upgradesRows = await pool.query("SELECT upgrade_type, level FROM upgrades WHERE player_id = $1", [player.id]);
    const ownedRows = await pool.query("SELECT mutation_id, level FROM owned_mutations WHERE player_id = $1", [player.id]);
    const loadoutRows = await pool.query("SELECT slot, mutation_id FROM loadout WHERE player_id = $1 ORDER BY slot", [player.id]);
    const prefRow = await pool.query("SELECT preferences_json FROM player_preferences WHERE player_id = $1", [player.id]);
    const classRows = await pool.query("SELECT class_id, experience, runs, kills, victories, challenge_claimed FROM class_mastery WHERE player_id = $1", [player.id]);

    const upgrades = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    for (const row of upgradesRows.rows) upgrades[row.upgrade_type] = row.level;

    const ownedMutations = {};
    for (const row of ownedRows.rows) ownedMutations[row.mutation_id] = row.level;

    const loadout = [null, null, null, null];
    for (const row of loadoutRows.rows) loadout[row.slot] = row.mutation_id;

    const classProgress = Object.fromEntries(CLASS_IDS.map((id) => [id, { experience: 0, runs: 0, kills: 0, victories: 0, challengeClaimed: false }]));
    for (const row of classRows.rows) {
      classProgress[row.class_id] = {
        experience: row.experience, runs: row.runs, kills: row.kills,
        victories: row.victories, challengeClaimed: Boolean(row.challenge_claimed)
      };
    }

    let preferences = null;
    if (prefRow.rows.length) {
      try { preferences = JSON.parse(prefRow.rows[0].preferences_json); } catch { preferences = null; }
    }

    return {
      player,
      solo: soloStats.rows[0],
      multiplayer: mpStats.rows[0],
      recentRuns: recentRuns.rows,
      resonance: resRow.rows[0]?.amount || 0,
      upgrades,
      upgradeCosts: UPGRADE_COSTS,
      skillPoints: spRow.rows[0]?.amount || 0,
      ownedMutations,
      loadout,
      mutationCosts: MUTATION_COSTS,
      mutationUpgradeCosts: MUTATION_UPGRADE_COSTS,
      mutationIds: MUTATION_IDS,
      preferences,
      classProgress
    };
  }

  async function createRoom(rawCode) {
    const code = sanitizeRoomCode(rawCode);
    if (!code) throw new Error("Código de sala inválido.");
    await pool.query(
      `INSERT INTO rooms (code, status) VALUES ($1, 'active')
       ON CONFLICT (code) DO UPDATE SET status = 'active', created_at = now(), finished_at = NULL`,
      [code]
    );
    return code;
  }

  async function finishRoom(rawCode) {
    const code = sanitizeRoomCode(rawCode);
    if (code) await pool.query("UPDATE rooms SET status = 'finished', finished_at = now() WHERE code = $1", [code]);
  }

  async function savePreferences(rawName, preferences) {
    const player = await getOrCreatePlayer(rawName);
    const sanitized = sanitizePreferences(preferences);
    await pool.query(
      `INSERT INTO player_preferences (player_id, preferences_json) VALUES ($1, $2)
       ON CONFLICT (player_id) DO UPDATE SET preferences_json = excluded.preferences_json, updated_at = now()`,
      [player.id, JSON.stringify(sanitized)]
    );
    return sanitized;
  }

  async function getUpgrades(rawName) {
    const player = await getOrCreatePlayer(rawName);
    const rows = await pool.query("SELECT upgrade_type, level FROM upgrades WHERE player_id = $1", [player.id]);
    const result = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    for (const row of rows.rows) result[row.upgrade_type] = row.level;
    return result;
  }

  async function purchaseUpgrade(rawName, upgradeType) {
    if (!UPGRADE_TYPES.includes(upgradeType)) throw new Error("Tipo de upgrade inválido.");
    const player = await getOrCreatePlayer(rawName);
    const current = await getUpgrades(rawName);
    const level = current[upgradeType];
    if (level >= 5) throw new Error("Nível máximo atingido.");
    const cost = UPGRADE_COSTS[level];
    const resRow = await pool.query("SELECT amount FROM resonance WHERE player_id = $1", [player.id]);
    const resonance = resRow.rows[0]?.amount || 0;
    if (resonance < cost) throw new Error("Créditos insuficientes.");

    await pool.query("UPDATE resonance SET amount = amount - $1 WHERE player_id = $2", [cost, player.id]);
    await pool.query(
      `INSERT INTO upgrades (player_id, upgrade_type, level) VALUES ($1, $2, $3)
       ON CONFLICT (player_id, upgrade_type) DO UPDATE SET level = excluded.level`,
      [player.id, upgradeType, level + 1]
    );
    return { resonance: resonance - cost, upgrades: { ...current, [upgradeType]: level + 1 } };
  }

  async function getSkillShop(rawName) {
    const player = await getOrCreatePlayer(rawName);
    const spRow = await pool.query("SELECT amount FROM skill_points WHERE player_id = $1", [player.id]);
    const ownedRows = await pool.query("SELECT mutation_id, level FROM owned_mutations WHERE player_id = $1", [player.id]);
    const loadoutRows = await pool.query("SELECT slot, mutation_id FROM loadout WHERE player_id = $1 ORDER BY slot", [player.id]);
    const owned = {};
    for (const row of ownedRows.rows) owned[row.mutation_id] = row.level;
    const loadout = [null, null, null, null];
    for (const row of loadoutRows.rows) loadout[row.slot] = row.mutation_id;
    return {
      skillPoints: spRow.rows[0]?.amount || 0,
      ownedMutations: owned,
      loadout,
      mutationCosts: MUTATION_COSTS,
      mutationUpgradeCosts: MUTATION_UPGRADE_COSTS,
      mutationIds: MUTATION_IDS
    };
  }

  async function purchaseMutation(rawName, mutationId) {
    if (!MUTATION_IDS.includes(mutationId)) throw new Error("Bônus inválido.");
    const player = await getOrCreatePlayer(rawName);
    const owned = await getSkillShop(rawName);
    if (owned.ownedMutations[mutationId]) throw new Error("Bônus já desbloqueado.");
    const index = MUTATION_IDS.indexOf(mutationId);
    const cost = MUTATION_COSTS[index];
    if (owned.skillPoints < cost) throw new Error("Pontos de habilidade insuficientes.");
    await pool.query("UPDATE skill_points SET amount = amount - $1 WHERE player_id = $2", [cost, player.id]);
    await pool.query(
      `INSERT INTO owned_mutations (player_id, mutation_id, level) VALUES ($1, $2, 1)
       ON CONFLICT (player_id, mutation_id) DO UPDATE SET level = excluded.level`,
      [player.id, mutationId]
    );
    return { skillPoints: owned.skillPoints - cost, mutations: { ...owned.ownedMutations, [mutationId]: 1 } };
  }

  async function upgradeMutation(rawName, mutationId) {
    if (!MUTATION_IDS.includes(mutationId)) throw new Error("Bônus inválido.");
    const player = await getOrCreatePlayer(rawName);
    const shop = await getSkillShop(rawName);
    const level = shop.ownedMutations[mutationId];
    if (!level || level >= 3) throw new Error("Nível máximo atingido.");
    const index = MUTATION_IDS.indexOf(mutationId);
    const cost = MUTATION_UPGRADE_COSTS[index][level - 1];
    if (shop.skillPoints < cost) throw new Error("Pontos de habilidade insuficientes.");
    await pool.query("UPDATE skill_points SET amount = amount - $1 WHERE player_id = $2", [cost, player.id]);
    await pool.query(
      `INSERT INTO owned_mutations (player_id, mutation_id, level) VALUES ($1, $2, $3)
       ON CONFLICT (player_id, mutation_id) DO UPDATE SET level = excluded.level`,
      [player.id, mutationId, level + 1]
    );
    return { skillPoints: shop.skillPoints - cost, mutations: { ...shop.ownedMutations, [mutationId]: level + 1 } };
  }

  async function saveLoadout(rawName, slots) {
    if (!Array.isArray(slots) || slots.length !== MAX_LOADOUT_SLOTS) throw new Error("Seleção de bônus inválida.");
    const player = await getOrCreatePlayer(rawName);
    const shop = await getSkillShop(rawName);
    await pool.query("DELETE FROM loadout WHERE player_id = $1", [player.id]);
    for (let i = 0; i < MAX_LOADOUT_SLOTS; i++) {
      const mutationId = slots[i] || null;
      if (mutationId) {
        if (!MUTATION_IDS.includes(mutationId)) throw new Error(`Bônus inválido: ${mutationId}`);
        if (!shop.ownedMutations[mutationId]) throw new Error(`Bônus não desbloqueado: ${mutationId}`);
      }
      await pool.query(
        "INSERT INTO loadout (player_id, slot, mutation_id) VALUES ($1, $2, $3)",
        [player.id, i, mutationId]
      );
    }
    const result = await pool.query("SELECT slot, mutation_id FROM loadout WHERE player_id = $1 ORDER BY slot", [player.id]);
    const loadout = [null, null, null, null];
    for (const row of result.rows) loadout[row.slot] = row.mutation_id;
    return loadout;
  }

  function sanitizePreferences(value = {}) {
    const classId = normalizeClassId(value.classId);
    const modes = ["solo", "multiplayer", "training"];
    const difficulties = ["easy", "normal", "hard"];
    const safeSettings = {};
    const settings = value.settings && typeof value.settings === "object" ? value.settings : {};
    for (const [key, setting] of Object.entries(settings).slice(0, 40)) {
      if (/^[a-zA-Z][a-zA-Z0-9]{0,30}$/.test(key) && ["string", "number", "boolean"].includes(typeof setting))
        safeSettings[key] = typeof setting === "string" ? setting.slice(0, 48) : setting;
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

  return {
    pool,
    createRoom,
    finishRoom,
    getProfile,
    saveRun,
    savePreferences,
    getUpgrades,
    purchaseUpgrade,
    getSkillShop,
    purchaseMutation,
    upgradeMutation,
    saveLoadout,
    getPlayerByToken,
    getOrCreatePlayer,
    async close() {
      await pool.end();
    }
  };
}

module.exports = { createDatabase };
