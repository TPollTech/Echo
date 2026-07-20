  function loadChallenges() {
    try {
      const saved = JSON.parse(localStorage.getItem(CHALLENGES_KEY) || "{}");
      const today = new Date().toDateString();
      if (saved.date === today && Array.isArray(saved.active)) {
        activeChallenges = saved.active;
      } else {
        activeChallenges = generateDailyChallenges();
        saveChallenges();
      }
    } catch (_e) {
      activeChallenges = generateDailyChallenges();
    }
  }

