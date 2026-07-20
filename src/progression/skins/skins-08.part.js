  function getSelectedSkin() {
    const savedSkinId = localStorage.getItem(SKIN_KEY) || "spectro";
    const selected = skins.find((skin) => skin.id === savedSkinId && skin.unlocked());
    if (selected) return selected;
    localStorage.setItem(SKIN_KEY, "spectro");
    return skins[0];
  }

