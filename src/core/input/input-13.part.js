  ui.flashSetting.addEventListener("change", () => {
    flashEnabled = ui.flashSetting.checked;
    if (!flashEnabled) flash = 0;
    saveSettings();
  });

