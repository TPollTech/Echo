  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      masterVolume,
      muted,
      screenShake: screenShakeEnabled,
      flashes: flashEnabled
    }));
  }

