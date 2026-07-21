"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createDatabase } = require("../server/database.js");

test("SQLite local persiste runs solo e multiplayer no mesmo perfil", () => {
  const database = createDatabase({ path: ":memory:" });
  try {
    database.createRoom("ABC234");
    database.saveRun({ name: "Nara", mode: "solo", score: 420, kills: 8, durationMs: 91_000, outcome: "victory" });
    database.saveRun({ name: "nara", mode: "multiplayer", score: 160, kills: 3, durationMs: 45_000, outcome: "defeat", roomCode: "ABC234" });
    const profile = database.getProfile("NARA");
    assert.equal(profile.player.name, "Nara");
    assert.equal(profile.solo.runs, 1);
    assert.equal(profile.solo.best_score, 420);
    assert.equal(profile.multiplayer.total_kills, 3);
    assert.equal(profile.recentRuns.length, 2);
    assert.equal(profile.recentRuns[0].room_code, "ABC234");
    const preferences = database.savePreferences("Nara", {
      classId: "marksman",
      skinId: "roxo-neon",
      skillIds: ["triple-shot", "teleport"],
      mode: "multiplayer",
      difficulty: "hard",
      settings: { aimAssist: 35, vibration: false }
    });
    assert.equal(preferences.classId, "marksman");
    const updated = database.getProfile("Nara");
    assert.equal(updated.preferences.skinId, "roxo-neon");
    assert.equal(updated.preferences.settings.aimAssist, 35);
    assert.equal(updated.classProgress.cutter.runs, 2);
    assert.ok(updated.classProgress.cutter.experience > 0);
  } finally {
    database.close();
  }
});

test("conquista de classe entrega a recompensa uma única vez", () => {
  const database = createDatabase({ path: ":memory:" });
  try {
    database.saveRun({ name: "Conquista", mode: "multiplayer", score: 0, kills: 30, durationMs: 1_000, outcome: "defeat", classId: "cutter" });
    const claimed = database.getProfile("Conquista");
    assert.equal(claimed.classProgress.cutter.challengeClaimed, true);
    assert.equal(claimed.resonance, 20);
    assert.equal(claimed.skillPoints, 8);

    database.saveRun({ name: "Conquista", mode: "multiplayer", score: 0, kills: 1, durationMs: 1_000, outcome: "defeat", classId: "cutter" });
    const repeated = database.getProfile("Conquista");
    assert.equal(repeated.resonance, 20);
    assert.equal(repeated.skillPoints, 8);
  } finally {
    database.close();
  }
});
