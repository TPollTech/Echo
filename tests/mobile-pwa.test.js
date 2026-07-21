"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { isPublicAsset, validateBrowserAssets } = require("../server/index.js");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

test("tablet HUD uses coarse-pointer layout without desktop overlays", () => {
  const css = read("assets/mobile-ui.css");
  assert.match(css, /@media \(pointer: coarse\), \(max-width: 900px\)/);
  assert.match(css, /\.challenge-panel[\s\S]*\.leaderboard[\s\S]*display: none !important/);
  assert.match(css, /\.joystick-zone[\s\S]*pointer-events: auto !important/);
  assert.match(css, /\.mobile-skill-buttons[\s\S]*grid-template-columns: repeat\(2, 50px\)/);
  assert.match(css, /\.minimap[\s\S]*top:/);
  assert.match(css, /orientation: landscape/);
});

test("touch runtime keeps joystick enabled only during gameplay and clears captured pointers", () => {
  const runtime = read("assets/mobile-ux.js");
  assert.match(runtime, /classList\.toggle\("is-joy-active", playing\)/);
  assert.match(runtime, /activeZonePointerId/);
  assert.match(runtime, /lostpointercapture/);
  assert.match(runtime, /visibilitychange/);
  assert.match(runtime, /orientationchange/);
  assert.doesNotThrow(() => new Function(runtime));
});

test("PWA manifest and offline shell are complete", () => {
  const manifest = JSON.parse(read("assets/manifest.json"));
  assert.equal(manifest.display, "fullscreen");
  assert.equal(manifest.orientation, "landscape");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  for (const icon of manifest.icons) {
    const iconPath = path.join(ROOT, "assets", icon.src.replace(/^\.\//, ""));
    assert.ok(fs.statSync(iconPath).isFile(), `${icon.src} deve existir`);
  }

  const worker = read("service-worker.js");
  assert.match(worker, /cache\.addAll\(PRECACHE\)/);
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /url\.pathname\.includes\("\/api\/"\)/);
  assert.doesNotThrow(() => new Function(worker));
});

test("browser runtime loads mobile UX and registers the root service worker", () => {
  const runtime = read("core/runtime.js");
  assert.match(runtime, /assets\/mobile-ui\.css/);
  assert.match(runtime, /assets\/mobile-ux\.js/);
  assert.match(runtime, /assets\/manifest\.json/);
  assert.match(runtime, /serviceWorker\.register\("\.\/service-worker\.js"/);
  assert.doesNotThrow(() => new Function(runtime));
});

test("local server exposes and validates all PWA files", () => {
  assert.equal(isPublicAsset("/service-worker.js"), true);
  assert.equal(isPublicAsset("/assets/manifest.json"), true);
  assert.equal(isPublicAsset("/assets/mobile-ui.css"), true);
  assert.doesNotThrow(validateBrowserAssets);
});
