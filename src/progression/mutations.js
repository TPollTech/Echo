/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0007__*/
  const mutations = [
    {
      id: "blade",
      name: "Lâmina de Retorno",
      tag: "OFENSIVA",
      symbol: "⟋",
      color: "#ff4fd8",
      description: "O rastro rompido causa 40% mais dano e permanece perigoso por um instante.",
      apply(player) {
        player.trailDamage *= 1.4;
        player.ribbonLife += 0.28;
        player.trailLinger = 0.38;
      }
    },
    {
      id: "shell",
      name: "Casulo Prismático",
      tag: "DEFESA",
      symbol: "◇",
      color: "#a88cff",
      description: "Seu núcleo abandonado recebe 55% menos dano enquanto você está projetado.",
      apply(player) { player.shellDefense = 0.45; }
    },
    {
      id: "siphon",
      name: "Sifão Harmônico",
      tag: "SUSTENTAÇÃO",
      symbol: "⌁",
      color: "#45e6ff",
      description: "Cada inimigo atravessado devolve carga e restaura uma parte da integridade.",
      apply(player) { player.siphon = true; }
    },
    {
      id: "drift",
      name: "Deriva Temporal",
      tag: "MOBILIDADE",
      symbol: "≫",
      color: "#78ffba",
      description: "A projeção se move 18% mais rápido e consome 25% menos carga.",
      apply(player) { player.phaseSpeed *= 1.18; player.phaseDrain *= 0.75; }
    },
    {
      id: "nova",
      name: "Nova de Chegada",
      tag: "CONTROLE",
      symbol: "✦",
      color: "#ffd86b",
      description: "Ao materializar, uma onda empurra e fere sinais próximos ao ponto de chegada.",
      apply(player) { player.arrivalNova = true; }
    },
    {
      id: "reweave",
      name: "Trama Regenerativa",
      tag: "EVOLUÇÃO",
      symbol: "∞",
      color: "#ff8cb7",
      description: "Fragmentos restauram integridade. Combos longos aceleram a regeneração.",
      apply(player) { player.moteHealing = true; }
    },
    {
      id: "focus",
      name: "Foco de Lúmen",
      tag: "PRECISÃO",
      symbol: "◎",
      color: "#72f1ff",
      description: "Rupturas recalibram 35% mais rápido, favorecendo ataques precisos em sequência.",
      apply(player) { player.cooldownScale *= 0.65; }
    },
    {
      id: "gravity",
      name: "Gravidade de Íris",
      tag: "COLETA",
      symbol: "◉",
      color: "#b792ff",
      description: "Fragmentos próximos são atraídos pelo núcleo e pelo eco projetado.",
      apply(player) { player.pickupRadius += 34; }
    },
    {
      id: "resonance",
      name: "Fome de Ressonância",
      tag: "EXECUÇÃO",
      symbol: "⌾",
      color: "#ff6f91",
      description: "Cada ruptura restaura integridade e preenche uma grande parte da carga.",
      apply(player) { player.killRestore = true; }
    },
    {
      id: "afterimage",
      name: "Pós-imagem Hostil",
      tag: "CONTROLE",
      symbol: "≋",
      color: "#ef74ff",
      description: "O rastro permanece no campo por mais tempo e conserva sua zona de perigo.",
      apply(player) { player.ribbonLife += 0.45; player.trailLinger += 0.22; }
    },
    {
      id: "overclock",
      name: "Sobrecarga Carmesim",
      tag: "RISCO",
      symbol: "ϟ",
      color: "#ff725e",
      description: "Projeções ficam mais velozes e causam mais dano, mas consomem carga adicional.",
      apply(player) { player.phaseSpeed *= 1.12; player.trailDamage *= 1.25; player.phaseDrain *= 1.15; }
    },
    {
      id: "prism",
      name: "Janela Prismática",
      tag: "DEFESA",
      symbol: "⬡",
      color: "#7fffc8",
      description: "Ao materializar após um ataque, você recebe uma breve janela de proteção.",
      apply(player) { player.arrivalGuard = 0.7; }
    },
    {
      id: "chain",
      name: "Corrente Viva",
      tag: "EXECUÇÃO",
      symbol: "⚡",
      color: "#ffe066",
      description: "Rupturas em sequência (2s) causam +30% de dano cumulativo por combo.",
      apply(player) { player.chainDamage = true; }
    },
    {
      id: "ghostwall",
      name: "Muralha Fantasma",
      tag: "DEFESA",
      symbol: "◈",
      color: "#c8b8ff",
      description: "Ao receber dano fatal, sobrevive com 1 HP. Ativa-se apenas uma vez por run.",
      apply(player) { player.ghostWall = true; player.ghostWallUsed = false; }
    },
    {
      id: "vortex",
      name: "Vórtice Gravitacional",
      tag: "CONTROLE",
      symbol: "⊛",
      color: "#5ce0d2",
      description: "O eco projetado atrai inimigos próximos durante a projeção, puxando-os para o rastro.",
      apply(player) { player.vortexPull = true; }
    },
    {
      id: "reversal",
      name: "Sifão Inverso",
      tag: "RISCO",
      symbol: "⊘",
      color: "#ff5a5a",
      description: "Dano recebido é parcialmente devolvido ao atacante, mas cura é reduzida em 40%.",
      apply(player) { player.reversal = true; player.healScale *= 0.6; }
    },
    {
      id: "dualphase",
      name: "Ressonância Dupla",
      tag: "MOBILIDADE",
      symbol: "⟐",
      color: "#88ddff",
      description: "Pode projetar o eco duas vezes antes de recalibrar. O cooldown só aplica no 2º uso.",
      apply(player) { player.dualPhase = true; player.dualPhaseCharges = 2; player.dualPhaseUsed = 0; }
    }
  ];

