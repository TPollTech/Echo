  function generateDailyChallenges() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const shuffled = [...challengePool].sort((a, b) => {
      const ha = (seed * 2654435761 >>> 0) % challengePool.length;
      const hb = (seed * 2654435761 >>> 0) % challengePool.length;
      return ha - hb;
    });
    return shuffled.slice(0, 3).map((c, i) => ({ ...c, index: i, completed: false }));
  }

