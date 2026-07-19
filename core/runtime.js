(function (root) {
  "use strict";

  const Events = root.EchoEvents;
  const Random = root.EchoRandom;
  if (!Events || !Random) throw new Error("Os módulos fundamentais do ECHO não foram carregados.");

  const STORAGE_KEY = "echo.runSeed";
  const params = new URLSearchParams(root.location.search);
  const requestedSeed = params.get("seed");
  const storedSeed = root.sessionStorage.getItem(STORAGE_KEY);
  let seed = Random.normalizeSeed(requestedSeed || storedSeed || Random.createSeed());
  let randomHandle = Random.installGlobalRandom(seed, root);
  const events = Events.createEventBus();

  root.sessionStorage.setItem(STORAGE_KEY, seed);

  function setSeed(nextSeed, options = {}) {
    const normalized = Random.normalizeSeed(nextSeed || Random.createSeed());
    randomHandle.restore();
    seed = normalized;
    randomHandle = Random.installGlobalRandom(seed, root);
    root.sessionStorage.setItem(STORAGE_KEY, seed);
    root.EchoCore.seed = seed;
    events.emit("run:seed-changed", { seed });
    if (options.reload) {
      const url = new URL(root.location.href);
      url.searchParams.set("seed", seed);
      root.location.assign(url.toString());
    }
    return seed;
  }

  function shareUrl() {
    const url = new URL(root.location.href);
    url.searchParams.set("seed", seed);
    return url.toString();
  }

  root.EchoCore = {
    version: "0.4.0",
    seed,
    events,
    random: Random,
    setSeed,
    shareUrl
  };

  events.emit("runtime:ready", { version: root.EchoCore.version, seed });
})(window);
