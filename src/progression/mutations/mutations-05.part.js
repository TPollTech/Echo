  function updateMutationSlots() {
    ui.mutationSlots.replaceChildren();
    for (const id of player.mutations) {
      const mutation = mutations.find((item) => item.id === id);
      const chip = document.createElement("span");
      chip.className = "mutation-chip";
      chip.style.setProperty("--chip-color", mutation.color);
      chip.innerHTML = `<i></i>${mutation.name.toUpperCase()}`;
      ui.mutationSlots.append(chip);
    }
    for (const id of player.activeSynergies) {
      const synergy = synergies.find((item) => item.id === id);
      const chip = document.createElement("span");
      chip.className = "mutation-chip synergy-chip";
      chip.style.setProperty("--chip-color", synergy.color);
      chip.innerHTML = `<i></i>${synergy.name}`;
      ui.mutationSlots.append(chip);
    }
  }

