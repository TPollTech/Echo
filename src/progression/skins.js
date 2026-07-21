/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0006__*/
  let skinProgress = loadSkinProgress();
  const skins = globalThis.EchoSkinSystem.SKIN_DEFINITIONS.map((definition) => ({
    ...definition,
    unlocked: () => definition.unlock === "always"
      || (definition.unlock === "boss" && skinProgress.bossesDefeated >= 1)
      || (definition.unlock === "score-500" && skinProgress.bestScore >= 500)
  }));

/*__ECHO_SECTION_END:0006__*/
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
    const migrations = { spectro: "azul-neon", neon: "verde-toxico", sangue: "vermelho", fenix: "vermelho", caotico: "arco-iris" };
    const storedSkinId = localStorage.getItem(SKIN_KEY);
    const savedSkinId = migrations[storedSkinId] || storedSkinId || "azul-neon";
    const selected = skins.find((skin) => skin.id === savedSkinId && skin.unlocked());
    if (selected) return selected;
    localStorage.setItem(SKIN_KEY, "azul-neon");
    return skins[0];
  }

/*__ECHO_SECTION_END:0027__*/
