  function saveSkinProgress() {
    try {
      localStorage.setItem(SKIN_PROGRESS_KEY, JSON.stringify(skinProgress));
    } catch (_error) {}
  }

