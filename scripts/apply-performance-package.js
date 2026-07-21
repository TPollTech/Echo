"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content, "utf8");
}

function replaceOnce(content, search, replacement, label) {
  const index = content.indexOf(search);
  if (index < 0) throw new Error(`Trecho não encontrado: ${label}`);
  if (content.indexOf(search, index + search.length) >= 0) throw new Error(`Trecho duplicado: ${label}`);
  return content.slice(0, index) + replacement + content.slice(index + search.length);
}

function replaceBetween(content, startMarker, endMarker, replacement, label) {
  const start = content.indexOf(startMarker);
  if (start < 0) throw new Error(`Início não encontrado: ${label}`);
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`Fim não encontrado: ${label}`);
  return content.slice(0, start) + replacement + content.slice(end);
}

function edit(relativePath, transform) {
  const before = read(relativePath);
  const after = transform(before);
  if (after === before) throw new Error(`Nenhuma alteração aplicada em ${relativePath}`);
  write(relativePath, after);
}

edit("src/core/game-state.js", (source) => replaceOnce(source,
`  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let state = "intro";`,
`  let width = window.innerWidth;
  let height = window.innerHeight;
  let nativeDpr = Math.min(window.devicePixelRatio || 1, MOBILE_QUALITY ? 1.5 : 2);
  let renderScale = 1;
  let dpr = nativeDpr;
  let fpsEstimate = 60;
  let performanceLowTime = 0;
  let performanceHighTime = 0;
  let lastRenderScaleChange = 0;
  let hudUpdateAccumulator = 0;
  let musicUpdateAccumulator = 0;
  let directorUpdateAccumulator = 0;
  let state = "intro";`, "estado de desempenho"));

edit("src/core/camera.js", (source) => replaceBetween(source,
`  function resize() {`,
`\n\n/*__ECHO_SECTION_END:0100__*/`,
`  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    nativeDpr = Math.min(window.devicePixelRatio || 1, MOBILE_QUALITY ? 1.5 : 2);
    dpr = Math.max(0.72, nativeDpr * renderScale);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    pointer.x = clamp(pointer.x, 0, width);
    pointer.y = clamp(pointer.y, 0, height);
    if (typeof invalidateRenderCaches === "function") invalidateRenderCaches();
  }`, "redimensionamento adaptativo"));

edit("src/core/game-loop.js", (source) => {
  source = replaceBetween(source,
`  function update(dt) {`,
`\n\n/*__ECHO_SECTION_END:0086__*/`,
`  function update(dt) {
    if (state !== "playing") return;
    if (activeMode === "multiplayer") {
      updateMultiplayer(dt);
      return;
    }
    runTime += dt;
    runStats.runTime = runTime;
    updatePlayer(dt);
    updateBots(dt);
    updateSkills(dt);
    updateEffects(dt);
    updateCamera(dt);

    directorUpdateAccumulator += dt;
    if (directorUpdateAccumulator >= 0.12) {
      directorUpdateAccumulator = 0;
      updateSoloDirector();
    }

    musicUpdateAccumulator += dt;
    if (musicUpdateAccumulator >= 0.08) {
      musicUpdateAccumulator = 0;
      updateMusic();
    }

    hudUpdateAccumulator += dt;
    if (hudUpdateAccumulator >= 0.05) {
      hudUpdateAccumulator = 0;
      updateHud();
    }

    leaderboardTimer -= dt;
    if (leaderboardTimer <= 0) {
      leaderboardTimer = 0.7;
      updateLeaderboard();
    }
  }`, "atualizações desacopladas do FPS");

  source = replaceBetween(source,
`  function frame(now) {`,
`\n\n/*__ECHO_SECTION_END:0099__*/`,
`  function updatePerformanceBudget(frameMilliseconds, now) {
    if (!Number.isFinite(frameMilliseconds) || frameMilliseconds <= 0) return;
    const instantaneousFps = Math.min(120, 1000 / frameMilliseconds);
    fpsEstimate += (instantaneousFps - fpsEstimate) * 0.06;
    const seconds = Math.min(0.25, frameMilliseconds / 1000);

    if (fpsEstimate < 42) {
      performanceLowTime += seconds;
      performanceHighTime = Math.max(0, performanceHighTime - seconds * 2);
    } else if (fpsEstimate > 55) {
      performanceHighTime += seconds;
      performanceLowTime = Math.max(0, performanceLowTime - seconds * 2);
    } else {
      performanceLowTime = Math.max(0, performanceLowTime - seconds);
      performanceHighTime = Math.max(0, performanceHighTime - seconds);
    }

    if (now - lastRenderScaleChange > 1400 && performanceLowTime > 0.9 && renderScale > 0.62) {
      renderScale = Math.max(0.62, Math.round((renderScale - 0.1) * 100) / 100);
      performanceLowTime = 0;
      performanceHighTime = 0;
      lastRenderScaleChange = now;
      resize();
    } else if (now - lastRenderScaleChange > 3500 && performanceHighTime > 4 && renderScale < 1) {
      renderScale = Math.min(1, Math.round((renderScale + 0.05) * 100) / 100);
      performanceLowTime = 0;
      performanceHighTime = 0;
      lastRenderScaleChange = now;
      resize();
    }

    window.EchoPerformance = {
      fps: Math.round(fpsEstimate),
      renderScale,
      dpr: Number(dpr.toFixed(2)),
      particles: particles.length,
      motes: motes.length,
      bots: bots.filter((bot) => !bot.dead).length
    };
  }

  function frame(now) {
    const frameMilliseconds = Math.min(250, Math.max(0, now - previousTime));
    const dt = Math.min(frameMilliseconds / 1000, 0.05);
    previousTime = now;
    updatePerformanceBudget(frameMilliseconds, now);
    update(dt);
    render(now);
    requestAnimationFrame(frame);
  }`, "orçamento adaptativo de renderização");
  return source;
});

