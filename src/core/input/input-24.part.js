  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      endPhase();
    }
  });

