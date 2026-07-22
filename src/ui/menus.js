/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0044__*/
  function setStartStatus(message = "", isError = false) {
    ui.startStatus.textContent = message;
    ui.startStatus.classList.toggle("is-error", isError);
  }

  function setSelectedMode(mode) {
    selectedMode = ["solo", "multiplayer", "training"].includes(mode) ? mode : "solo";
    const multiplayer = selectedMode === "multiplayer";
    const training = selectedMode === "training";
    ui.soloMode.classList.toggle("is-selected", selectedMode === "solo");
    ui.multiplayerMode.classList.toggle("is-selected", multiplayer);
    ui.trainingMode?.classList.toggle("is-selected", training);
    ui.soloMode.setAttribute("aria-pressed", String(selectedMode === "solo"));
    ui.multiplayerMode.setAttribute("aria-pressed", String(multiplayer));
    ui.trainingMode?.setAttribute("aria-pressed", String(training));
    ui.multiplayerFields.classList.toggle("is-hidden", !multiplayer);
    ui.start.classList.toggle("is-multiplayer", multiplayer);
    const quickActions = document.getElementById("online-quick-actions");
    if (quickActions) quickActions.classList.toggle("is-hidden", !multiplayer);
    ui.startSubmit.querySelector("span").textContent = multiplayer ? "ENTRAR NA SALA" : "JOGAR";
    setStartStatus();
    if (multiplayer) refreshRooms();
    if (typeof savePreparation === "function") savePreparation({ server: false });
  }

/*__ECHO_SECTION_END:0044__*/
/*__ECHO_SECTION:0047__*/
  function openWorkshop() {
    updateWorkshopUI();
    ui.workshop.classList.remove("is-hidden");
    sound(262, 0.3, "sine", 0.03);
  }

  function closeWorkshop() {
    ui.workshop.classList.add("is-hidden");
    loadProfile();
  }

/*__ECHO_SECTION_END:0047__*/
/*__ECHO_SECTION:0116__*/
  function showLoadoutScreen() {
    state = "loadout";
    renderLoadoutScreen();
    ui.loadoutScreen.classList.remove("is-hidden");
    sound(262, 0.35, "sine", 0.03);
  }

  function renderLoadoutScreen() {
    if (!ui.loadoutSlots || !ui.loadoutAvailable) return;
    ui.loadoutSlots.replaceChildren();
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement("div");
      slot.className = "loadout-slot";
      const mutationId = playerLoadout[i];
      if (mutationId) {
        const mutation = mutations.find((m) => m.id === mutationId);
        if (mutation) {
          const level = playerOwnedMutations[mutationId] || 1;
          slot.style.setProperty("--slot-color", mutation.color);
          slot.innerHTML = `
            <span class="mutation-symbol" aria-hidden="true">${mutation.symbol}</span>
            <strong>${mutation.name}</strong>
            <small>NÍVEL ${["I", "II", "III"][level - 1]} — ATIVA AOS ${MUTATION_THRESHOLDS[i]} PONTOS</small>
            <button class="loadout-remove" data-slot="${i}" type="button">✕</button>
          `;
        }
      } else {
        slot.innerHTML = `<span class="slot-empty">SLOT ${i + 1}</span><small>ATIVA AOS ${MUTATION_THRESHOLDS[i]} PONTOS</small>`;
      }
      ui.loadoutSlots.append(slot);
    }
    ui.loadoutSlots.querySelectorAll(".loadout-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const slotIndex = Number(btn.dataset.slot);
        playerLoadout[slotIndex] = null;
        renderLoadoutScreen();
      });
    });

    ui.loadoutAvailable.replaceChildren();
    const ownedIds = Object.keys(playerOwnedMutations);
    const equippedSet = new Set(playerLoadout.filter(Boolean));
    for (const mutationId of ownedIds) {
      if (equippedSet.has(mutationId)) continue;
      const mutation = mutations.find((m) => m.id === mutationId);
      if (!mutation) continue;
      const level = playerOwnedMutations[mutationId] || 1;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mutation-card";
      card.style.setProperty("--card-color", mutation.color);
      card.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true">${mutation.symbol}</span>
        <small>${mutation.tag} — NÍVEL ${["I", "II", "III"][level - 1]}</small>
        <h3>${mutation.name}</h3>
        <p>${mutation.tiers[level - 1]?.desc || mutation.description}</p>
      `;
      card.addEventListener("click", () => {
        const emptySlot = playerLoadout.indexOf(null);
        if (emptySlot === -1) {
          showToast("TODOS OS SLOTS PREENCHIDOS", 1500);
          return;
        }
        playerLoadout[emptySlot] = mutationId;
        renderLoadoutScreen();
        sound(330, 0.2, "triangle", 0.03);
      });
      ui.loadoutAvailable.append(card);
    }
    if (ownedIds.length === 0) {
      ui.loadoutAvailable.innerHTML = `<p style="color:rgba(205,197,220,0.5);text-align:center;grid-column:1/-1;padding:20px">NENHUM BÔNUS DESBLOQUEADO. VOLTE E ABRA “DESBLOQUEAR BÔNUS”.</p>`;
    }
  }

/*__ECHO_SECTION_END:0116__*/
/*__ECHO_SECTION:0052__*/
  function returnToMenu(message = "", isError = false) {
    if (multiplayerSocket) {
      const socket = multiplayerSocket;
      multiplayerSocket = null;
      socket.close();
    }
    stopMusic();
    state = "intro";
    activeMode = selectedMode;
    pausedFromState = null;
    if (ui.joystickZone) ui.joystickZone.classList.remove("is-joy-active");
    ui.pause.classList.add("is-hidden");
    ui.gameover.classList.add("is-hidden");
    ui.mutation.classList.add("is-hidden");
    ui.loadoutScreen?.classList.add("is-hidden");
    ui.start.classList.remove("is-hidden");
    document.body.classList.remove("is-playing");
    setStartStatus(message, isError);
    loadProfile();
    if (selectedMode === "multiplayer") refreshRooms();
  }

/*__ECHO_SECTION_END:0052__*/
/*__ECHO_SECTION:0101__*/
  function openPause() {
    if (state !== "playing") return;
    endPhase();
    stopMusic();
    pausedFromState = state;
    state = "paused";
    if (ui.joystickZone) ui.joystickZone.classList.remove("is-joy-active");
    ui.pauseCopy.textContent = activeMode === "multiplayer"
      ? "A interface está pausada, mas a partida continua no servidor local."
      : "A simulação solo está congelada.";
    ui.pause.classList.remove("is-hidden");
    ui.resume.focus();
  }

  function closePause() {
    if (state !== "paused") return;
    state = pausedFromState || "playing";
    pausedFromState = null;
    if (activeMode === "solo") startMusic();
    if (ui.joystickZone) ui.joystickZone.classList.add("is-joy-active");
    ui.pause.classList.add("is-hidden");
    canvas.focus?.();
  }

/*__ECHO_SECTION_END:0101__*/