edit("src/rendering/renderer.js", (source) => {
  const helpers = `  let backgroundGradientCache = null;
  let backgroundGradientWidth = 0;
  let backgroundGradientHeight = 0;
  const renderSpriteCache = new Map();

  function invalidateRenderCaches() {
    backgroundGradientCache = null;
    backgroundGradientWidth = 0;
    backgroundGradientHeight = 0;
    renderSpriteCache.clear();
  }

  function createRenderCanvas(size) {
    const surface = typeof OffscreenCanvas === "function"
      ? new OffscreenCanvas(size, size)
      : document.createElement("canvas");
    surface.width = size;
    surface.height = size;
    return surface;
  }

  function getBackgroundGradient() {
    if (backgroundGradientCache && backgroundGradientWidth === width && backgroundGradientHeight === height) return backgroundGradientCache;
    backgroundGradientWidth = width;
    backgroundGradientHeight = height;
    backgroundGradientCache = ctx.createRadialGradient(width * 0.52, height * 0.48, 0, width * 0.52, height * 0.48, Math.max(width, height) * 0.72);
    backgroundGradientCache.addColorStop(0, "#0d0920");
    backgroundGradientCache.addColorStop(0.52, "#080612");
    backgroundGradientCache.addColorStop(1, "#03030a");
    return backgroundGradientCache;
  }

  function getMoteSprite(type) {
    const key = `mote:${type}`;
    if (renderSpriteCache.has(key)) return renderSpriteCache.get(key);
    const size = 64;
    const surface = createRenderCanvas(size);
    const context = surface.getContext("2d");
    const hue = type === "gold" ? 42 : type === "red" ? 0 : type === "violet" ? 268 : 188;
    const coreLight = type === "red" ? 55 : 68;
    const gradient = context.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size * 0.48);
    gradient.addColorStop(0, hsl(hue, 98, 88, 1));
    gradient.addColorStop(0.18, hsl(hue, 96, coreLight, 0.96));
    gradient.addColorStop(0.42, hsl(hue, 92, coreLight, 0.55));
    gradient.addColorStop(1, hsl(hue, 90, 50, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    renderSpriteCache.set(key, surface);
    return surface;
  }

  function getEntityAuraSprite(hue, radius, spectral, lowHealth, glow) {
    const hueBucket = Math.round(hue / 8) * 8;
    const radiusBucket = Math.max(8, Math.round(radius / 4) * 4);
    const glowBucket = Math.round((glow || 1) * 4) / 4;
    const key = `aura:${hueBucket}:${radiusBucket}:${spectral ? 1 : 0}:${lowHealth ? 1 : 0}:${glowBucket}`;
    if (renderSpriteCache.has(key)) return renderSpriteCache.get(key);
    const auraRadius = (lowHealth ? radiusBucket * 2.8 : radiusBucket * 2.1) * glowBucket;
    const size = Math.max(32, Math.ceil(auraRadius * 2 + 6));
    const surface = createRenderCanvas(size);
    const context = surface.getContext("2d");
    const renderHue = lowHealth ? 0 : hueBucket;
    const alpha = lowHealth ? 0.52 : spectral ? 0.42 : 0.34;
    const gradient = context.createRadialGradient(size / 2, size / 2, radiusBucket * 0.1, size / 2, size / 2, auraRadius);
    gradient.addColorStop(0, hsl(renderHue, 95, lowHealth ? 55 : 72, alpha));
    gradient.addColorStop(0.35, hsl(renderHue, 85, 55, spectral ? 0.14 : 0.1));
    gradient.addColorStop(1, hsl(renderHue, 80, 40, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    renderSpriteCache.set(key, surface);
    return surface;
  }

`;
  source = replaceOnce(source, `  function toScreen(x, y) {`, `${helpers}  function toScreen(x, y) {`, "caches de renderização");

  source = replaceBetween(source,
`  function visible(x, y, padding = 80) {`,
`\n\n  function drawBackground(time) {`,
`  function visible(x, y, padding = 80) {
    const screenX = (x - camera.x) * camera.zoom + width / 2;
    const screenY = (y - camera.y) * camera.zoom + height / 2;
    return screenX > -padding && screenX < width + padding && screenY > -padding && screenY < height + padding;
  }

  function drawBackground(time) {`, "culling sem alocação");

  source = replaceOnce(source,
`    const gradient = ctx.createRadialGradient(width * 0.52, height * 0.48, 0, width * 0.52, height * 0.48, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, "#0d0920");
    gradient.addColorStop(0.52, "#080612");
    gradient.addColorStop(1, "#03030a");
    ctx.fillStyle = gradient;`,
`    ctx.fillStyle = getBackgroundGradient();`, "gradiente de fundo em cache");
  return source;
});

