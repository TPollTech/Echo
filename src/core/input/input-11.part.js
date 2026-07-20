  ui.volume.addEventListener("input", () => {
    masterVolume = clamp(Number(ui.volume.value) / 100, 0, 1);
    ui.volumeValue.textContent = `${Math.round(masterVolume * 100)}%`;
    if (masterVolume > 0) muted = false;
    ui.sound.classList.toggle("is-muted", muted);
    saveSettings();
  });
