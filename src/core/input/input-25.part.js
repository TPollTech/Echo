  window.addEventListener("blur", () => {
    if (state === "playing") endPhase();
  });
