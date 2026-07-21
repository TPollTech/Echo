/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0007__*/
  const mutations = [
    {
      id: "blade",
      name: "Lâmina de Retorno",
      tag: "OFENSIVA",
      symbol: "⟋",
      color: "#ff4fd8",
      description: "O rastro rompido causa mais dano e permanece perigoso por um instante.",
      tiers: [
        { label: "I", desc: "+40% dano de rastro, +0.28 ribbonLife" },
        { label: "II", desc: "+60% dano de rastro, +0.42 ribbonLife" },
        { label: "III", desc: "+85% dano de rastro, +0.55 ribbonLife, rastro persistente" }
      ],
      apply(player, level = 1) {
        const m = [1.4, 1.6, 1.85][level - 1];
        const r = [0.28, 0.42, 0.55][level - 1];
        player.trailDamage *= m;
        player.ribbonLife += r;
        player.trailLinger = [0.38, 0.48, 0.6][level - 1];
      }
    },
    {
      id: "shell",
      name: "Casulo Prismático",
      tag: "DEFESA",
      symbol: "◇",
      color: "#a88cff",
      description: "Seu núcleo abandonado recebe menos dano enquanto você está projetado.",
      tiers: [
        { label: "I", desc: "55% menos dano ao núcleo" },
        { label: "II", desc: "65% menos dano ao núcleo" },
        { label: "III", desc: "78% menos dano ao núcleo" }
      ],
      apply(player, level = 1) { player.shellDefense = [0.45, 0.35, 0.22][level - 1]; }
    },
    {
      id: "siphon",
      name: "Sifão Harmônico",
      tag: "SUSTENTAÇÃO",
      symbol: "⌁",
      color: "#45e6ff",
      description: "Cada inimigo atravessado devolve carga e restaura integridade.",
      tiers: [
        { label: "I", desc: "Restaura carga e vida ao atravessar" },
        { label: "II", desc: "Restaura +40% mais carga e vida" },
        { label: "III", desc: "Restaura +80% mais carga e vida" }
      ],
      apply(player, level = 1) {
        player.siphon = true;
        player.siphonBonus = [1, 1.4, 1.8][level - 1];
      }
    },
    {
      id: "drift",
      name: "Deriva Temporal",
      tag: "MOBILIDADE",
      symbol: "≫",
      color: "#78ffba",
      description: "A projeção se move mais rápido e consome menos carga.",
      tiers: [
        { label: "I", desc: "+18% velocidade, -25% carga" },
        { label: "II", desc: "+28% velocidade, -35% carga" },
        { label: "III", desc: "+40% velocidade, -48% carga" }
      ],
      apply(player, level = 1) {
        player.phaseSpeed *= [1.18, 1.28, 1.4][level - 1];
        player.phaseDrain *= [0.75, 0.65, 0.52][level - 1];
      }
    },
    {
      id: "nova",
      name: "Nova de Chegada",
      tag: "CONTROLE",
      symbol: "✦",
      color: "#ffd86b",
      description: "Ao materializar, uma onda empurra e fere sinais próximos.",
      tiers: [
        { label: "I", desc: "Onda de dano ao materializar" },
        { label: "II", desc: "+50% raio da nova" },
        { label: "III", desc: "+100% raio da nova, +30% dano" }
      ],
      apply(player, level = 1) {
        player.arrivalNova = true;
        player.novaRadiusBonus = [1, 1.5, 2][level - 1];
      }
    },
    {
      id: "reweave",
      name: "Trama Regenerativa",
      tag: "EVOLUÇÃO",
      symbol: "∞",
      color: "#ff8cb7",
      description: "Fragmentos restauram integridade. Combos longos aceleram a regeneração.",
      tiers: [
        { label: "I", desc: "Fragmentos curam ao coletar" },
        { label: "II", desc: "+50% cura por fragmento" },
        { label: "III", desc: "+100% cura por fragmento" }
      ],
      apply(player, level = 1) {
        player.moteHealing = true;
        player.healScale = [1, 1.5, 2][level - 1];
      }
    },
    {
      id: "focus",
      name: "Foco de Lúmen",
      tag: "PRECISÃO",
      symbol: "◎",
      color: "#72f1ff",
      description: "Rupturas recalibram mais rápido, favorecendo ataques precisos em sequência.",
      tiers: [
        { label: "I", desc: "-35% cooldown" },
        { label: "II", desc: "-48% cooldown" },
        { label: "III", desc: "-60% cooldown" }
      ],
      apply(player, level = 1) { player.cooldownScale *= [0.65, 0.52, 0.4][level - 1]; }
    },
    {
      id: "gravity",
      name: "Gravidade de Íris",
      tag: "COLETA",
      symbol: "◉",
      color: "#b792ff",
      description: "Fragmentos próximos são atraídos pelo núcleo e pelo eco projetado.",
      tiers: [
        { label: "I", desc: "+34px raio de coleta" },
        { label: "II", desc: "+52px raio de coleta" },
        { label: "III", desc: "+72px raio de coleta" }
      ],
      apply(player, level = 1) { player.pickupRadius += [34, 52, 72][level - 1]; }
    },
    {
      id: "resonance",
      name: "Fome de Ressonância",
      tag: "EXECUÇÃO",
      symbol: "⌾",
      color: "#ff6f91",
      description: "Cada ruptura restaura integridade e preenche uma grande parte da carga.",
      tiers: [
        { label: "I", desc: "Rupturas restauram vida e carga" },
        { label: "II", desc: "+50% restauração por ruptura" },
        { label: "III", desc: "+100% restauração por ruptura" }
      ],
      apply(player, level = 1) {
        player.killRestore = true;
        player.killRestoreHealBonus = [1, 1.5, 2][level - 1];
      }
    },
    {
      id: "afterimage",
      name: "Pós-imagem Hostil",
      tag: "CONTROLE",
      symbol: "≋",
      color: "#ef74ff",
      description: "O rastro permanece no campo por mais tempo e conserva sua zona de perigo.",
      tiers: [
        { label: "I", desc: "+0.45 ribbonLife, +0.22 linger" },
        { label: "II", desc: "+0.65 ribbonLife, +0.35 linger" },
        { label: "III", desc: "+0.9 ribbonLife, +0.5 linger" }
      ],
      apply(player, level = 1) {
        player.ribbonLife += [0.45, 0.65, 0.9][level - 1];
        player.trailLinger += [0.22, 0.35, 0.5][level - 1];
      }
    },
    {
      id: "overclock",
      name: "Sobrecarga Carmesim",
      tag: "RISCO",
      symbol: "ϟ",
      color: "#ff725e",
      description: "Projeções ficam mais velozes e causam mais dano, mas consomem carga adicional.",
      tiers: [
        { label: "I", desc: "+12% vel, +25% dano, +15% carga" },
        { label: "II", desc: "+20% vel, +40% dano, +12% carga" },
        { label: "III", desc: "+30% vel, +60% dano, +8% carga" }
      ],
      apply(player, level = 1) {
        player.phaseSpeed *= [1.12, 1.2, 1.3][level - 1];
        player.trailDamage *= [1.25, 1.4, 1.6][level - 1];
        player.phaseDrain *= [1.15, 1.12, 1.08][level - 1];
      }
    },
    {
      id: "prism",
      name: "Janela Prismática",
      tag: "DEFESA",
      symbol: "⬡",
      color: "#7fffc8",
      description: "Ao materializar após um ataque, você recebe uma breve janela de proteção.",
      tiers: [
        { label: "I", desc: "0.7s de proteção ao materializar" },
        { label: "II", desc: "1.0s de proteção ao materializar" },
        { label: "III", desc: "1.4s de proteção ao materializar" }
      ],
      apply(player, level = 1) { player.arrivalGuard = [0.7, 1.0, 1.4][level - 1]; }
    },
    {
      id: "chain",
      name: "Corrente Viva",
      tag: "EXECUÇÃO",
      symbol: "⚡",
      color: "#ffe066",
      description: "Rupturas em sequência causam dano cumulativo por combo.",
      tiers: [
        { label: "I", desc: "+30% dano por combo (2s)" },
        { label: "II", desc: "+45% dano por combo (2.5s)" },
        { label: "III", desc: "+65% dano por combo (3s)" }
      ],
      apply(player, level = 1) {
        player.chainDamage = true;
        player.chainWindow = [2, 2.5, 3][level - 1];
        player.chainMaxStacks = [5, 7, 10][level - 1];
      }
    },
    {
      id: "ghostwall",
      name: "Muralha Fantasma",
      tag: "DEFESA",
      symbol: "◈",
      color: "#c8b8ff",
      description: "Ao receber dano fatal, sobrevive com 1 HP. Ativa-se apenas uma vez por run.",
      tiers: [
        { label: "I", desc: "Sobrevive com 1 HP uma vez" },
        { label: "II", desc: "Sobrevive + onda de dano ao redor" },
        { label: "III", desc: "Sobrevive + nova explosiva + 2s de invulnerabilidade" }
      ],
      apply(player, level = 1) {
        player.ghostWall = true;
        player.ghostWallUsed = false;
        player.ghostwallNova = level >= 2;
      }
    },
    {
      id: "vortex",
      name: "Vórtice Gravitacional",
      tag: "CONTROLE",
      symbol: "⊛",
      color: "#5ce0d2",
      description: "O eco projetado atrai inimigos próximos durante a projeção.",
      tiers: [
        { label: "I", desc: "Atrai inimigos durante projeção" },
        { label: "II", desc: "+50% força de atração" },
        { label: "III", desc: "+100% força de atração, +30% raio" }
      ],
      apply(player, level = 1) {
        player.vortexPull = true;
        player.vortexPullBonus = [1, 1.5, 2][level - 1];
      }
    },
    {
      id: "reversal",
      name: "Sifão Inverso",
      tag: "RISCO",
      symbol: "⊘",
      color: "#ff5a5a",
      description: "Dano recebido é parcialmente devolvido ao atacante, mas cura é reduzida.",
      tiers: [
        { label: "I", desc: "30% reflexão, -40% cura" },
        { label: "II", desc: "45% reflexão, -30% cura" },
        { label: "III", desc: "60% reflexão, -20% cura" }
      ],
      apply(player, level = 1) {
        player.reversal = true;
        player.healScale *= [0.6, 0.7, 0.8][level - 1];
      }
    },
    {
      id: "dualphase",
      name: "Ressonância Dupla",
      tag: "MOBILIDADE",
      symbol: "⟐",
      color: "#88ddff",
      description: "Pode projetar o eco duas vezes antes de recalibrar.",
      tiers: [
        { label: "I", desc: "2 projeções antes de cooldown" },
        { label: "II", desc: "3 projeções antes de cooldown" },
        { label: "III", desc: "3 projeções, -20% cooldown no 2º uso" }
      ],
      apply(player, level = 1) {
        player.dualPhase = true;
        player.dualPhaseCharges = [2, 3, 3][level - 1];
        player.dualPhaseUsed = 0;
      }
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
      const loadout = playerLoadout || [];
      const nextMutationId = loadout[player.nextMutationIndex];
      if (nextMutationId) {
        const ownedLevel = (playerOwnedMutations || {})[nextMutationId] || 1;
        const mutation = mutations.find((m) => m.id === nextMutationId);
        if (mutation) {
          mutationPending = true;
          window.setTimeout(() => chooseMutation(mutation, ownedLevel), 180);
          return;
        }
      }
      player.nextMutationIndex += 1;
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

  function chooseMutation(mutation, level = 1) {
    mutation.apply(player, level);
    player.mutations.push(mutation.id);
    player.mutationLevels = player.mutationLevels || {};
    player.mutationLevels[mutation.id] = level;
    player.nextMutationIndex += 1;
    mutationPending = false;
    state = "playing";
    ui.mutation.classList.add("is-hidden");
    updateMutationSlots();
    checkSynergies();
    showToast(`${mutation.name.toUpperCase()} NÍVEL ${["I", "II", "III"][level - 1]} INTEGRADA`, 1800);
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