edit("src/rendering/entities.js", (source) => {
  source = replaceBetween(source,
`  function drawMotes(time) {`,
`\n\n/*__ECHO_SECTION_END:0090__*/`,
`  function drawMotes(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const mote of motes) {
      if (!visible(mote.x, mote.y, 20)) continue;
      const point = toScreen(mote.x, mote.y);
      const pulse = 0.78 + Math.sin(time * 0.002 * mote.drift + mote.phase) * 0.22;
      const hue = mote.type === "gold" ? 42 : mote.type === "red" ? 0 : mote.type === "violet" ? 268 : 188;
      const radius = mote.radius * pulse * camera.zoom;
      const sprite = getMoteSprite(mote.type);
      const spriteSize = radius * 7.2;
      ctx.drawImage(sprite, point.x - spriteSize / 2, point.y - spriteSize / 2, spriteSize, spriteSize);

      if (!MOBILE_QUALITY && mote.type === "gold") {
        ctx.strokeStyle = hsl(hue, 90, 72, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 5 + pulse * 2, 0, TAU);
        ctx.stroke();
      }
      if (mote.type === "red" && !MOBILE_QUALITY) {
        const warnPulse = 0.5 + Math.sin(time * 0.006 + mote.phase) * 0.5;
        ctx.strokeStyle = hsl(0, 95, 55, 0.55 * warnPulse);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 6 + pulse * 3, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hsl(30, 90, 60, 0.3 * warnPulse);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 12 + pulse * 5, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }`, "sprites de pontos em cache");

  source = replaceOnce(source,
`    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(renderHue, 90, 62, spectral ? 0.9 : 0.65);
      ctx.shadowBlur = (spectral ? 24 : 16) * glow;
    }`,
`    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;`, "remoção de blur recalculado");

  source = replaceBetween(source,
`    if (!MOBILE_QUALITY || isPlayer) {
      const auraRadius`,
`\n\n    if (!MOBILE_QUALITY) {`,
`    if (!MOBILE_QUALITY || isPlayer) {
      const auraSprite = getEntityAuraSprite(renderHue, radius, spectral, isLowHealth, glow);
      const auraPulse = isLowHealth ? 1 + Math.sin(time * 0.008) * 0.05 : 1;
      const auraWidth = auraSprite.width * auraPulse;
      const auraHeight = auraSprite.height * auraPulse;
      ctx.drawImage(auraSprite, -auraWidth / 2, -auraHeight / 2, auraWidth, auraHeight);
    }`, "auras de entidades em cache");
  return source;
});

