/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0006__*/
  let skinProgress = loadSkinProgress();
  const skins = [
    { id: "spectro", name: "ESPECTRO", hue: 188, description: "Frequência base", unlocked: () => true, glowIntensity: 1, trailWidth: 1, symbol: "◇" },
    { id: "fenix", name: "FÊNIX", hue: 15, description: "Chamas eternas", unlocked: () => true, glowIntensity: 1.2, trailWidth: 1.1, symbol: "◆" },
    { id: "sombra", name: "SOMBRA", hue: 280, description: "Aura das trevas", unlocked: () => true, glowIntensity: 0.82, trailWidth: 0.95, symbol: "●" },
    { id: "gelo", name: "GELO", hue: 200, description: "Cristais gélidos", unlocked: () => true, glowIntensity: 1.05, trailWidth: 1, symbol: "◈" },
    { id: "neon", name: "NEON", hue: 140, description: "Brilho sintético", unlocked: () => true, glowIntensity: 1.45, trailWidth: 1.2, symbol: "◇" },
    { id: "sangue", name: "SANGUE", hue: 350, description: "Gotas vermelhas", unlocked: () => true, glowIntensity: 1.1, trailWidth: 1.05, symbol: "◆" },
    { id: "dourado", name: "DOURADO", hue: 42, description: "Derrote um boss para liberar", unlocked: () => skinProgress.bossesDefeated >= 1, glowIntensity: 1.35, trailWidth: 1.12, symbol: "★" },
    { id: "caotico", name: "CAÓTICO", hue: -1, description: "Alcance 500 pontos para liberar", unlocked: () => skinProgress.bestScore >= 500, glowIntensity: 1.25, trailWidth: 1.3, symbol: "✦" }
  ];

/*__ECHO_SECTION_END:0006__*/
/*__ECHO_SECTION:0023__*/
  function showSkinScreen() {
    state = "skin-select";
    ui.start.classList.add("is-hidden");
    ui.skin.classList.remove("is-hidden");
    ui.skinCards.replaceChildren();
    const selectedId = getSelectedSkin().id;
    for (const skin of skins) {
      const locked = !skin.unlocked();
      const button = document.createElement("button");
      button.type = "button";
      button.className = `skin-card${selectedId === skin.id ? " is-selected" : ""}`;
      button.disabled = locked;
      button.style.setProperty("--skin-hue", String(skin.hue < 0 ? 188 : skin.hue));
      button.innerHTML = `
        <span class="skin-preview"><i></i><b>${skin.symbol}</b></span>
        <h3>${skin.name}</h3>
        <p>${skin.description}</p>
        <span class="skin-state">${locked ? "BLOQUEADO" : selectedId === skin.id ? "SELECIONADO" : "DISPONÍVEL"}</span>
      `;
      if (!locked) button.addEventListener("click", () => selectSkin(skin));
      ui.skinCards.append(button);
    }
    sound(330, 0.25, "sine", 0.03);
  }

  function selectSkin(skin) {
    localStorage.setItem(SKIN_KEY, skin.id);
    ui.skin.classList.add("is-hidden");
    showToast(`FREQUÊNCIA VISUAL: ${skin.name}`, 1500);
    showModifierScreen();
  }

/*__ECHO_SECTION_END:0023__*/
/*__ECHO_SECTION:0027__*/
  function loadSkinProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(SKIN_PROGRESS_KEY) || "{}");
      return {
        bestScore: Math.max(0, Number(saved.bestScore) || 0),
        bossesDefeated: Math.max(0, Number(saved.bossesDefeated) || 0)
      };
    } catch (_error) {
      return { bestScore: 0, bossesDefeated: 0 };
    }
  }

  function saveSkinProgress() {
    try {
      localStorage.setItem(SKIN_PROGRESS_KEY, JSON.stringify(skinProgress));
    } catch (_error) {}
  }

  function updateSkinProgress(score, defeatedBoss) {
    skinProgress.bestScore = Math.max(skinProgress.bestScore, Math.floor(score || 0));
    if (defeatedBoss) skinProgress.bossesDefeated += 1;
    saveSkinProgress();
  }

  function getSelectedSkin() {
    const savedSkinId = localStorage.getItem(SKIN_KEY) || "spectro";
    const selected = skins.find((skin) => skin.id === savedSkinId && skin.unlocked());
    if (selected) return selected;
    localStorage.setItem(SKIN_KEY, "spectro");
    return skins[0];
  }

/*__ECHO_SECTION_END:0027__*/
