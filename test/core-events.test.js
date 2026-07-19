"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../core/events.js");

test("event bus publica e remove listeners", () => {
  const events = createEventBus();
  const received = [];
  const unsubscribe = events.on("run:started", (payload) => received.push(payload.seed));

  assert.equal(events.emit("run:started", { seed: "ECHO-TEST" }), 1);
  unsubscribe();
  assert.equal(events.emit("run:started", { seed: "IGNORED" }), 0);
  assert.deepEqual(received, ["ECHO-TEST"]);
});

test("event bus executa once apenas uma vez", () => {
  const events = createEventBus();
  let count = 0;
  events.once("boss:defeated", () => { count += 1; });
  events.emit("boss:defeated");
  events.emit("boss:defeated");
  assert.equal(count, 1);
});

test("listener curinga recebe nome e payload", () => {
  const events = createEventBus();
  let captured = null;
  events.on("*", (event) => { captured = event; });
  events.emit("mutation:selected", { id: "blade" });
  assert.deepEqual(captured, { eventName: "mutation:selected", payload: { id: "blade" } });
});
