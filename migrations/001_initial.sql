-- ECHO Arena — PostgreSQL Schema v1
-- Migration 001: Initial schema

BEGIN;

-- Players (guest + registered)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_guest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_token);

-- Account progression
CREATE TABLE IF NOT EXISTS progression (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  account_level INTEGER NOT NULL DEFAULT 1 CHECK (account_level >= 1),
  xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  ranking_mmr INTEGER NOT NULL DEFAULT 1000 CHECK (ranking_mmr >= 0),
  ranking_division TEXT NOT NULL DEFAULT 'bronze'
);

-- Class mastery
CREATE TABLE IF NOT EXISTS class_mastery (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL,
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0),
  runs INTEGER NOT NULL DEFAULT 0 CHECK (runs >= 0),
  kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0),
  victories INTEGER NOT NULL DEFAULT 0 CHECK (victories >= 0),
  PRIMARY KEY (player_id, class_id)
);

-- Match results (idempotent via UNIQUE room_code + player_id)
CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL DEFAULT 'cutter',
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  kills INTEGER NOT NULL DEFAULT 0 CHECK (kills >= 0),
  deaths INTEGER NOT NULL DEFAULT 0 CHECK (deaths >= 0),
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  outcome TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_code, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_results_player ON match_results(player_id, created_at DESC);

-- Rooms (history)
CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  created_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Unlocks (skins, effects, titles, etc.)
CREATE TABLE IF NOT EXISTS unlocks (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (player_id, item_type, item_id)
);

-- Player preferences
CREATE TABLE IF NOT EXISTS player_preferences (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  preferences_json TEXT NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Resonance (solo currency)
CREATE TABLE IF NOT EXISTS resonance (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0)
);

-- Skill points
CREATE TABLE IF NOT EXISTS skill_points (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 0 CHECK (amount >= 0)
);

-- Owned mutations
CREATE TABLE IF NOT EXISTS owned_mutations (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mutation_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  PRIMARY KEY (player_id, mutation_id)
);

-- Loadout
CREATE TABLE IF NOT EXISTS loadout (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 3),
  mutation_id TEXT,
  PRIMARY KEY (player_id, slot)
);

-- Permanent upgrades
CREATE TABLE IF NOT EXISTS upgrades (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  upgrade_type TEXT NOT NULL CHECK (upgrade_type IN ('core','charge','calibration','collection','regeneration')),
  level INTEGER NOT NULL DEFAULT 0 CHECK (level BETWEEN 0 AND 5),
  PRIMARY KEY (player_id, upgrade_type)
);

-- Abuse tracking
CREATE TABLE IF NOT EXISTS abuse_log (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  ip_address INET,
  reason TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abuse_log_ip ON abuse_log(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abuse_log_player ON abuse_log(player_id, created_at DESC);

COMMIT;
