  function updateChallengePanel() {
    const panel = document.querySelector("#challenge-panel");
    if (!panel) return;
    panel.replaceChildren();
    for (const ch of activeChallenges) {
      const value = Math.min(runStats[ch.stat] || 0, ch.goal);
      const pct = Math.floor((value / ch.goal) * 100);
      const item = document.createElement("div");
      item.className = `challenge-item${ch.completed ? " challenge-completed" : ""}`;
      item.innerHTML = `
        <div class="challenge-header">
          <span class="challenge-name">${ch.name}</span>
          <span class="challenge-reward">+${ch.reward}</span>
        </div>
        <p class="challenge-desc">${ch.description}</p>
        <div class="challenge-bar"><i style="width:${pct}%"></i></div>
        <span class="challenge-progress">${value}/${ch.goal}</span>
      `;
      panel.append(item);
    }
  }

