(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EchoEvents = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function assertEventName(eventName) {
    if (typeof eventName !== "string" || !eventName.trim()) {
      throw new TypeError("O nome do evento precisa ser uma string não vazia.");
    }
    return eventName.trim();
  }

  function createEventBus() {
    const listeners = new Map();

    function on(eventName, listener) {
      const name = assertEventName(eventName);
      if (typeof listener !== "function") throw new TypeError("O listener precisa ser uma função.");
      const bucket = listeners.get(name) || new Set();
      bucket.add(listener);
      listeners.set(name, bucket);
      return () => off(name, listener);
    }

    function once(eventName, listener) {
      let unsubscribe = null;
      unsubscribe = on(eventName, (payload) => {
        unsubscribe();
        listener(payload);
      });
      return unsubscribe;
    }

    function off(eventName, listener) {
      const name = assertEventName(eventName);
      const bucket = listeners.get(name);
      if (!bucket) return false;
      const removed = bucket.delete(listener);
      if (bucket.size === 0) listeners.delete(name);
      return removed;
    }

    function emit(eventName, payload) {
      const name = assertEventName(eventName);
      const direct = listeners.get(name) || new Set();
      const wildcard = listeners.get("*") || new Set();
      if (direct.size === 0 && wildcard.size === 0) return 0;
      let called = 0;
      for (const listener of [...direct]) {
        try { listener(payload); } catch (error) { queueMicrotask(() => { throw error; }); }
        called += 1;
      }
      for (const listener of [...wildcard]) {
        try { listener({ eventName: name, payload }); } catch (error) { queueMicrotask(() => { throw error; }); }
        called += 1;
      }
      return called;
    }

    function clear(eventName) {
      if (typeof eventName === "undefined") {
        listeners.clear();
        return;
      }
      listeners.delete(assertEventName(eventName));
    }

    function listenerCount(eventName) {
      return listeners.get(assertEventName(eventName))?.size || 0;
    }

    return Object.freeze({ on, once, off, emit, clear, listenerCount });
  }

  return Object.freeze({ createEventBus });
});
