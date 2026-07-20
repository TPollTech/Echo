/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0021__*/
  const challengePool = [
    { id: "kill20", name: "DESTRUIÇÃO MÍNIMA", description: "Elimine 20 inimigos em uma run", goal: 20, stat: "kills", reward: 25 },
    { id: "kill50", name: "ABATE EM MASSA", description: "Elimine 50 inimigos em uma run", goal: 50, stat: "kills", reward: 60 },
    { id: "score1500", name: "FRAGMENTOS ABUNDANTES", description: "Alcance 1500 pontos em uma run", goal: 1500, stat: "score", reward: 30 },
    { id: "score5000", name: "ACÚMULO EXTREMO", description: "Alcance 5000 pontos em uma run", goal: 5000, stat: "score", reward: 80 },
    { id: "combo10", name: "FLUXO CONTÍNUO", description: "Atinja combo x10", goal: 10, stat: "maxCombo", reward: 20 },
    { id: "combo20", name: "COMBO INDOMÁVEL", description: "Atinja combo x20", goal: 20, stat: "maxCombo", reward: 50 },
    { id: "bossKill", name: "CAÇADOR DE COROAS", description: "Derrote o boss", goal: 1, stat: "bossDefeated", reward: 40 },
    { id: "bossSpeed", name: "EXECUÇÃO RÁPIDA", description: "Derrote o boss em menos de 90s", goal: 1, stat: "bossSpeedKill", reward: 70 },
    { id: "time5", name: "SOBREVIVENTE", description: "Sobreviva 5 minutos", goal: 300, stat: "runTime", reward: 30 },
    { id: "time10", name: "RESISTÊNCIA", description: "Sobreviva 10 minutos", goal: 600, stat: "runTime", reward: 65 },
    { id: "redMote5", name: "RISCO CALCULADO", description: "Colete 5 motes vermelhas em uma run", goal: 5, stat: "redMotes", reward: 20 },
    { id: "noHitBoss", name: "PERFEIÇÃO", description: "Derrote o boss sem tomar dano na fase final", goal: 1, stat: "noHitBoss", reward: 100 }
  ];
  let activeChallenges = [];
  let runStats = { kills: 0, score: 0, maxCombo: 0, bossDefeated: 0, bossSpeedKill: 0, runTime: 0, redMotes: 0, noHitBoss: 0 };

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

  function saveChallenges() {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify({
        date: new Date().toDateString(),
        active: activeChallenges
      }));
    } catch (_e) {}
  }

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

/*__ECHO_SECTION_END:0021__*/
/*__ECHO_SECTION:0111__*/
  loadChallenges();
/*__ECHO_SECTION_END:0111__*/
