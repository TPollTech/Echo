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
  } finally {
    database.close();
  }
});
