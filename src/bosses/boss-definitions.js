/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0009__*/
  const bossTemplates = [
    {
      id: "coroa-vazia",
      name: "COROA VAZIA",
      roleLabel: "GUARDIÃO",
      hue: 326,
      radius: 34,
      phases: [
        { hpThreshold: 1, label: "GUARDIÃO", speed: 126, aggression: 1, radius: 34, attackDamage: 19, energy: 100, description: "Fase 1 — Padrão" },
        { hpThreshold: 0.5, label: "GUARDIÃO FURIOSO", speed: 160, aggression: 1, radius: 36, attackDamage: 26, energy: 100, description: "Fase 2 — Acelerado" },
        { hpThreshold: 0.2, label: "COROA PARTIDA", speed: 200, aggression: 1, radius: 38, attackDamage: 34, energy: 100, description: "Fase 3 — Enfurecido" }
      ],
      score: 900,
      spawnDialogue: "A COROA VAZIA ENTROU NO CAMPO",
      phaseDialogues: ["A COROA VAZIA SE TRANSFORMA!", "A COROA VAZIA SE ROMPE!"]
    },
    {
      id: "espectro-decisivo",
      name: "ESPECTRO DECISIVO",
      roleLabel: "FANTASMA",
      hue: 188,
      radius: 30,
      phases: [
        { hpThreshold: 1, label: "FANTASMA", speed: 150, aggression: 1, radius: 30, attackDamage: 16, energy: 100, description: "Fase 1 — Teleporta constantemente" },
        { hpThreshold: 0.55, label: "FANTASMA DUPLO", speed: 170, aggression: 1, radius: 28, attackDamage: 20, energy: 100, description: "Fase 2 — Cria um clone" },
        { hpThreshold: 0.2, label: "ESPECTRO DECISIVO", speed: 210, aggression: 1, radius: 32, attackDamage: 28, energy: 100, description: "Fase 3 — Clone + enxame" }
      ],
      score: 1100,
      spawnDialogue: "O ESPECTRO DECISIVO MATERIALIZA-SE",
      phaseDialogues: ["O ESPECTRO SE DUPLICA!", "O ESPECTRO DECISIVO SE MATERIALIZA POR COMPLETO!"]
    },
    {
      id: "tremor-deep",
      name: "TREMOR",
      roleLabel: "COLOSSO",
      hue: 28,
      radius: 42,
      phases: [
        { hpThreshold: 1, label: "COLOSSO", speed: 88, aggression: 1, radius: 42, attackDamage: 28, energy: 100, description: "Fase 1 — Lento mas devastador" },
        { hpThreshold: 0.5, label: "COLOSSO ERUPTIVO", speed: 105, aggression: 1, radius: 45, attackDamage: 35, energy: 100, description: "Fase 2 — Choques sísmicos" },
        { hpThreshold: 0.15, label: "TREMOR FINAL", speed: 130, aggression: 1, radius: 48, attackDamage: 44, energy: 100, description: "Fase 3 — Terremoto total" }
      ],
      score: 1300,
      spawnDialogue: "O TREMOR ENTROU NO CAMPO",
      phaseDialogues: ["O TREMOR FICOU MAIS RÁPIDO!", "O TREMOR ENTROU NA FASE FINAL!"]
    },
    {
      id: "necrostro",
      name: "NECRÓSTRO",
      roleLabel: "DESPERTAR",
      hue: 120,
      radius: 32,
      phases: [
        { hpThreshold: 1, label: "DESPERTAR", speed: 110, aggression: 0.8, radius: 32, attackDamage: 14, energy: 100, description: "Fase 1 — Cura aliados próximos" },
        { hpThreshold: 0.55, label: "NECRÓSTRO VIVO", speed: 120, aggression: 0.9, radius: 34, attackDamage: 18, energy: 100, description: "Fase 2 — Cura + escudo" },
        { hpThreshold: 0.2, label: "DESPERTAR FINAL", speed: 145, aggression: 1, radius: 36, attackDamage: 24, energy: 100, description: "Fase 3 — Cura explosiva e ataques mais fortes" }
      ],
      score: 1000,
      spawnDialogue: "O NECRÓSTRO REANIMA OS CAÍDOS",
      phaseDialogues: ["O NECRÓSTRO SE ALIMENTA DOS VIVOS!", "O DESPERTAR NÃO PODE SER CONTEMIDO!"]
    },
    {
      id: "vortice",
      name: "VÓRTICE",
      roleLabel: "ABISMO",
      hue: 240,
      radius: 36,
      phases: [
        { hpThreshold: 1, label: "ABISMO", speed: 100, aggression: 0.85, radius: 36, attackDamage: 16, energy: 100, description: "Fase 1 — Puxa todos os personagens" },
        { hpThreshold: 0.5, label: "VÓRTICE DUPLO", speed: 115, aggression: 0.9, radius: 38, attackDamage: 22, energy: 100, description: "Fase 2 — Vórtices orbitais" },
        { hpThreshold: 0.15, label: "ABISMO TOTAL", speed: 140, aggression: 1, radius: 40, attackDamage: 30, energy: 100, description: "Fase 3 — Gravidade reversa" }
      ],
      score: 1200,
      spawnDialogue: "O ABISMO SE ABRE",
      phaseDialogues: ["O VÓRTICE AUMENTOU A FORÇA!", "O VÓRTICE ENTROU NA FASE FINAL!"]
    },
    {
      id: "cicatriz",
      name: "CICATRIZ",
      roleLabel: "FERIDA",
      hue: 350,
      radius: 28,
      phases: [
        { hpThreshold: 1, label: "FERIDA", speed: 120, aggression: 0.85, radius: 28, attackDamage: 14, energy: 100, description: "Fase 1 — Deixa zonas de dano" },
        { hpThreshold: 0.5, label: "CICATRIZ ABERTA", speed: 135, aggression: 0.9, radius: 30, attackDamage: 20, energy: 100, description: "Fase 2 — Feridas explodem" },
        { hpThreshold: 0.18, label: "FERIDA MORTAL", speed: 155, aggression: 1, radius: 32, attackDamage: 28, energy: 100, description: "Fase 3 — O mapa inteiro é ferido" }
      ],
      score: 1100,
      spawnDialogue: "A CICATRIZ SE ABRE NO CAMPO",
      phaseDialogues: ["A FERIDA SE ALASTRA!", "NENHUM ESPAÇO FICA INTACTO!"]
    },
    {
      id: "mimico",
      name: "MÍMICO",
      roleLabel: "ESPELHO",
      hue: 45,
      radius: 26,
      phases: [
        { hpThreshold: 1, label: "ESPELHO", speed: 135, aggression: 0.85, radius: 26, attackDamage: 13, energy: 100, description: "Fase 1 — Copia 1 bônus" },
        { hpThreshold: 0.55, label: "MÍMICO DUPLO", speed: 150, aggression: 0.9, radius: 28, attackDamage: 18, energy: 100, description: "Fase 2 — Copia 2 bônus" },
        { hpThreshold: 0.2, label: "O ESPELHO QUEBRA", speed: 175, aggression: 1, radius: 30, attackDamage: 26, energy: 100, description: "Fase 3 — Copia todos os bônus" }
      ],
      score: 950,
      spawnDialogue: "O ESPELHO SE FORMA",
      phaseDialogues: ["O MÍMICO SE TORNA VOCÊ!", "O ESPELHO SE TORNA INFINITO!"]
    },
    {
      id: "prisma",
      name: "PRISMA",
      roleLabel: "ESPECTRO",
      hue: 160,
      radius: 24,
      phases: [
        { hpThreshold: 1, label: "ESPECTRO", speed: 155, aggression: 0.9, radius: 24, attackDamage: 12, energy: 100, description: "Fase 1 — Forma única" },
        { hpThreshold: 0.3, label: "FRACIONADO", speed: 170, aggression: 1, radius: 22, attackDamage: 16, energy: 100, description: "Fase 2 — Divide em 3" }
      ],
      score: 1300,
      spawnDialogue: "O PRISMA FRACIONA-SE",
      phaseDialogues: ["CADA FRAGMENTO É UMA VERDADE!"]
    },
    {
      id: "silenciador",
      name: "SILENCIADOR",
      roleLabel: "VÁCUO",
      hue: 280,
      radius: 30,
      phases: [
        { hpThreshold: 1, label: "VÁCUO", speed: 125, aggression: 0.85, radius: 30, attackDamage: 15, energy: 100, description: "Fase 1 — Desativa bônus" },
        { hpThreshold: 0.5, label: "SILENCIADOR ATIVO", speed: 140, aggression: 0.9, radius: 32, attackDamage: 20, energy: 100, description: "Fase 2 — Desativa bônus com mais frequência" },
        { hpThreshold: 0.15, label: "O VÁCUO ABSOLUTO", speed: 160, aggression: 1, radius: 34, attackDamage: 28, energy: 100, description: "Fase 3 — Silêncio permanente" }
      ],
      score: 1050,
      spawnDialogue: "O SILENCIADOR ENTROU NA ARENA",
      phaseDialogues: ["OS BÔNUS SERÃO BLOQUEADOS COM MAIS FREQUÊNCIA!", "OS BÔNUS FORAM BLOQUEADOS!"]
    }
  ];

/*__ECHO_SECTION_END:0009__*/
