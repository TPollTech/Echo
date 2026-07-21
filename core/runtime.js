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
    version: "0.6.0",
    seed,
    events,
    random: Random,
    setSeed,
    shareUrl
  };

  function ensureHeadElement(selector, create) {
    if (!root.document || root.document.head.querySelector(selector)) return;
    root.document.head.append(create());
  }

  function preparePwaShell() {
    if (!root.document) return;

    ensureHeadElement('link[rel="manifest"]', () => {
      const link = root.document.createElement("link");
      link.rel = "manifest";
      link.href = "./assets/manifest.json";
      return link;
    });

    ensureHeadElement('link[data-echo-mobile-ui]', () => {
      const link = root.document.createElement("link");
      link.rel = "stylesheet";
      link.href = "./assets/mobile-ui.css";
      link.dataset.echoMobileUi = "1";
      return link;
    });

    ensureHeadElement('link[rel="apple-touch-icon"]', () => {
      const link = root.document.createElement("link");
      link.rel = "apple-touch-icon";
      link.href = "./assets/icons/icon-192.svg";
      return link;
    });

    const metaDefinitions = [
      ["mobile-web-app-capable", "yes"],
      ["apple-mobile-web-app-capable", "yes"],
      ["apple-mobile-web-app-status-bar-style", "black-translucent"],
      ["apple-mobile-web-app-title", "ECHO"]
    ];
    for (const [name, content] of metaDefinitions) {
      ensureHeadElement(`meta[name="${name}"]`, () => {
        const meta = root.document.createElement("meta");
        meta.name = name;
        meta.content = content;
        return meta;
      });
    }

    if ("serviceWorker" in root.navigator && root.location.protocol !== "file:") {
      root.addEventListener("load", () => {
        root.navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
          .then((registration) => {
            if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
          })
          .catch(() => {
            events.emit("pwa:unavailable", { reason: "service-worker-registration" });
          });
      }, { once: true });
    }
  }

  function loadCombatIdentity() {
    if (!root.document) return;
    const sources = [
      "./assets/mobile-ux.js",
      "./combat/enemy-contracts.js",
      "./combat/threat-director.js",
      "./ui/accessibility.js",
      "./combat/runtime.js"
    ];
    if (root.document.readyState === "loading") {
      root.document.write(sources.map((src) => `<script src="${src}"><\/script>`).join(""));
      return;
    }
    for (const src of sources) {
      const script = root.document.createElement("script");
      script.src = src;
      script.async = false;
      root.document.head.append(script);
    }
  }

  preparePwaShell();
  loadCombatIdentity();
  events.emit("runtime:ready", { version: root.EchoCore.version, seed });
})(window);
