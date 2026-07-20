  function checkChallenges() {
    let newCompletion = false;
    for (const ch of activeChallenges) {
      if (ch.completed) continue;
      const value = runStats[ch.stat] || 0;
      if (value >= ch.goal) {
        ch.completed = true;
        newCompletion = true;
        pendingResonance += ch.reward;
        showToast(`DESAFIO CONCLUÍDO: ${ch.name} (+${ch.reward} ressonância)`, 2800);
        sound(523, 0.3, "triangle", 0.05);
        setTimeout(() => sound(659, 0.25, "sine", 0.04), 100);
        setTimeout(() => sound(784, 0.2, "sine", 0.035), 200);
      }
    }
    if (newCompletion) saveChallenges();
  }

