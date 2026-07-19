"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const WebSocket = require("ws");
const { createEchoServer } = require("../server/index.js");

test("HTTP, criação de sala e handshake WebSocket funcionam juntos", async () => {
  const app = createEchoServer({ databasePath: ":memory:", port: 0, host: "127.0.0.1" });
  const address = await app.start(0, "127.0.0.1");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthResponse.status, 200);
    assert.equal((await healthResponse.json()).ok, true);

    const privateDatabaseResponse = await fetch(`${baseUrl}/data/echo.sqlite`);
    assert.equal(privateDatabaseResponse.status, 404);

    const privateServerResponse = await fetch(`${baseUrl}/server/index.js`);
    assert.equal(privateServerResponse.status, 404);

    const roomResponse = await fetch(`${baseUrl}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Íris" })
    });
    assert.equal(roomResponse.status, 201);
    const roomPayload = await roomResponse.json();
    assert.equal(roomPayload.room.code.length, 6);

    const joined = await new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
      const messages = [];
      socket.on("open", () => socket.send(JSON.stringify({ type: "join", roomCode: roomPayload.room.code, name: "Íris" })));
      socket.on("message", (raw) => {
        messages.push(JSON.parse(raw.toString("utf8")));
        if (messages.some((message) => message.type === "joined") && messages.some((message) => message.type === "snapshot")) {
          socket.close();
          resolve(messages);
        }
      });
      socket.on("error", reject);
    });
    assert.ok(joined.some((message) => message.type === "joined"));
    assert.ok(joined.some((message) => message.type === "snapshot"));
  } finally {
    await app.close();
  }
});
