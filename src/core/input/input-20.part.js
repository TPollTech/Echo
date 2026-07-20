  ui.mobilePhase.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ui.mobilePhase.setPointerCapture?.(event.pointerId);
    beginPhase();
  });
