  ui.sound.addEventListener("click", () => {
    muted = !muted;
    ui.sound.classList.toggle("is-muted", muted);
    ui.sound.setAttribute("aria-label", muted ? "Ativar som" : "Desativar som");
    if (!muted) { initAudio(); sound(440, 0.1, "sine", 0.025); }
    saveSettings();
  });

