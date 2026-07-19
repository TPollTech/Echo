(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EchoAccessibility = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const STORAGE_KEY = "echo.uiScale";
  const SELECTORS = [
    ".topbar", ".vitals", ".leaderboard", ".challenge-panel", ".score-panel",
    ".ability-dock", ".combo", ".start-content", ".start-footer", ".mutation-content",
    ".gameover-content", ".pause-content", ".workshop-content", ".skin-content", ".modifier-content"
  ];

  function normalizeScale(value) {
    const numeric = Math.round(Number(value) || 100);
    return Math.max(90, Math.min(150, numeric));
  }

  function applyScale(value) {
    if (!root?.document) return normalizeScale(value);
    const scale = normalizeScale(value);
    const zoom = scale / 100;
    root.document.documentElement.dataset.echoUiScale = String(scale);
    root.document.documentElement.style.setProperty("--echo-ui-scale", String(zoom));
    for (const selector of SELECTORS) {
      for (const element of root.document.querySelectorAll(selector)) {
        element.style.zoom = String(zoom);
      }
    }
    try { root.localStorage.setItem(STORAGE_KEY, String(scale)); } catch (_error) {}
    root.EchoCore?.events?.emit("settings:ui-scale", { scale });
    return scale;
  }

  function readScale() {
    try { return normalizeScale(root?.localStorage?.getItem(STORAGE_KEY) || 100); }
    catch (_error) { return 100; }
  }

  function installControl() {
    if (!root?.document) return null;
    const panel = root.document.querySelector(".settings-panel");
    if (!panel || root.document.querySelector("#ui-scale-setting")) return null;
    const label = root.document.createElement("label");
    label.htmlFor = "ui-scale-setting";
    label.innerHTML = '<span>ESCALA DA INTERFACE</span><output id="ui-scale-value">100%</output>';
    const input = root.document.createElement("input");
    input.id = "ui-scale-setting";
    input.type = "range";
    input.min = "90";
    input.max = "150";
    input.step = "5";
    input.value = String(readScale());
    input.addEventListener("input", () => {
      const scale = applyScale(input.value);
      const output = root.document.querySelector("#ui-scale-value");
      if (output) output.textContent = `${scale}%`;
    });
    panel.append(label, input);
    const scale = applyScale(input.value);
    label.querySelector("output").textContent = `${scale}%`;
    return input;
  }

  if (root?.document) installControl();

  return Object.freeze({ normalizeScale, applyScale, readScale, installControl });
});
