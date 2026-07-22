"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "migrations");

async function runMigrations(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    const applied = new Set(
      (await client.query("SELECT name FROM _migrations ORDER BY id")).rows.map((r) => r.name)
    );

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
      console.log(`Aplicando migration: ${file}`);
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      console.log(`  ✓ ${file} aplicada.`);
    }

    await client.query("COMMIT");
    console.log("Migrations concluídas.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function parseSqliteDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  return new Date(dateStr.replace(" ", "T") + "Z").toISOString();
}

async function migrateData(sqlitePath, pool) {
  const { DatabaseSync } = require("node:sqlite");
  const sqlite = new DatabaseSync(sqlitePath, { readonly: true });
  const client = await pool.connect();

  try {
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r) => r.name);
    console.log(`Tabelas SQLite encontradas: ${tables.join(", ")}`);

    if (tables.includes("players")) {
      const players = sqlite.prepare("SELECT * FROM players").all();
      console.log(`Migrando ${players.length} jogadores...`);

      for (const row of players) {
        const token = randomUUID();
        await client.query(
          `INSERT INTO players (id, session_token, display_name, is_guest, created_at, last_seen_at)
           VALUES ($1, $2, $3, true, $4, $5)
           ON CONFLICT (session_token) DO NOTHING`,
          [randomUUID(), token, row.name, parseSqliteDate(row.created_at), parseSqliteDate(row.last_seen_at)]
        );
      }
    }

    if (tables.includes("runs")) {
      const runs = sqlite.prepare("SELECT * FROM runs").all();
      console.log(`Migrando ${runs.length} runs...`);

      for (const row of runs) {
        const playerRow = sqlite.prepare("SELECT id FROM players WHERE name = ?").get(row.player_id
          ? sqlite.prepare("SELECT name FROM players WHERE id = ?").get(row.player_id)?.name
          : null
        );
        if (!playerRow) continue;

        const playerResult = await client.query("SELECT id FROM players WHERE display_name = $1", [
          sqlite.prepare("SELECT name FROM players WHERE id = ?").get(row.player_id)?.name
        ]);
        if (!playerResult.rows.length) continue;
        const playerId = playerResult.rows[0].id;

        await client.query(
          `INSERT INTO match_results (room_code, player_id, class_id, score, kills, deaths, duration_ms, outcome, created_at)
           VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8)
           ON CONFLICT (room_code, player_id) DO NOTHING`,
          [row.room_code || `LEGACY-${row.id}`, playerId, row.class_id || "cutter",
           row.score, row.kills, row.duration_ms, row.outcome || "completed", parseSqliteDate(row.created_at)]
        );
      }
    }

    console.log("Migração de dados concluída.");
  } finally {
    client.release();
    sqlite.close();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Defina DATABASE_URL antes de rodar a migração.");
    process.exit(1);
  }

  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  const args = process.argv.slice(2);
  const sqliteArg = args.find((a) => a.endsWith(".sqlite"));
  const migrateDataOnly = args.includes("--data-only");

  if (!migrateDataOnly) {
    await runMigrations(pool);
  }

  if (sqliteArg) {
    const sqlitePath = path.resolve(ROOT, sqliteArg);
    if (!fs.existsSync(sqlitePath)) {
      console.error(`Arquivo SQLite não encontrado: ${sqlitePath}`);
      process.exit(1);
    }
    await migrateData(sqlitePath, pool);
  }

  await pool.end();
  console.log("Pronto.");
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { runMigrations, migrateData };