/*__ECHO_SECTION_END:0007__*/
/*__ECHO_SECTION:0013__*/
  let mutationPending = false;
/*__ECHO_SECTION_END:0013__*/
/*__ECHO_SECTION:0028__*/
  const MUTATION_STATE_KEYS = [
    "trailDamage", "ribbonLife", "trailLinger", "cooldownScale", "pickupRadius",
    "shellDefense", "siphon", "killRestore", "phaseSpeed", "phaseDrain",
    "arrivalNova", "arrivalGuard", "moteHealing", "healScale", "chainDamage",
    "chainCombo", "chainTimer", "ghostWall", "ghostWallUsed", "vortexPull",
    "reversal", "dualPhase", "dualPhaseCharges", "dualPhaseUsed",
    "ribbonWidthBonus", "ribbonLingerDamageBonus", "killRestoreHealBonus",
    "siphonBonus", "novaRadiusBonus", "vortexPullBonus", "chainWindow",
    "chainMaxStacks", "phasePickupBonus", "ghostwallNova"
  ];

  function snapshotMutationState(target) {
    const snapshot = {};
    for (const key of MUTATION_STATE_KEYS) snapshot[key] = target[key];
    return snapshot;
  }

  function restoreMutationState(target, snapshot) {
    if (!snapshot) return;
    for (const key of MUTATION_STATE_KEYS) target[key] = snapshot[key];
  }

  function captureMutationBaseline(target) {
    target.mutationBaseline = snapshotMutationState(target);
  }

/*__ECHO_SECTION_END:0028__*/
/*__ECHO_SECTION:0069__*/
  function checkMutation() {
    if (activeMode !== "solo" || player.silenced) return;
    const threshold = MUTATION_THRESHOLDS[player.nextMutationIndex];
    if (threshold && player.score >= threshold && !mutationPending) {
      mutationPending = true;
      window.setTimeout(showMutationChoice, 180);
    }
  }

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

  function chooseMutation(mutation) {
    mutation.apply(player);
    player.mutations.push(mutation.id);
    player.nextMutationIndex += 1;
    mutationPending = false;
    state = "playing";
    ui.mutation.classList.add("is-hidden");
    updateMutationSlots();
    checkSynergies();
    showToast(`${mutation.name.toUpperCase()} INTEGRADA`, 1800);
    spawnWave(player.x, player.y, player.hue, 130, 0.9);
    burst(player.x, player.y, player.hue, 24);
    sound(330, 0.34, "triangle", 0.05);
  }

/*__ECHO_SECTION_END:0069__*/
/*__ECHO_SECTION:0071__*/
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

/*__ECHO_SECTION_END:0071__*/
