  function loadSkinProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(SKIN_PROGRESS_KEY) || "{}");
      return {
        bestScore: Math.max(0, Number(saved.bestScore) || 0),
        bossesDefeated: Math.max(0, Number(saved.bossesDefeated) || 0)
      };
    } catch (_error) {
      return { bestScore: 0, bossesDefeated: 0 };
    }
  }

  function saveSkinProgress() {
    try {
      localStorage.setItem(SKIN_PROGRESS_KEY, JSON.stringify(skinProgress));
    } catch (_error) {}
  }

  function updateSkinProgress(score, defeatedBoss) {
    skinProgress.bestScore = Math.max(skinProgress.bestScore, Math.floor(score || 0));
    if (defeatedBoss) skinProgress.bossesDefeated += 1;
    saveSkinProgress();
  }

  function getSelectedSkin() {
    const savedSkinId = localStorage.getItem(SKIN_KEY) || "spectro";
    const selected = skins.find((skin) => skin.id === savedSkinId && skin.unlocked());
    if (selected) return selected;
    localStorage.setItem(SKIN_KEY, "spectro");
    return skins[0];
  }

