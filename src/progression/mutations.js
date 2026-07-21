/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0007__*/
  const mutations = [
    {
      id: "blade",
      name: "Rastro Forte",
      tag: "OFENSIVA",
      symbol: "⟋",
      color: "#ff4fd8",
      description: "Seu rastro causa mais dano e continua ativo por mais tempo.",
      tiers: [
        { label: "I", desc: "+40% de dano e +0,28 s de duração" },
        { label: "II", desc: "+60% de dano e +0,42 s de duração" },
        { label: "III", desc: "+85% de dano e +0,55 s de duração" }
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
      name: "Proteção do Corpo",
      tag: "DEFESA",
      symbol: "◇",
      color: "#a88cff",
      description: "Seu personagem recebe menos dano enquanto você controla a projeção.",
      tiers: [
        { label: "I", desc: "55% menos dano recebido" },
        { label: "II", desc: "65% menos dano recebido" },
        { label: "III", desc: "78% menos dano recebido" }
      ],
      apply(player, level = 1) { player.shellDefense = [0.45, 0.35, 0.22][level - 1]; }
    },
    {
      id: "siphon",
      name: "Recuperação ao Atacar",
      tag: "SUSTENTAÇÃO",
      symbol: "⌁",
      color: "#45e6ff",
      description: "Atravessar um inimigo recupera vida e energia.",
      tiers: [
        { label: "I", desc: "Recupera vida e energia ao atravessar" },
        { label: "II", desc: "+40% de recuperação" },
        { label: "III", desc: "+80% de recuperação" }
      ],
      apply(player, level = 1) {
        player.siphon = true;
        player.siphonBonus = [1, 1.4, 1.8][level - 1];
      }
    },
    {
      id: "drift",
      name: "Projeção Rápida",
      tag: "MOBILIDADE",
      symbol: "≫",
      color: "#78ffba",
      description: "A projeção se move mais rápido e consome menos energia.",
      tiers: [
        { label: "I", desc: "+18% de velocidade, -25% de custo de energia" },
        { label: "II", desc: "+28% de velocidade, -35% de custo de energia" },
        { label: "III", desc: "+40% de velocidade, -48% de custo de energia" }
      ],
      apply(player, level = 1) {
        player.phaseSpeed *= [1.18, 1.28, 1.4][level - 1];
        player.phaseDrain *= [0.75, 0.65, 0.52][level - 1];
      }
    },
    {
      id: "nova",
      name: "Impacto de Retorno",
      tag: "CONTROLE",
      symbol: "✦",
      color: "#ffd86b",
      description: "Ao voltar para o personagem, uma onda causa dano e empurra inimigos próximos.",
      tiers: [
        { label: "I", desc: "Causa uma onda de dano ao retornar" },
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
      name: "Cura por Fragmentos",
      tag: "EVOLUÇÃO",
      symbol: "∞",
      color: "#ff8cb7",
      description: "Coletar fragmentos recupera vida.",
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
      name: "Recarga Rápida",
      tag: "PRECISÃO",
      symbol: "◎",
      color: "#72f1ff",
      description: "Reduz o tempo necessário para usar o ataque novamente.",
      tiers: [
        { label: "I", desc: "35% menos tempo de recarga" },
        { label: "II", desc: "48% menos tempo de recarga" },
        { label: "III", desc: "60% menos tempo de recarga" }
      ],
      apply(player, level = 1) { player.cooldownScale *= [0.65, 0.52, 0.4][level - 1]; }
    },
    {
      id: "gravity",
      name: "Coleta Ampliada",
      tag: "COLETA",
      symbol: "◉",
      color: "#b792ff",
      description: "Aumenta a distância em que os fragmentos são coletados.",
      tiers: [
        { label: "I", desc: "+34px raio de coleta" },
        { label: "II", desc: "+52px raio de coleta" },
        { label: "III", desc: "+72px raio de coleta" }
      ],
      apply(player, level = 1) { player.pickupRadius += [34, 52, 72][level - 1]; }
    },
    {
      id: "resonance",
      name: "Recuperação por Eliminação",
      tag: "EXECUÇÃO",
      symbol: "⌾",
      color: "#ff6f91",
      description: "Cada eliminação recupera vida e energia.",
      tiers: [
        { label: "I", desc: "Eliminações recuperam vida e energia" },
        { label: "II", desc: "+50% de recuperação por eliminação" },
        { label: "III", desc: "+100% de recuperação por eliminação" }
      ],
      apply(player, level = 1) {
        player.killRestore = true;
        player.killRestoreHealBonus = [1, 1.5, 2][level - 1];
      }
    },
    {
      id: "afterimage",
      name: "Rastro Duradouro",
      tag: "CONTROLE",
      symbol: "≋",
      color: "#ef74ff",
      description: "Seu rastro permanece no campo e causa dano por mais tempo.",
      tiers: [
        { label: "I", desc: "+0,45 s de rastro e +0,22 s de dano" },
        { label: "II", desc: "+0,65 s de rastro e +0,35 s de dano" },
        { label: "III", desc: "+0,9 s de rastro e +0,5 s de dano" }
      ],
      apply(player, level = 1) {
        player.ribbonLife += [0.45, 0.65, 0.9][level - 1];
        player.trailLinger += [0.22, 0.35, 0.5][level - 1];
      }
    },
    {
      id: "overclock",
      name: "Mais Velocidade e Dano",
      tag: "RISCO",
      symbol: "ϟ",
      color: "#ff725e",
      description: "A projeção fica mais rápida e forte, mas consome mais energia.",
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
      name: "Proteção ao Retornar",
      tag: "DEFESA",
      symbol: "⬡",
      color: "#7fffc8",
      description: "Depois de retornar ao personagem, você fica protegido por alguns segundos.",
      tiers: [
        { label: "I", desc: "0,7 s de proteção ao retornar" },
        { label: "II", desc: "1 s de proteção ao retornar" },
        { label: "III", desc: "1,4 s de proteção ao retornar" }
      ],
      apply(player, level = 1) { player.arrivalGuard = [0.7, 1.0, 1.4][level - 1]; }
    },
    {
      id: "chain",
      name: "Combo de Dano",
      tag: "EXECUÇÃO",
      symbol: "⚡",
      color: "#ffe066",
      description: "Eliminações em sequência aumentam o dano do combo.",
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
      name: "Segunda Chance",
      tag: "DEFESA",
      symbol: "◈",
      color: "#c8b8ff",
      description: "Ao receber dano fatal, você sobrevive com 1 de vida. Ativa uma vez por partida.",
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
      name: "Atração de Inimigos",
      tag: "CONTROLE",
      symbol: "⊛",
      color: "#5ce0d2",
      description: "A projeção puxa inimigos próximos na sua direção.",
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
      name: "Refletir Dano",
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
      name: "Projeções Extras",
      tag: "MOBILIDADE",
      symbol: "⟐",
      color: "#88ddff",
      description: "Permite usar a projeção mais vezes antes da recarga.",
      tiers: [
        { label: "I", desc: "2 projeções antes da recarga" },
        { label: "II", desc: "3 projeções antes da recarga" },
        { label: "III", desc: "3 projeções e recarga 20% mais rápida no segundo uso" }
      ],
      apply(player, level = 1) {
        player.dualPhase = true;
        player.dualPhaseCharges = [2, 3, 3][level - 1];
        player.dualPhaseUsed = 0;
      }
    }
  ];
  for (const mutation of mutations) mutation.compatibleClasses = Object.freeze([...(MUTATION_CLASS_COMPATIBILITY[mutation.id] || CLASS_IDS)]);

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
        if (mutation?.compatibleClasses.includes(player.classId)) {
          mutationPending = true;
          window.setTimeout(() => chooseMutation(mutation, ownedLevel), 180);
          return;
        }
      }
      mutationPending = true;
      window.setTimeout(showMutationChoice, 180);
    }
  }

  function showMutationChoice() {
    if (activeMode !== "solo" || state !== "playing") return;
    state = "mutating";
    if (ui.joystickZone) ui.joystickZone.classList.remove("is-joy-active");
    endPhase();
    const owned = Object.keys(playerOwnedMutations || {});
    const available = mutations.filter((mutation) => !player.mutations.includes(mutation.id)
      && mutation.compatibleClasses.includes(player.classId)
      && (owned.length === 0 || owned.includes(mutation.id)));
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
    if (ui.joystickZone) ui.joystickZone.classList.add("is-joy-active");
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
