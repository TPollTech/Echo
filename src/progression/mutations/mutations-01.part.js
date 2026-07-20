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

