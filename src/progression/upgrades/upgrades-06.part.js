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

