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

