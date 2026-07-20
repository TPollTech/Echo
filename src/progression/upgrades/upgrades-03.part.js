  async function purchaseUpgrade(type) {
    try {
      const data = await requestJson("/api/upgrades", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), upgradeType: type })
      });
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
      updateWorkshopUI();
      sound(520, 0.25, "triangle", 0.04);
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

