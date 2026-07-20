  ui.shakeSetting.addEventListener("change", () => {
    screenShakeEnabled = ui.shakeSetting.checked;
    if (!screenShakeEnabled) screenShake = 0;
    saveSettings();
  });
