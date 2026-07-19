(function (root) {
  "use strict";

  if (!new URLSearchParams(root.location.search).has("qa")) return;
  const core = root.EchoCore;
  if (!core) return;

  const style = document.createElement("style");
  style.textContent = `
    .echo-qa-panel{position:fixed;right:12px;bottom:12px;z-index:9999;width:min(320px,calc(100vw - 24px));padding:14px;border:1px solid rgba(115,229,255,.35);border-radius:14px;background:rgba(5,4,12,.94);color:#f7f4ff;font:12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;box-shadow:0 16px 50px rgba(0,0,0,.45)}
    .echo-qa-panel strong{font-size:13px}.echo-qa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}
    .echo-qa-panel button,.echo-qa-panel input{min-height:34px;border:1px solid rgba(255,255,255,.18);border-radius:9px;background:#121020;color:inherit;font:inherit}
    .echo-qa-panel button{cursor:pointer}.echo-qa-panel button:hover{border-color:#73e5ff}.echo-qa-panel input{width:100%;padding:0 9px;margin-top:8px}
    .echo-qa-stats{display:flex;justify-content:space-between;gap:12px;margin-top:8px}.echo-qa-log{white-space:pre-line;max-height:72px;overflow:hidden;margin-top:8px;color:#b9b4ca}
  `;
  document.head.appendChild(style);

  const panel = document.createElement("aside");
  panel.className = "echo-qa-panel";
  panel.setAttribute("aria-label", "Painel de qualidade ECHO");
  panel.innerHTML = `
    <strong>QA // ECHO ${core.version}</strong>
    <div class="echo-qa-stats"><span>SEED <b data-seed></b></span><span>FPS <b data-fps>--</b></span></div>
    <input data-url readonly aria-label="URL reproduzível da run">
    <div class="echo-qa-grid">
      <button type="button" data-key="u">MUTAÇÃO [U]</button>
      <button type="button" data-key="b">BOSS [B]</button>
      <button type="button" data-key="v">VITÓRIA [V]</button>
      <button type="button" data-action="new-seed">NOVA SEED</button>
      <button type="button" data-action="toggle-log">EVENTOS</button>
      <button type="button" data-action="hide">OCULTAR</button>
    </div>
    <div class="echo-qa-log" data-log aria-live="polite"></div>
  `;
  document.body.appendChild(panel);

  const seedNode = panel.querySelector("[data-seed]");
  const urlNode = panel.querySelector("[data-url]");
  const fpsNode = panel.querySelector("[data-fps]");
  const logNode = panel.querySelector("[data-log]");
  const eventLog = [];
  seedNode.textContent = core.seed;
  urlNode.value = core.shareUrl();

  panel.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.key) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: button.dataset.key, bubbles: true }));
      return;
    }
    if (button.dataset.action === "new-seed") core.setSeed(core.random.createSeed(), { reload: true });
    if (button.dataset.action === "toggle-log") logNode.hidden = !logNode.hidden;
    if (button.dataset.action === "hide") panel.hidden = true;
  });

  urlNode.addEventListener("focus", () => urlNode.select());
  core.events.on("*", ({ eventName, payload }) => {
    eventLog.unshift(`${eventName}${payload?.seed ? ` // ${payload.seed}` : ""}`);
    eventLog.splice(6);
    logNode.textContent = eventLog.join("\n");
  });

  let frames = 0;
  let last = performance.now();
  function tick(now) {
    frames += 1;
    if (now - last >= 500) {
      fpsNode.textContent = String(Math.round((frames * 1000) / (now - last)));
      frames = 0;
      last = now;
    }
    root.requestAnimationFrame(tick);
  }
  root.requestAnimationFrame(tick);
})(window);
