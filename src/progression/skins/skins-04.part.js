  function selectSkin(skin) {
    localStorage.setItem(SKIN_KEY, skin.id);
    ui.skin.classList.add("is-hidden");
    showToast(`FREQUÊNCIA VISUAL: ${skin.name}`, 1500);
    showModifierScreen();
  }

