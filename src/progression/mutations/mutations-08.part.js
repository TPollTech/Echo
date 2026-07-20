  function showMutationChoice() {
    if (activeMode !== "solo" || state !== "playing") return;
    state = "mutating";
    endPhase();
    const available = mutations.filter((mutation) => !player.mutations.includes(mutation.id));
    const choices = available.sort(() => Math.random() - 0.5).slice(0, 3);
    ui.mutationCards.replaceChildren();
    for (const mutation of choices) {
      const button = document.createElement("button");
      button.className = "mutation-card";
      button.type = "button";
      button.style.setProperty("--card-color", mutation.color);
      const relatedSynergies = synergies.filter((s) => s.requires.includes(mutation.id));
      let synergyHint = "";
      if (relatedSynergies.length > 0) {
        synergyHint = `<span class="synergy-hint">${relatedSynergies.map((s) => {
          const missing = s.requires.filter((r) => r !== mutation.id && !player.mutations.includes(r));
          return missing.length > 0 ? `<span style="color:${s.color}">⟳ ${s.name} <small>(${missing.join(", ")})</small></span>` : "";
        }).filter(Boolean).join("")}</span>`;
      }
      button.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true">${mutation.symbol}</span>
        <small>${mutation.tag}</small>
        <h3>${mutation.name}</h3>
        <p>${mutation.description}</p>
        ${synergyHint}
        <b aria-hidden="true">↗</b>
      `;
      button.addEventListener("click", () => chooseMutation(mutation));
      ui.mutationCards.append(button);
    }
    ui.mutation.classList.remove("is-hidden");
    sound(262, 0.45, "sine", 0.035);
    setTimeout(() => sound(524, 0.35, "sine", 0.025), 90);
  }

