/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0046__*/
  async function loadProfile() {
    try {
      const profile = await requestJson(`/api/profile?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      ui.profileSummary.innerHTML = `<strong>RECORDE SOLO ${profile.solo.best_score}</strong> · ${profile.solo.runs} RUNS · <strong>${profile.multiplayer.total_kills} RUPTURAS ONLINE</strong> · <strong style="color:#ffd86b">${profile.resonance} ♦</strong>`;
    } catch {
      ui.profileSummary.textContent = "Inicie com npm start para ativar banco local e multiplayer.";
    }
  }

  async function loadUpgrades() {
    try {
      const data = await requestJson(`/api/upgrades?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
    } catch {
      playerResonance = 0;
      playerUpgrades = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    }
  }

  async function purchaseUpgrade(type) {
    try {
      const data = await requestJson("/api/upgrades", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), upgradeType: type })
      });
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
      updateWorkshopUI();
      sound(520, 0.25, "triangle", 0.04);
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  const UPGRADE_META = {
    core: { name: "NÚCLEO", symbol: "♥", description: "+5 vida máxima por nível", color: "#ff4fd8" },
    charge: { name: "CARGA", symbol: "⚡", description: "+10 energia máxima por nível", color: "#45e6ff" },
    calibration: { name: "CALIBRAÇÃO", symbol: "◎", description: "-8% cooldown base por nível", color: "#78ffba" },
    collection: { name: "COLETA", symbol: "◉", description: "+5px raio de coleta por nível", color: "#b792ff" },
    regeneration: { name: "REGENERAÇÃO", symbol: "∞", description: "+0.3 HP/s passivo por nível", color: "#ff8cb7" }
  };
  const UPGRADE_COSTS = [15, 30, 50, 80, 120];

  function updateWorkshopUI() {
    if (ui.workshopResonance) ui.workshopResonance.textContent = playerResonance;
    if (!ui.upgradeCards) return;
    ui.upgradeCards.replaceChildren();
    for (const [type, meta] of Object.entries(UPGRADE_META)) {
      const level = playerUpgrades[type];
      const cost = level < 5 ? UPGRADE_COSTS[level] : null;
      const canAfford = cost !== null && playerResonance >= cost;
      const isMaxed = level >= 5;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `upgrade-card${isMaxed ? " is-maxed" : ""}`;
      card.style.setProperty("--card-color", meta.color);
      card.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true" style="--card-color:${meta.color}">${meta.symbol}</span>
        <small style="color:${meta.color}">NÍVEL ${level}/5</small>
        <h3>${meta.name}</h3>
        <p>${meta.description}</p>
        <div class="level-bar">${Array.from({ length: 5 }, (_, i) => `<div class="level-pip${i < level ? " is-filled" : ""}" style="--pip-color:${meta.color}"></div>`).join("")}</div>
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} ♦`}</span>
      `;
      if (!isMaxed && canAfford) {
        card.addEventListener("click", () => purchaseUpgrade(type));
      }
      ui.upgradeCards.append(card);
    }
  }

/*__ECHO_SECTION_END:0046__*/
