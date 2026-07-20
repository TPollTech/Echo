  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.type = event.pointerType;
    pointer.active = true;
    pointer.id = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    if (event.pointerType === "mouse") beginPhase();
  });

