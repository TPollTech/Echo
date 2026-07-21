/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0046__*/
  async function loadProfile() {
    try {
      const profile = await requestJson(`/api/profile?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      ui.profileSummary.innerHTML = `<strong>RECORDE SOLO: ${profile.solo.best_score}</strong> · ${profile.solo.runs} PARTIDAS SOLO · <strong>${profile.multiplayer.total_kills} ELIMINAÇÕES ONLINE</strong> · <strong style="color:#ffd86b">${profile.resonance} CRÉDITOS</strong> · <strong style="color:#45e6ff">${profile.skillPoints} PONTOS DE HABILIDADE</strong>`;
      playerSkillPoints = profile.skillPoints || 0;
      playerOwnedMutations = profile.ownedMutations || {};
      playerLoadout = profile.loadout || [null, null, null, null];
      applyServerPreparation(profile.preferences, profile.classProgress);
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
    core: { name: "VIDA", symbol: "♥", description: "+5 de vida máxima por nível", color: "#ff4fd8" },
    charge: { name: "ENERGIA", symbol: "⚡", description: "+10 de energia máxima por nível", color: "#45e6ff" },
    calibration: { name: "RECARGA", symbol: "◎", description: "Habilidades recarregam 8% mais rápido por nível", color: "#78ffba" },
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
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} CRÉDITOS`}</span>
      `;
      if (!isMaxed && canAfford) {
        card.addEventListener("click", () => purchaseUpgrade(type));
      }
      ui.upgradeCards.append(card);
    }
  }

  const SKILL_MUTATION_COSTS = [8, 12, 12, 10, 14, 10, 8, 10, 14, 12, 14, 12, 10, 16, 14, 14, 16];
  const SKILL_UPGRADE_COSTS = [[20, 35], [28, 48], [28, 48], [22, 38], [32, 55], [22, 38], [18, 30], [22, 38], [32, 55], [28, 48], [32, 55], [28, 48], [22, 38], [36, 62], [32, 55], [32, 55], [36, 62]];

  function openSkillShop() {
    updateSkillShopUI();
    ui.skillShop.classList.remove("is-hidden");
    sound(262, 0.3, "sine", 0.03);
  }

  function closeSkillShop() {
    ui.skillShop.classList.add("is-hidden");
    loadProfile();
  }

  function updateSkillShopUI() {
    if (ui.skillShopPoints) ui.skillShopPoints.textContent = playerSkillPoints;
    if (!ui.skillShopCards) return;
    ui.skillShopCards.replaceChildren();
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      const owned = playerOwnedMutations[mutation.id];
      const isOwned = !!owned;
      const level = owned || 0;
      const isMaxed = level >= 3;
      let cost = 0;
      let canAfford = false;
      let action = "";
      if (!isOwned) {
        cost = SKILL_MUTATION_COSTS[i];
        canAfford = playerSkillPoints >= cost;
        action = "DESBLOQUEAR";
      } else if (!isMaxed) {
        cost = SKILL_UPGRADE_COSTS[i][level - 1];
        canAfford = playerSkillPoints >= cost;
        action = `MELHORAR PARA O NÍVEL ${["I", "II", "III"][level]}`;
      }
      const card = document.createElement("button");
      card.type = "button";
      card.className = `skill-card${isMaxed ? " is-maxed" : ""}${!isOwned ? " is-locked" : ""}`;
      card.style.setProperty("--card-color", mutation.color);
      card.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true">${mutation.symbol}</span>
        <small>${mutation.tag}</small>
        <h3>${mutation.name}</h3>
        <p>${isOwned ? mutation.tiers[level - 1]?.desc || mutation.description : mutation.description}</p>
        <div class="level-bar">${Array.from({ length: 3 }, (_, i) => `<div class="level-pip${i < level ? " is-filled" : ""}" style="--pip-color:${mutation.color}"></div>`).join("")}</div>
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} PONTOS`}</span>
      `;
      if (!isMaxed && canAfford) {
        card.addEventListener("click", () => purchaseSkillMutation(mutation.id));
      }
      ui.skillShopCards.append(card);
    }
  }

  async function purchaseSkillMutation(mutationId) {
    try {
      const endpoint = playerOwnedMutations[mutationId] ? "/api/shop/upgrade" : "/api/shop/purchase";
      const data = await requestJson(endpoint, {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), mutationId })
      });
      playerSkillPoints = data.skillPoints;
      playerOwnedMutations = data.mutations;
      updateSkillShopUI();
      sound(520, 0.25, "triangle", 0.04);
      loadProfile();
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  async function saveLoadoutToServer() {
    try {
      const data = await requestJson("/api/shop/loadout", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), slots: playerLoadout })
      });
      playerLoadout = data.loadout;
      showToast("BÔNUS SALVOS", 1200);
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

/*__ECHO_SECTION_END:0046__*/
