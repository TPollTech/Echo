(function (root) {
  "use strict";

  const document = root.document;
  if (!document) return;

  const coarsePointer = root.matchMedia?.("(pointer: coarse)")?.matches || navigator.maxTouchPoints > 0;
  if (!coarsePointer) return;

  document.documentElement.classList.add("echo-touch-device");

  let activeZonePointerId = null;
  let activePhasePointerId = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function syncTouchControls() {
    const playing = document.body.classList.contains("is-playing");
    const zone = byId("joystick-zone");
    if (zone) {
      zone.classList.toggle("is-joy-active", playing);
      zone.setAttribute("aria-hidden", String(!playing));
    }
    document.body.classList.toggle("echo-touch-playing", playing);
  }

  function dispatchPointerCancel(target, pointerId) {
    if (!target || pointerId === null || typeof root.PointerEvent !== "function") return;
    target.dispatchEvent(new PointerEvent("pointercancel", {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType: "touch",
      isPrimary: true
    }));
  }

  function cancelStuckTouches() {
    const zone = byId("joystick-zone");
    const phase = byId("mobile-phase");
    dispatchPointerCancel(zone, activeZonePointerId);
    dispatchPointerCancel(phase, activePhasePointerId);
    activeZonePointerId = null;
    activePhasePointerId = null;
    phase?.classList.remove("is-active");
  }

  function addLegacyTouchFallback(zone) {
    if ("PointerEvent" in root || !zone) return;

    let activeTouchId = null;

    function makePointerEvent(type, touch) {
      const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: touch?.clientX || 0,
        clientY: touch?.clientY || 0
      });
      Object.defineProperties(event, {
        pointerId: { value: activeTouchId ?? 1 },
        pointerType: { value: "touch" },
        isPrimary: { value: true }
      });
      return event;
    }

    zone.addEventListener("touchstart", (event) => {
      if (activeTouchId !== null || event.changedTouches.length === 0) return;
      const touch = event.changedTouches[0];
      activeTouchId = touch.identifier;
      event.preventDefault();
      zone.dispatchEvent(makePointerEvent("pointerdown", touch));
    }, { passive: false });

    zone.addEventListener("touchmove", (event) => {
      const touch = Array.from(event.changedTouches).find((item) => item.identifier === activeTouchId);
      if (!touch) return;
      event.preventDefault();
      zone.dispatchEvent(makePointerEvent("pointermove", touch));
    }, { passive: false });

    function finish(event, type) {
      const touch = Array.from(event.changedTouches).find((item) => item.identifier === activeTouchId);
      if (!touch) return;
      event.preventDefault();
      zone.dispatchEvent(makePointerEvent(type, touch));
      activeTouchId = null;
    }

    zone.addEventListener("touchend", (event) => finish(event, "pointerup"), { passive: false });
    zone.addEventListener("touchcancel", (event) => finish(event, "pointercancel"), { passive: false });
  }

  function protectPointerCapture(zone, phase) {
    if (zone) {
      zone.addEventListener("pointerdown", (event) => {
        activeZonePointerId = event.pointerId;
      }, true);

      const clearZonePointer = (event) => {
        if (activeZonePointerId === null || event.pointerId === activeZonePointerId) activeZonePointerId = null;
      };

      zone.addEventListener("pointerup", clearZonePointer, true);
      zone.addEventListener("pointercancel", clearZonePointer, true);
      zone.addEventListener("lostpointercapture", () => {
        const pointerId = activeZonePointerId;
        if (pointerId === null) return;
        dispatchPointerCancel(zone, pointerId);
        activeZonePointerId = null;
      });
    }

    if (phase) {
      phase.addEventListener("pointerdown", (event) => {
        activePhasePointerId = event.pointerId;
        phase.classList.add("is-active");
      }, true);

      const clearPhasePointer = (event) => {
        if (activePhasePointerId !== null && event.pointerId !== activePhasePointerId) return;
        activePhasePointerId = null;
        phase.classList.remove("is-active");
      };

      phase.addEventListener("pointerup", clearPhasePointer, true);
      phase.addEventListener("pointercancel", clearPhasePointer, true);
      phase.addEventListener("lostpointercapture", () => {
        const pointerId = activePhasePointerId;
        if (pointerId === null) return;
        dispatchPointerCancel(phase, pointerId);
        activePhasePointerId = null;
        phase.classList.remove("is-active");
      });
    }
  }

  function prepareInstallButton() {
    let deferredPrompt = null;
    let button = null;

    root.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      const summary = document.querySelector(".prep-summary");
      if (!summary || byId("echo-install-pwa")) return;

      button = document.createElement("button");
      button.id = "echo-install-pwa";
      button.type = "button";
      button.textContent = "INSTALAR APP";
      button.style.cssText = "margin-top:8px;padding:11px;border:1px solid rgba(69,230,255,.42);background:rgba(69,230,255,.08);color:#c9f8ff;letter-spacing:.12em;font-weight:700;";
      button.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        button.disabled = true;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(() => null);
        deferredPrompt = null;
        button.remove();
      });
      summary.insertBefore(button, summary.querySelector(".start-status"));
    });

    root.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      button?.remove();
    });
  }

  function init() {
    const zone = byId("joystick-zone");
    const phase = byId("mobile-phase");
    syncTouchControls();
    addLegacyTouchFallback(zone);
    protectPointerCapture(zone, phase);
    prepareInstallButton();

    const bodyObserver = new MutationObserver(syncTouchControls);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelStuckTouches();
      syncTouchControls();
    });
    root.addEventListener("blur", cancelStuckTouches);
    root.addEventListener("pagehide", cancelStuckTouches);
    root.addEventListener("orientationchange", () => {
      cancelStuckTouches();
      root.setTimeout(syncTouchControls, 120);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})(window);
