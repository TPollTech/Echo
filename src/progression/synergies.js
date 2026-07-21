/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0008__*/
  const synergies = [
    {
      id: "blade-curtain",
      name: "CORTINA DE LÂMINAS",
      requires: ["blade", "afterimage"],
      color: "#ff4fd8",
      description: "Aumenta a largura do rastro em 50% e dobra o dano que permanece no chão.",
      apply(player) {
        player.ribbonWidthBonus = (player.ribbonWidthBonus || 1) * 1.5;
        player.ribbonLingerDamageBonus = (player.ribbonLingerDamageBonus || 1) * 2;
      }
    },
    {
      id: "devourer",
      name: "DEVORADOR",
      requires: ["siphon", "resonance"],
      color: "#45e6ff",
      description: "Dobra a cura recebida ao eliminar inimigos e ao absorver vida.",
      apply(player) {
        player.killRestoreHealBonus = (player.killRestoreHealBonus || 1) * 2;
        player.siphonBonus = (player.siphonBonus || 1) * 2;
      }
    },
    {
      id: "mirage",
      name: "MIRAGEM",
      requires: ["drift", "dualphase"],
      color: "#78ffba",
      description: "Permite usar três projeções e aumenta a velocidade delas em 25%.",
      apply(player) {
        player.dualPhaseCharges = 3;
        player.phaseSpeed *= 1.25;
      }
    },
    {
      id: "fortress",
      name: "FORTALEZA",
      requires: ["shell", "prism"],
      color: "#a88cff",
      description: "Dobra a duração da proteção ao retornar e reduz em 70% o dano recebido.",
      apply(player) {
        player.arrivalGuard *= 2;
        player.shellDefense = Math.min(player.shellDefense, 0.3);
      }
    },
    {
      id: "blackhole",
      name: "BURACO NEGRO",
      requires: ["nova", "vortex"],
      color: "#5ce0d2",
      description: "Aumenta o alcance da explosão em 80% e puxa os inimigos antes do dano.",
      apply(player) {
        player.novaRadiusBonus = (player.novaRadiusBonus || 1) * 1.8;
        player.vortexPullBonus = (player.vortexPullBonus || 1) * 1.5;
      }
    },
    {
      id: "vengeful-specter",
      name: "ESPECTRO VINGATIVO",
      requires: ["ghostwall", "reversal"],
      color: "#c8b8ff",
      description: "Ao ativar a proteção de retorno, causa uma explosão de dano ao redor do jogador.",
      apply(player) {
        player.ghostwallNova = true;
      }
    },
    {
      id: "combo-master",
      name: "MESTRE DO COMBO",
      requires: ["chain", "focus"],
      color: "#ffe066",
      description: "O combo pode continuar por 3 segundos e acumular até 8 ataques.",
      apply(player) {
        player.chainWindow = 3;
        player.chainMaxStacks = 8;
      }
    },
    {
      id: "supernova",
      name: "SUPERNOVA",
      requires: ["gravity", "overclock"],
      color: "#b792ff",
      description: "Durante a projeção, aumenta a coleta em 50% e a velocidade em 30%.",
      apply(player) {
        player.phasePickupBonus = (player.phasePickupBonus || 1) * 1.5;
        player.phaseSpeed *= 1.3;
      }
    }
  ];

/*__ECHO_SECTION_END:0008__*/
/*__ECHO_SECTION:0070__*/
  function checkSynergies() {
    for (const synergy of synergies) {
      if (player.activeSynergies.includes(synergy.id)) continue;
      const hasAll = synergy.requires.every((req) => player.mutations.includes(req));
      if (hasAll) {
        player.activeSynergies.push(synergy.id);
        synergy.apply(player);
        showToast(`SINERGIA: ${synergy.name}`, 2400);
        spawnWave(player.x, player.y, 42, 160, 1.1);
        burst(player.x, player.y, 42, 30);
        sound(440, 0.4, "triangle", 0.06);
        setTimeout(() => sound(660, 0.35, "sine", 0.04), 100);
      }
    }
    updateMutationSlots();
  }

/*__ECHO_SECTION_END:0070__*/
