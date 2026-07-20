  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      masterVolume = clamp(Number(saved.masterVolume ?? 0.7), 0, 1);
      muted = Boolean(saved.muted);
      screenShakeEnabled = saved.screenShake !== false;
      flashEnabled = saved.flashes !== false;
    } catch {
      masterVolume = 0.7;
    }
    ui.volume.value = String(Math.round(masterVolume * 100));
    ui.volumeValue.textContent = `${Math.round(masterVolume * 100)}%`;
    ui.shakeSetting.checked = screenShakeEnabled;
    ui.flashSetting.checked = flashEnabled;
    ui.sound.classList.toggle("is-muted", muted);
    ui.sound.setAttribute("aria-label", muted ? "Ativar som" : "Desativar som");
  }