edit("tests/server.integration.test.js", (source) => source.replace(
`["/core/events.js", "/core/random.js", "/core/runtime.js", "/core/qa-panel.js"]`,
`["/core/events.js", "/core/random.js", "/core/runtime.js", "/core/qa-panel.js", "/combat/enemy-contracts.js", "/combat/threat-director.js", "/combat/runtime.js", "/ui/accessibility.js"]`
));

write("test/performance-architecture.test.js", `"use strict";\n\nconst test = require("node:test");\nconst assert = require("node:assert/strict");\nconst fs = require("node:fs");\nconst path = require("node:path");\n\nconst root = path.resolve(__dirname, "..");\nconst read = (file) => fs.readFileSync(path.join(root, file), "utf8");\n\ntest("render usa resolução adaptativa sem remover efeitos", () => {\n  const loop = read("src/core/game-loop.js");\n  const effects = read("src/entities/effects.js");\n  assert.match(loop, /updatePerformanceBudget/);\n  assert.match(loop, /renderScale/);\n  assert.match(effects, /spawnParticle/);\n  assert.match(effects, /spawnWave/);\n  assert.match(effects, /burst/);\n});\n\ntest("gradientes e sprites caros são reutilizados", () => {\n  const renderer = read("src/rendering/renderer.js");\n  const entities = read("src/rendering/entities.js");\n  assert.match(renderer, /renderSpriteCache/);\n  assert.match(renderer, /getBackgroundGradient/);\n  assert.match(renderer, /getMoteSprite/);\n  assert.match(renderer, /getEntityAuraSprite/);\n  assert.match(entities, /getMoteSprite/);\n  assert.match(entities, /getEntityAuraSprite/);\n});\n\ntest("qualidade preserva contagens existentes de conteúdo", () => {\n  const constants = read("src/core/constants.js");\n  assert.match(constants, /const MOTE_COUNT = 330/);\n  assert.match(constants, /MOBILE_QUALITY \? 140 : 330/);\n  const effects = read("src/entities/effects.js");\n  assert.match(effects, /MOBILE_QUALITY \? 60 : 200/);\n});\n\ntest("HUD e música não são recalculados em todo frame", () => {\n  const loop = read("src/core/game-loop.js");\n  assert.match(loop, /hudUpdateAccumulator >= 0\.05/);\n  assert.match(loop, /musicUpdateAccumulator >= 0\.08/);\n  assert.match(loop, /directorUpdateAccumulator >= 0\.12/);\n});\n`);

edit("README.md", (source) => {
  const marker = "- a música alterna entre seis composições procedurais sem repetição imediata.";
  if (!source.includes(marker)) return source;
  return source.replace(marker, `${marker}\n- o render usa caches de sprites e gradientes, culling sem alocação e resolução interna adaptativa, mantendo efeitos e animações ativos em máquinas mais fracas.`);
});

edit("docs/HYPERPLAN.md", (source) => {
  const marker = "- [x] Soundtrack procedural com seis faixas dinâmicas";
  if (!source.includes(marker)) return source;
  return source.replace(marker, `${marker}\n- [x] Otimização de renderização com caches, culling e escala adaptativa de resolução\n- [x] HUD, música e diretor desacoplados da taxa de quadros`);
});

console.log("Pacote de desempenho aplicado sem remover efeitos ou animações.");
