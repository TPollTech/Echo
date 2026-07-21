"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createDatabase } = require("../server/database.js");
const { ArenaRoom, RoomManager, constants } = require("../server/multiplayer.js");

function fakeSocket() {
  return { readyState: 0, sent: [], send(message) { this.sent.push(JSON.parse(message)); } };
}

test("sala autoritativa move, projeta e aplica dano sem aceitar resultado do cliente", () => {
  const database = createDatabase({ path: ":memory:" });
  try {
    const room = new ArenaRoom("TEST22", database);
    const attacker = room.addPlayer(fakeSocket(), "AION");
    const target = room.addPlayer(fakeSocket(), "KORA");
    attacker.x = 1000;
    attacker.y = 1000;
    attacker.targetX = 1300;
    attacker.targetY = 1000;
    target.x = 1150;
    target.y = 1000;
    target.hitTimer = 0;

    room.beginPhase(attacker);
    attacker.phase.x = 1300;
    attacker.phase.y = 1000;
    attacker.phase.points = [{ x: 1000, y: 1000 }, { x: 1300, y: 1000 }];
    attacker.phase.distance = 300;
    room.endPhase(attacker);

    assert.equal(target.health, 66);
    assert.equal(attacker.phasing, false);
    assert.equal(room.ribbons.length, 1);
  } finally {
    database.close();
  }
});

test("gerenciador cria códigos únicos e publica snapshot individual", () => {
  const database = createDatabase({ path: ":memory:" });
  const manager = new RoomManager(database, { autoStart: false });
  try {
    const room = manager.createRoom();
    const socket = fakeSocket();
    socket.readyState = 1;
    const joined = manager.join(socket, room.code, "Viajante");
    assert.equal(joined.room.code.length, 6);
    assert.equal(socket.sent[0].type, "joined");
    assert.equal(socket.sent[1].type, "snapshot");
    assert.equal(socket.sent[1].selfId, joined.player.id);
    assert.ok(socket.sent[1].players.length >= 3);
  } finally {
    manager.stop();
    database.close();
  }
});

test("fim da partida publica classificação e persiste o resultado multiplayer", () => {
  const database = createDatabase({ path: ":memory:" });
  try {
    const room = new ArenaRoom("END222", database);
    const socket = fakeSocket();
    socket.readyState = 1;
    const player = room.addPlayer(socket, "Soma");
    player.score = 77;
    player.kills = 2;
    room.elapsed = 95;
    room.finish();
    assert.equal(room.status, "finished");
    assert.ok(socket.sent.some((message) => message.type === "match_end"));
    const profile = database.getProfile("Soma");
    assert.equal(profile.multiplayer.runs, 1);
    assert.equal(profile.multiplayer.best_score, 77);
    assert.equal(profile.multiplayer.total_kills, 2);
  } finally {
    database.close();
  }
});

test("snapshot frequente usa deltas pequenos e o protocolo mede ping", () => {
  const database = createDatabase({ path: ":memory:" });
  const manager = new RoomManager(database, { autoStart: false });
  try {
    const room = manager.createRoom();
    const socket = fakeSocket();
    socket.readyState = 1;
    socket.bufferedAmount = 0;
    const { player } = manager.join(socket, room.code, "Rede");
    const full = room.snapshotFor(player.id);
    const steady = room.snapshotFor(player.id, { moteRevision: full.moteRevision });
    assert.equal(constants.SNAPSHOT_RATE, 20);
    assert.ok(Buffer.byteLength(JSON.stringify(steady)) < Buffer.byteLength(JSON.stringify(full)) * 0.2);
    assert.deepEqual(steady.moteChanges, []);

    const collected = room.motes[0];
    player.x = collected.x; player.y = collected.y;
    room.collectMotes(player, player);
    const changed = room.snapshotFor(player.id, { moteRevision: full.moteRevision });
    assert.equal(changed.motes, undefined);
    assert.equal(changed.moteChanges.length, 1);

    manager.handleMessage(socket, { type: "ping", clientTime: 123 });
    const pong = socket.sent.at(-1);
    assert.equal(pong.type, "pong");
    assert.equal(pong.clientTime, 123);
    assert.ok(Number.isFinite(pong.serverTime));
  } finally {
    manager.stop();
    database.close();
  }
});
