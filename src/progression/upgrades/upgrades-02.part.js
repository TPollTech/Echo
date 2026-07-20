  async function loadUpgrades() {
    try {
      const data = await requestJson(`/api/upgrades?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
    } catch {
      playerResonance = 0;
      playerUpgrades = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    }
  }

