  async function loadProfile() {
    try {
      const profile = await requestJson(`/api/profile?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      ui.profileSummary.innerHTML = `<strong>RECORDE SOLO ${profile.solo.best_score}</strong> · ${profile.solo.runs} RUNS · <strong>${profile.multiplayer.total_kills} RUPTURAS ONLINE</strong> · <strong style="color:#ffd86b">${profile.resonance} ♦</strong>`;
    } catch {
      ui.profileSummary.textContent = "Inicie com npm start para ativar banco local e multiplayer.";
    }
  }

