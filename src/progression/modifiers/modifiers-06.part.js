  function showModifierScreen() {
    pendingModifierChoices = generateModifierChoices();
    state = "modifier";
    ui.start.classList.add("is-hidden");
    const overlay = document.getElementById("modifier-screen");
    overlay.classList.remove("is-hidden");
    const cards = document.getElementById("modifier-cards");
    cards.replaceChildren();
    for (const mod of pendingModifierChoices) {
      const btn = document.createElement("button");
      btn.className = "modifier-card";
      btn.type = "button";
      btn.style.setProperty("--mod-color", mod.color);
      btn.innerHTML = `
        <span class="modifier-symbol">${mod.symbol}</span>
        <h3>${mod.name}</h3>
        <p>${mod.description}</p>
        <span class="modifier-bonus">+${mod.bonusResonance} ressonância</span>
        <b aria-hidden="true">↗</b>
      `;
      btn.addEventListener("click", () => selectModifier(mod));
      cards.append(btn);
    }
    const skipBtn = document.createElement("button");
    skipBtn.className = "modifier-card modifier-skip";
    skipBtn.type = "button";
    skipBtn.innerHTML = `<span class="modifier-symbol">∅</span><h3>SEM MODIFICADOR</h3><p>Jogue sem alterações.</p><b aria-hidden="true">↗</b>`;
    skipBtn.addEventListener("click", () => selectModifier(null));
    cards.append(skipBtn);
    sound(262, 0.4, "sine", 0.03);
    setTimeout(() => sound(392, 0.35, "sine", 0.025), 80);
  }

