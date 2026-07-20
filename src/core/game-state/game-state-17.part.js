  function releaseCanvasPointer(event) {
    if (pointer.id !== event.pointerId) return;
    pointer.active = false;
    pointer.id = null;
    if (event.pointerType === "mouse") endPhase();
  }

