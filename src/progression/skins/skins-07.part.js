  function updateSkinProgress(score, defeatedBoss) {
    skinProgress.bestScore = Math.max(skinProgress.bestScore, Math.floor(score || 0));
    if (defeatedBoss) skinProgress.bossesDefeated += 1;
    saveSkinProgress();
  }

