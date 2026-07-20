  function saveChallenges() {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify({
        date: new Date().toDateString(),
        active: activeChallenges
      }));
    } catch (_e) {}
  }

