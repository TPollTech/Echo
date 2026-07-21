(function () {
  "use strict";

  const canvas = document.querySelector("#arena");
  const ctx = canvas.getContext("2d", { alpha: false });
  const simulation = window.EchoSimulation;
  if (!simulation) throw new Error("O módulo compartilhado de simulação não foi carregado.");
  const {
    TAU,
    WORLD_SIZE,
    WORLD_MARGIN,
    clamp,
    lerp,
    distanceSq,
    pointToSegmentDistance,
    steerVelocity,
    sanitizeName,
    sanitizeRoomCode,
    formatTime
  } = simulation;
  const ui = {
    start: document.querySelector("#start-screen"),
    startForm: document.querySelector("#start-form"),
    name: document.querySelector("#player-name"),
    mutation: document.querySelector("#mutation-screen"),
    mutationCards: document.querySelector("#mutation-cards"),
    mutationSlots: document.querySelector("#mutation-slots"),
    skin: document.querySelector("#skin-screen"),
    skinCards: document.querySelector("#skin-cards"),
    gameover: document.querySelector("#gameover-screen"),
    restart: document.querySelector("#restart-button"),
    score: document.querySelector("#score-value"),
    kills: document.querySelector("#kill-value"),
    time: document.querySelector("#time-value"),
    integrity: document.querySelector("#integrity-value"),
    integrityFill: document.querySelector("#integrity-fill"),
    charge: document.querySelector("#charge-value"),
    chargeFill: document.querySelector("#charge-fill"),
    sector: document.querySelector("#sector-label"),
    leaderboard: document.querySelector("#leaderboard-list"),
    abilityRing: document.querySelector("#ability-ring"),
    mobilePhase: document.querySelector("#mobile-phase"),
    combo: document.querySelector("#combo"),
    comboValue: document.querySelector("#combo-value"),
    minimap: document.querySelector("#minimap"),
    toast: document.querySelector("#toast"),
    bossBar: document.querySelector("#boss-bar"),
    bossRole: document.querySelector("#boss-role"),
    bossName: document.querySelector("#boss-name"),
    bossHpFill: document.querySelector("#boss-hp-fill"),
    sound: document.querySelector("#sound-toggle"),
    pauseToggle: document.querySelector("#pause-toggle"),
    pause: document.querySelector("#pause-screen"),
    pauseCopy: document.querySelector("#pause-copy"),
    resume: document.querySelector("#resume-button"),
    returnMenu: document.querySelector("#return-menu-button"),
    volume: document.querySelector("#master-volume"),
    volumeValue: document.querySelector("#volume-value"),
    shakeSetting: document.querySelector("#screen-shake-setting"),
    flashSetting: document.querySelector("#flash-setting"),
    soloMode: document.querySelector("#solo-mode"),
    multiplayerMode: document.querySelector("#multiplayer-mode"),
    multiplayerFields: document.querySelector("#multiplayer-fields"),
    startSubmit: document.querySelector("#start-submit"),
    roomCode: document.querySelector("#room-code"),
    createRoom: document.querySelector("#create-room-button"),
    refreshRooms: document.querySelector("#refresh-rooms-button"),
    roomList: document.querySelector("#room-list"),
    profileSummary: document.querySelector("#profile-summary"),
    startStatus: document.querySelector("#start-status"),
    gameoverKicker: document.querySelector("#gameover-kicker"),
    gameoverTitle: document.querySelector("#gameover-title"),
    gameoverCopy: document.querySelector("#gameover-copy"),
    finalTimeLabel: document.querySelector("#final-time-label"),
    finalScore: document.querySelector("#final-score"),
    finalKills: document.querySelector("#final-kills"),
    finalTime: document.querySelector("#final-time"),
    resonanceEarned: document.querySelector("#resonance-earned"),
    workshop: document.querySelector("#workshop-screen"),
    workshopResonance: document.querySelector("#workshop-resonance"),
    upgradeCards: document.querySelector("#upgrade-cards"),
    workshopClose: document.querySelector("#workshop-close"),
    workshopButton: document.querySelector("#workshop-button"),
    skillShop: document.querySelector("#skillshop-screen"),
    skillShopPoints: document.querySelector("#skillshop-points"),
    skillShopCards: document.querySelector("#skillshop-cards"),
    skillShopClose: document.querySelector("#skillshop-close"),
    skillShopButton: document.querySelector("#skillshop-button"),
    loadoutScreen: document.querySelector("#loadout-screen"),
    loadoutSlots: document.querySelector("#loadout-slots"),
    loadoutAvailable: document.querySelector("#loadout-available"),
    loadoutConfirm: document.querySelector("#loadout-confirm")
  };

  const MOTE_COUNT = 330;
  const BOT_COUNT = 10;
  const MUTATION_THRESHOLDS = [45, 160, 360, 650];
  const SOLO_BOSS_TIME = 280;
  const SETTINGS_KEY = "echo.settings";
  const qaMode = new URLSearchParams(window.location.search).has("qa");
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  const MOBILE_QUALITY = isMobile;
  const moteCount = MOBILE_QUALITY ? 140 : 330;
  const ambientSeedCount = MOBILE_QUALITY ? 60 : 180;
  const names = ["LIMEN", "NARA", "VANTA", "RUÍDO", "AION", "KORA", "NULL", "SOMA", "VEGA", "MIRA", "ORFEU", "NYX", "ÍRIS", "FLUXO", "UMBRA"];
  const colors = [188, 218, 268, 302, 326, 42];
  const sectorNames = ["JARDIM NULO", "ARCO DE SOMA", "CAMPO ÍRIS", "LIMIAR VIOLETA", "POÇO DE AION", "VÉU NORTE", "DELTA ESPECTRAL", "COROA VAZIA", "MAR DE NYX"];
  const botArchetypes = [
    { id: "hunter", label: "CAÇADOR", speed: 151, aggression: 0.9, health: 82, attackDamage: 10, hueShift: 0 },
    { id: "warden", label: "SENTINELA", speed: 98, aggression: 0.58, health: 145, attackDamage: 13, hueShift: 42 },
    { id: "drainer", label: "PARASITA", speed: 128, aggression: 0.72, health: 92, attackDamage: 8, energyDrain: 16, hueShift: 105 },
    { id: "weaver", label: "TECELÃO", speed: 118, aggression: 0.68, health: 105, attackDamage: 11, fastPhase: true, hueShift: -24 },
    { id: "sniper", label: "FRANCO-ATIRADOR", speed: 94, aggression: 0.82, health: 72, attackDamage: 23, longRange: true, sniper: true, idealRange: 470, hueShift: 60 },
    { id: "swarmer", label: "ENXAME", speed: 145, aggression: 0.65, health: 55, attackDamage: 6, swarmer: true, hueShift: 80 },
    { id: "bruiser", label: "DESTRUINTE", speed: 90, aggression: 0.95, health: 170, attackDamage: 18, heavyHit: true, hueShift: -15 },
    { id: "berserker", label: "FURIOSO", speed: 160, aggression: 0.95, health: 60, attackDamage: 7, hueShift: -30 },
    { id: "sprinter", label: "CORREDOR", speed: 175, aggression: 0.55, health: 50, attackDamage: 5, hueShift: 150 },
    { id: "bulwark", label: "TANQUE", speed: 72, aggression: 0.4, health: 220, attackDamage: 22, heavyHit: true, hueShift: 10 },
    { id: "phantom", label: "ESPELHO", speed: 120, aggression: 0.7, health: 70, attackDamage: 9, hueShift: 200 }
  ];

  const SKIN_KEY = "echo.selectedSkin";
  const SKIN_PROGRESS_KEY = "echo.skinProgress";
  let skinProgress = loadSkinProgress();
  const skins = [
    { id: "spectro", name: "ESPECTRO", hue: 188, description: "Frequência base", unlocked: () => true, glowIntensity: 1, trailWidth: 1, symbol: "◇" },
    { id: "fenix", name: "FÊNIX", hue: 15, description: "Chamas eternas", unlocked: () => true, glowIntensity: 1.2, trailWidth: 1.1, symbol: "◆" },
    { id: "sombra", name: "SOMBRA", hue: 280, description: "Aura das trevas", unlocked: () => true, glowIntensity: 0.82, trailWidth: 0.95, symbol: "●" },
    { id: "gelo", name: "GELO", hue: 200, description: "Cristais gélidos", unlocked: () => true, glowIntensity: 1.05, trailWidth: 1, symbol: "◈" },
    { id: "neon", name: "NEON", hue: 140, description: "Brilho sintético", unlocked: () => true, glowIntensity: 1.45, trailWidth: 1.2, symbol: "◇" },
    { id: "sangue", name: "SANGUE", hue: 350, description: "Gotas vermelhas", unlocked: () => true, glowIntensity: 1.1, trailWidth: 1.05, symbol: "◆" },
    { id: "dourado", name: "DOURADO", hue: 42, description: "Derrote um boss para liberar", unlocked: () => skinProgress.bossesDefeated >= 1, glowIntensity: 1.35, trailWidth: 1.12, symbol: "★" },
    { id: "caotico", name: "CAÓTICO", hue: -1, description: "Alcance 500 pontos para liberar", unlocked: () => skinProgress.bestScore >= 500, glowIntensity: 1.25, trailWidth: 1.3, symbol: "✦" }
  ];

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

  const synergies = [
    {
      id: "blade-curtain",
      name: "CORTINA DE LÂMINAS",
      requires: ["blade", "afterimage"],
      color: "#ff4fd8",
      description: "Largura do rastro +50%, dano persistente dobado.",
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
      description: "Kill cura 2x, sifão restaura 2x.",
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
      description: "3 projeções, velocidade +25%.",
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
      description: "Guarda de chegada dobada, defesa = 0.3.",
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
      description: "Nova raio +80%, puxa inimigos antes de explodir.",
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
      description: "Ao ativar ghostwall, dano AoE devastador.",
      apply(player) {
        player.ghostwallNova = true;
      }
    },
    {
      id: "combo-master",
      name: "COMBO MASTER",
      requires: ["chain", "focus"],
      color: "#ffe066",
      description: "Janela de chain 3s, máximo 8 stacks.",
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
      description: "Pickup radius +50% durante phase, velocidade +30%.",
      apply(player) {
        player.phasePickupBonus = (player.phasePickupBonus || 1) * 1.5;
        player.phaseSpeed *= 1.3;
      }
    }
  ];

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
      name: "TREMOR DEEP",
      roleLabel: "COLOSSO",
      hue: 28,
      radius: 42,
      phases: [
        { hpThreshold: 1, label: "COLOSSO", speed: 88, aggression: 1, radius: 42, attackDamage: 28, energy: 100, description: "Fase 1 — Lento mas devastador" },
        { hpThreshold: 0.5, label: "COLOSSO ERUPTIVO", speed: 105, aggression: 1, radius: 45, attackDamage: 35, energy: 100, description: "Fase 2 — Choques sísmicos" },
        { hpThreshold: 0.15, label: "TREMOR FINAL", speed: 130, aggression: 1, radius: 48, attackDamage: 44, energy: 100, description: "Fase 3 — Terremoto total" }
      ],
      score: 1300,
      spawnDialogue: "O TREMOR DEEP SACODE O CAMPO",
      phaseDialogues: ["O TREMOR DEEP ERUPTE!", "O TREMOR FINAL APPROXIMA!"]
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
        { hpThreshold: 0.2, label: "DESPERTAR FINAL", speed: 145, aggression: 1, radius: 36, attackDamage: 24, energy: 100, description: "Fase 3 — Cura explosiva + enrage" }
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
        { hpThreshold: 1, label: "ABISMO", speed: 100, aggression: 0.85, radius: 36, attackDamage: 16, energy: 100, description: "Fase 1 — Puxa jogador e bots" },
        { hpThreshold: 0.5, label: "VÓRTICE DUPLO", speed: 115, aggression: 0.9, radius: 38, attackDamage: 22, energy: 100, description: "Fase 2 — Vórtices orbitais" },
        { hpThreshold: 0.15, label: "ABISMO TOTAL", speed: 140, aggression: 1, radius: 40, attackDamage: 30, energy: 100, description: "Fase 3 — Gravidade reversa" }
      ],
      score: 1200,
      spawnDialogue: "O ABISMO SE ABRE",
      phaseDialogues: ["A GRAVIDADE SE DEFORMA!", "O VÓRTICE ENGOLA TUDO!"]
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
        { hpThreshold: 1, label: "ESPELHO", speed: 135, aggression: 0.85, radius: 26, attackDamage: 13, energy: 100, description: "Fase 1 — Copia 1 mutação" },
        { hpThreshold: 0.55, label: "MÍMICO DUPLO", speed: 150, aggression: 0.9, radius: 28, attackDamage: 18, energy: 100, description: "Fase 2 — Copia 2 mutações" },
        { hpThreshold: 0.2, label: "O ESPELHO QUEBRA", speed: 175, aggression: 1, radius: 30, attackDamage: 26, energy: 100, description: "Fase 3 — Copia todas as mutações" }
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
        { hpThreshold: 1, label: "VÁCUO", speed: 125, aggression: 0.85, radius: 30, attackDamage: 15, energy: 100, description: "Fase 1 — Silencia mutações" },
        { hpThreshold: 0.5, label: "SILENCIADOR ATIVO", speed: 140, aggression: 0.9, radius: 32, attackDamage: 20, energy: 100, description: "Fase 2 — Silêncio frequente + debuff" },
        { hpThreshold: 0.15, label: "O VÁCUO ABSOLUTO", speed: 160, aggression: 1, radius: 34, attackDamage: 28, energy: 100, description: "Fase 3 — Silêncio permanente" }
      ],
      score: 1050,
      spawnDialogue: "O SILENCIADOR AMORTECE O SINAL",
      phaseDialogues: ["O VÁCUO ENGOLA TUDO!", "O SILÊNCIO É ABSOLUTO!"]
    }
  ];

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let state = "intro";
  let previousTime = performance.now();
  let runTime = 0;
  let screenShake = 0;
  let flash = 0;
  let audioContext = null;
  let muted = false;
  let masterVolume = 0.7;
  let musicActive = false;
  let musicLayers = {};
  let screenShakeEnabled = true;
  let flashEnabled = true;
  let toastTimer = 0;
  let leaderboardTimer = 0;
  let mutationPending = false;
  let selectedMode = "solo";
  let activeMode = "solo";
  let soloStage = 0;
  let bossSpawned = false;
  let bossDefeated = false;
  let pausedFromState = null;
  let lastRunSaved = false;
  let networkInputTimer = 0;
  let multiplayerRemaining = 0;
  let multiplayerRoomCode = "";
  let multiplayerPlayerId = "";
  let multiplayerSocket = null;
  let multiplayerSnapshot = null;
  let playerUpgrades = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
  let playerResonance = 0;
  let pendingResonance = 0;
  let playerSkillPoints = 0;
  let playerOwnedMutations = {};
  let playerLoadout = [null, null, null, null];
  let pendingSkillPoints = 0;

  let bossDefeatedThisRun = false;
  let activeBoss = null;

  const CHALLENGES_KEY = "echo.challenges";
  const challengePool = [
    { id: "kill20", name: "DESTRUIÇÃO MÍNIMA", description: "Elimine 20 inimigos em uma run", goal: 20, stat: "kills", reward: 25 },
    { id: "kill50", name: "ABATE EM MASSA", description: "Elimine 50 inimigos em uma run", goal: 50, stat: "kills", reward: 60 },
    { id: "score1500", name: "FRAGMENTOS ABUNDANTES", description: "Alcance 1500 pontos em uma run", goal: 1500, stat: "score", reward: 30 },
    { id: "score5000", name: "ACÚMULO EXTREMO", description: "Alcance 5000 pontos em uma run", goal: 5000, stat: "score", reward: 80 },
    { id: "combo10", name: "FLUXO CONTÍNUO", description: "Atinja combo x10", goal: 10, stat: "maxCombo", reward: 20 },
    { id: "combo20", name: "COMBO INDOMÁVEL", description: "Atinja combo x20", goal: 20, stat: "maxCombo", reward: 50 },
    { id: "bossKill", name: "CAÇADOR DE COROAS", description: "Derrote o boss", goal: 1, stat: "bossDefeated", reward: 40 },
    { id: "bossSpeed", name: "EXECUÇÃO RÁPIDA", description: "Derrote o boss em menos de 90s", goal: 1, stat: "bossSpeedKill", reward: 70 },
    { id: "time5", name: "SOBREVIVENTE", description: "Sobreviva 5 minutos", goal: 300, stat: "runTime", reward: 30 },
    { id: "time10", name: "RESISTÊNCIA", description: "Sobreviva 10 minutos", goal: 600, stat: "runTime", reward: 65 },
    { id: "redMote5", name: "RISCO CALCULADO", description: "Colete 5 motes vermelhas em uma run", goal: 5, stat: "redMotes", reward: 20 },
    { id: "noHitBoss", name: "PERFEIÇÃO", description: "Derrote o boss sem tomar dano na fase final", goal: 1, stat: "noHitBoss", reward: 100 }
  ];
  let activeChallenges = [];
  let runStats = { kills: 0, score: 0, maxCombo: 0, bossDefeated: 0, bossSpeedKill: 0, runTime: 0, redMotes: 0, noHitBoss: 0 };

  function generateDailyChallenges() {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const shuffled = [...challengePool].sort((a, b) => {
      const ha = (seed * 2654435761 >>> 0) % challengePool.length;
      const hb = (seed * 2654435761 >>> 0) % challengePool.length;
      return ha - hb;
    });
    return shuffled.slice(0, 3).map((c, i) => ({ ...c, index: i, completed: false }));
  }

  function loadChallenges() {
    try {
      const saved = JSON.parse(localStorage.getItem(CHALLENGES_KEY) || "{}");
      const today = new Date().toDateString();
      if (saved.date === today && Array.isArray(saved.active)) {
        activeChallenges = saved.active;
      } else {
        activeChallenges = generateDailyChallenges();
        saveChallenges();
      }
    } catch (_e) {
      activeChallenges = generateDailyChallenges();
    }
  }

  function saveChallenges() {
    try {
      localStorage.setItem(CHALLENGES_KEY, JSON.stringify({
        date: new Date().toDateString(),
        active: activeChallenges
      }));
    } catch (_e) {}
  }

  function checkChallenges() {
    let newCompletion = false;
    for (const ch of activeChallenges) {
      if (ch.completed) continue;
      const value = runStats[ch.stat] || 0;
      if (value >= ch.goal) {
        ch.completed = true;
        newCompletion = true;
        pendingResonance += ch.reward;
        showToast(`DESAFIO CONCLUÍDO: ${ch.name} (+${ch.reward} ressonância)`, 2800);
        sound(523, 0.3, "triangle", 0.05);
        setTimeout(() => sound(659, 0.25, "sine", 0.04), 100);
        setTimeout(() => sound(784, 0.2, "sine", 0.035), 200);
      }
    }
    if (newCompletion) saveChallenges();
  }

  function updateChallengePanel() {
    const panel = document.querySelector("#challenge-panel");
    if (!panel) return;
    panel.replaceChildren();
    for (const ch of activeChallenges) {
      const value = Math.min(runStats[ch.stat] || 0, ch.goal);
      const pct = Math.floor((value / ch.goal) * 100);
      const item = document.createElement("div");
      item.className = `challenge-item${ch.completed ? " challenge-completed" : ""}`;
      item.innerHTML = `
        <div class="challenge-header">
          <span class="challenge-name">${ch.name}</span>
          <span class="challenge-reward">+${ch.reward}</span>
        </div>
        <p class="challenge-desc">${ch.description}</p>
        <div class="challenge-bar"><i style="width:${pct}%"></i></div>
        <span class="challenge-progress">${value}/${ch.goal}</span>
      `;
      panel.append(item);
    }
  }

  let runModifiers = [];

  const modifierPool = [
    { id: "glass-cannon", name: "CANHÃO DE CRISTAL", description: "Dano x1.5, mas HP máximo -30%.", symbol: "◇", color: "#ff4fd8", bonusResonance: 15, apply(p) { p.trailDamage *= 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.7); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "vampiric", name: "INSTINTO VAMPIRO", description: "Cura por kill x2, regen passiva -50%.", symbol: "♦", color: "#ff557a", bonusResonance: 10, apply(p) { p.killRestoreHealBonus = (p.killRestoreHealBonus || 1) * 2; } },
    { id: "glass-boot", name: "PASSOS DE CRISTAL", description: "Velocidade de phase +30%, energia drena -20%.", symbol: "△", color: "#45e6ff", bonusResonance: 10, apply(p) { p.phaseSpeed *= 1.3; p.phaseDrain *= 0.8; } },
    { id: "magnetic", name: "CORPO MAGNÉTICO", description: "Raio de coleta x2, motes atraídos.", symbol: "◎", color: "#78ffba", bonusResonance: 12, apply(p) { p.pickupRadius *= 2; } },
    { id: "fortified", name: "FORTALECIDO", description: "HP +40%, dano -20%.", symbol: "□", color: "#a88cff", bonusResonance: 12, apply(p) { p.maxHealth = Math.floor(p.maxHealth * 1.4); p.health = p.maxHealth; p.trailDamage *= 0.8; } },
    { id: "overclocked", name: "SOBRECARGA", description: "Cooldown -40%, energia drena +30%.", symbol: "⚡", color: "#ffe066", bonusResonance: 15, apply(p) { p.cooldownScale *= 0.6; p.phaseDrain *= 1.3; } },
    { id: "risk-reward", name: "RISCO E RECOMPENSA", description: "Score x1.5, HP máximo -20%.", symbol: "⬡", color: "#5ce0d2", bonusResonance: 20, apply(p) { p.scoreMultiplier = 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.8); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "glass-trail", name: "Rastro DE CRISTAL", description: "Dano do rastro x2, mas rastro dura 40% menos.", symbol: "⟋", color: "#c8b8ff", bonusResonance: 18, apply(p) { p.trailDamage *= 2; p.ribbonLife *= 0.6; p.trailLinger *= 0.6; } },
    { id: "berserker", name: "BERSERKER", description: "Dano +30% abaixo de 50% HP.", symbol: "☣", color: "#ff8c42", bonusResonance: 12, apply(p) { p.berserkerBonus = 1.3; } }
  ];

  let pendingModifierChoices = [];

  function generateModifierChoices() {
    const shuffled = [...modifierPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  function applyModifiers() {
    for (const mod of runModifiers) {
      mod.apply(player);
    }
  }

  function showModifierScreen() {
    pendingModifierChoices = generateModifierChoices();
    state = "modifier";
    ui.start.classList.add("is-hidden");
    const overlay = document.getElementById("modifier-screen");
    overlay.classList.remove("is-hidden");
    const cards = document.getElementById("modifier-cards");
    cards.replaceChildren();
    for (const mod of pendingModifierChoices) {
      const btn = document.createElement("button");
      btn.className = "modifier-card";
      btn.type = "button";
      btn.style.setProperty("--mod-color", mod.color);
      btn.innerHTML = `
        <span class="modifier-symbol">${mod.symbol}</span>
        <h3>${mod.name}</h3>
        <p>${mod.description}</p>
        <span class="modifier-bonus">+${mod.bonusResonance} ressonância</span>
        <b aria-hidden="true">↗</b>
      `;
      btn.addEventListener("click", () => selectModifier(mod));
      cards.append(btn);
    }
    const skipBtn = document.createElement("button");
    skipBtn.className = "modifier-card modifier-skip";
    skipBtn.type = "button";
    skipBtn.innerHTML = `<span class="modifier-symbol">∅</span><h3>SEM MODIFICADOR</h3><p>Jogue sem alterações.</p><b aria-hidden="true">↗</b>`;
    skipBtn.addEventListener("click", () => selectModifier(null));
    cards.append(skipBtn);
    sound(262, 0.4, "sine", 0.03);
    setTimeout(() => sound(392, 0.35, "sine", 0.025), 80);
  }

  function selectModifier(mod) {
    runModifiers = mod ? [mod] : [];
    document.getElementById("modifier-screen").classList.add("is-hidden");
    if (mod) {
      pendingResonance += mod.bonusResonance;
      showToast(`MODIFICADOR: ${mod.name} (+${mod.bonusResonance} ressonância)`, 2000);
    }
    startSoloGame();
  }

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

  function selectSkin(skin) {
    localStorage.setItem(SKIN_KEY, skin.id);
    ui.skin.classList.add("is-hidden");
    showToast(`FREQUÊNCIA VISUAL: ${skin.name}`, 1500);
    showModifierScreen();
  }

  const pointer = {
    x: width * 0.66,
    y: height * 0.5,
    active: false,
    id: null,
    type: "mouse"
  };

  const camera = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, zoom: 1 };
  let player = createPlayer();
  let bots = [];
  let motes = [];
  let particles = [];
  let ribbons = [];
  let waves = [];
  let scars = [];
  let ambientSeeds = [];

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function hsl(hue, saturation = 90, lightness = 62, alpha = 1) {
    return `hsla(${hue} ${saturation}% ${lightness}% / ${alpha})`;
  }

  function loadSkinProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(SKIN_PROGRESS_KEY) || "{}");
      return {
        bestScore: Math.max(0, Number(saved.bestScore) || 0),
        bossesDefeated: Math.max(0, Number(saved.bossesDefeated) || 0)
      };
    } catch (_error) {
      return { bestScore: 0, bossesDefeated: 0 };
    }
  }

  function saveSkinProgress() {
    try {
      localStorage.setItem(SKIN_PROGRESS_KEY, JSON.stringify(skinProgress));
    } catch (_error) {}
  }

  function updateSkinProgress(score, defeatedBoss) {
    skinProgress.bestScore = Math.max(skinProgress.bestScore, Math.floor(score || 0));
    if (defeatedBoss) skinProgress.bossesDefeated += 1;
    saveSkinProgress();
  }

  function getSelectedSkin() {
    const savedSkinId = localStorage.getItem(SKIN_KEY) || "spectro";
    const selected = skins.find((skin) => skin.id === savedSkinId && skin.unlocked());
    if (selected) return selected;
    localStorage.setItem(SKIN_KEY, "spectro");
    return skins[0];
  }

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

  function silencePlayer(duration, permanent = false) {
    if (!player.mutationBaseline) captureMutationBaseline(player);
    if (!player.silenced) {
      player.silenceSnapshot = snapshotMutationState(player);
      restoreMutationState(player, player.mutationBaseline);
    }
    player.silenced = true;
    player.silencePermanent = player.silencePermanent || permanent;
    player.silencedTimer = permanent ? Number.POSITIVE_INFINITY : Math.max(player.silencedTimer || 0, duration);
    player.damageDebuff = 0.75;
    ui.mutationSlots.classList.add("is-silenced");
  }

  function restorePlayerMutations() {
    if (!player.silenced) return;
    restoreMutationState(player, player.silenceSnapshot);
    player.silenceSnapshot = null;
    player.silenced = false;
    player.silencePermanent = false;
    player.silencedTimer = 0;
    player.damageDebuff = 1;
    ui.mutationSlots.classList.remove("is-silenced");
    showToast("MUTAÇÕES RESTAURADAS", 1500);
    checkMutation();
  }

  function createPlayer() {
    const maxHealth = 100 + playerUpgrades.core * 5;
    const maxEnergy = 100 + playerUpgrades.charge * 10;
    const activeSkin = getSelectedSkin();
    return {
      id: "player",
      name: "Viajante",
      x: WORLD_SIZE / 2,
      y: WORLD_SIZE / 2,
      vx: 0,
      vy: 0,
      radius: 18,
      hue: activeSkin.hue < 0 ? 188 : activeSkin.hue,
      skinId: activeSkin.id,
      skin: activeSkin,
      skinGlow: activeSkin.glowIntensity,
      skinTrail: activeSkin.trailWidth,
      health: maxHealth,
      maxHealth,
      energy: maxEnergy,
      maxEnergy,
      score: 0,
      kills: 0,
      combo: 0,
      comboTimer: 0,
      phasing: false,
      phase: null,
      cooldown: 0,
      hitTimer: 0,
      trailDamage: 34,
      ribbonLife: 0.62,
      trailLinger: 0.06,
      cooldownScale: 1 - playerUpgrades.calibration * 0.08,
      pickupRadius: playerUpgrades.collection * 5,
      shellDefense: 1,
      siphon: false,
      killRestore: false,
      phaseSpeed: 430,
      phaseDrain: 29,
      arrivalNova: false,
      arrivalGuard: 0,
      moteHealing: false,
      healScale: 1,
      chainDamage: false,
      chainCombo: 0,
      chainTimer: 0,
      ghostWall: false,
      ghostWallUsed: false,
      vortexPull: false,
      reversal: false,
      dualPhase: false,
      dualPhaseCharges: 0,
      dualPhaseUsed: 0,
      activeSynergies: [],
      ribbonWidthBonus: 1,
      ribbonLingerDamageBonus: 1,
      killRestoreHealBonus: 1,
      siphonBonus: 1,
      novaRadiusBonus: 1,
      vortexPullBonus: 1,
      chainWindow: 2,
      chainMaxStacks: 5,
      phasePickupBonus: 1,
      ghostwallNova: false,
      scoreMultiplier: 1,
      berserkerBonus: 1,
      silenced: false,
      silencedTimer: 0,
      silencePermanent: false,
      silenceSnapshot: null,
      mutationBaseline: null,
      damageDebuff: 1,
      mutations: [],
      nextMutationIndex: 0,
      barrierActive: false,
      barrierTimer: 0,
      overloadActive: false,
      overloadTimer: 0
    };
  }

  function createBot(index, options = {}) {
    const archetype = botArchetypes[index % botArchetypes.length];
    const angle = Math.random() * TAU;
    const distance = random(620, 1450);
    const faction = Math.floor(Math.random() * 3);
    const factionHueBase = [15, 200, 280];
    const baseSpeed = archetype.speed * random(0.94, 1.06);
    return {
      id: `bot-${index}-${Math.random().toString(36).slice(2, 7)}`,
      name: names[index % names.length],
      archetype: archetype.id,
      roleLabel: archetype.label,
      boss: false,
      faction,
      factionTarget: null,
      x: clamp(WORLD_SIZE / 2 + Math.cos(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      y: clamp(WORLD_SIZE / 2 + Math.sin(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      vx: 0,
      vy: 0,
      radius: archetype.id === "warden" ? 21 : archetype.id === "bulwark" ? 24 : random(14, 19),
      hue: factionHueBase[faction] + archetype.hueShift + random(-8, 8),
      health: archetype.health,
      maxHealth: archetype.health,
      energy: 100,
      score: Math.floor(random(25, 155)),
      phasing: false,
      phase: null,
      cooldown: random(3.5, 7.5),
      thinkTimer: 0,
      targetX: WORLD_SIZE / 2,
      targetY: WORLD_SIZE / 2,
      aggression: clamp(archetype.aggression + random(-0.08, 0.08), 0.1, 1),
      speed: baseSpeed,
      attackDamage: archetype.attackDamage,
      baseAttackDamage: archetype.attackDamage,
      energyDrain: archetype.energyDrain || 0,
      fastPhase: Boolean(archetype.fastPhase),
      longRange: Boolean(archetype.longRange),
      swarmer: Boolean(archetype.swarmer),
      heavyHit: Boolean(archetype.heavyHit),
      sniper: Boolean(archetype.sniper),
      idealRange: archetype.idealRange || 0,
      sniperAimTimer: 0,
      sniperAimDuration: 0,
      sniperAimX: 0,
      sniperAimY: 0,
      sniperTarget: null,
      sniperWarned: false,
      hitTimer: 0,
      dead: false,
      respawnTimer: 0,
      stealthTimer: 0,
      stealthed: false,
      baseSpeed,
      ...options
    };
  }

  function createBoss(templateId = null) {
    const template = bossTemplates.find((entry) => entry.id === templateId)
      || bossTemplates[Math.floor(Math.random() * bossTemplates.length)];
    const phase0 = template.phases[0];
    return createBot(19, {
      id: `boss-${template.id}-${Math.random().toString(36).slice(2, 7)}`,
      name: template.name,
      archetype: template.id,
      roleLabel: phase0.label,
      boss: true,
      bossTemplate: template,
      bossPhaseIndex: 0,
      bossPhaseTransitioning: false,
      bossPhaseTimer: 0,
      bossClone: false,
      radius: phase0.radius,
      hue: template.hue,
      health: 480,
      maxHealth: 480,
      energy: phase0.energy,
      score: template.score,
      aggression: phase0.aggression,
      speed: phase0.speed,
      attackDamage: phase0.attackDamage,
      cooldown: 1.2,
      respawnTimer: 0,
      telegraphType: null,
      telegraphTimer: 0,
      telegraphMaxTimer: 0,
      telegraphRadius: 0,
      telegraphProjectiles: 0
    });
  }

  function createMote(forceNear = false) {
    const roll = Math.random();
    const type = roll > 0.94 ? "gold" : roll > 0.78 ? "red" : roll > 0.58 ? "violet" : "cyan";
    const angle = Math.random() * TAU;
    const nearDistance = random(80, 700);
    const x = forceNear ? player.x + Math.cos(angle) * nearDistance : random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    const y = forceNear ? player.y + Math.sin(angle) * nearDistance : random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    return {
      x: clamp(x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      y: clamp(y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
      radius: type === "gold" ? random(3.5, 5) : type === "red" ? random(3, 4.5) : random(2.2, 4),
      type,
      phase: Math.random() * TAU,
      drift: random(0.4, 1.2)
    };
  }

  function resetWorld() {
    player = createPlayer();
    player.name = sanitizeName(ui.name.value);
    player.hitTimer = 1.2;
    bots = Array.from({ length: BOT_COUNT }, (_, index) => createBot(index));
    motes = Array.from({ length: moteCount }, (_, index) => createMote(index < 90));
    particles = [];
    ribbons = [];
    waves = [];
    scars = [];
    ambientSeeds = Array.from({ length: ambientSeedCount }, () => ({
      x: random(0, WORLD_SIZE),
      y: random(0, WORLD_SIZE),
      radius: random(0.5, 1.8),
      alpha: random(0.08, 0.34),
      hue: Math.random() > 0.5 ? 188 : 268
    }));
    camera.x = player.x;
    camera.y = player.y;
    runTime = 0;
    soloStage = 0;
    bossSpawned = false;
    bossDefeated = false;
    activeBoss = null;
    lastRunSaved = false;
    screenShake = 0;
    flash = 0;
    mutationPending = false;
    updateMutationSlots();
    initSkills();
    updateLeaderboard();
    updateHud();
  }

  function initAudio() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioContext = new AudioContextClass();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

  function sound(frequency, duration = 0.12, type = "sine", volume = 0.035, destination = null) {
    if (muted || !audioContext) return;
    const now = audioContext.currentTime;
    const oscillator = new OscillatorNode(audioContext, { type, frequency });
    const gain = new GainNode(audioContext);
    gain.gain.setValueAtTime(Math.max(0.0001, volume * masterVolume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(destination || audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  function playCollectSound(type) {
    const base = type === "gold" ? 680 : type === "red" ? 220 : type === "violet" ? 510 : 390;
    sound(base + Math.min(player.combo, 8) * 22, type === "red" ? 0.18 : 0.09, type === "red" ? "sawtooth" : "sine", type === "gold" ? 0.055 : type === "red" ? 0.045 : 0.022);
  }


  const MUSIC_LOOKAHEAD_MS = 25;
  const MUSIC_SCHEDULE_AHEAD = 0.18;
  const MUSIC_PROGRESSIONS = [
    { chord: [50, 53, 57], bass: 38 },
    { chord: [46, 50, 53], bass: 34 },
    { chord: [53, 57, 60], bass: 41 },
    { chord: [48, 52, 55], bass: 36 }
  ];
  const MUSIC_MELODY = [
    69, null, 72, null, 74, null, 72, null,
    67, null, 69, null, 65, null, null, null,
    69, null, 70, null, 72, null, 69, null,
    67, null, 65, null, 62, null, null, null
  ];

  function midiToFrequency(note) {
    return 440 * 2 ** ((note - 69) / 12);
  }

  function createMusicNoiseBuffer() {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function scheduleMusicTone({
    note,
    start,
    duration,
    type = "sine",
    volume = 0.025,
    attack = 0.01,
    release = 0.16,
    detune = 0,
    cutoff = 2800,
    echo = false
  }) {
    if (!musicActive || !musicLayers.input || muted) return;
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const peak = Math.max(0.0002, volume);
    const attackEnd = start + Math.max(0.004, attack);
    const holdEnd = start + Math.max(attack + 0.01, duration);
    const stopTime = holdEnd + Math.max(0.04, release);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(midiToFrequency(note), start);
    oscillator.detune.setValueAtTime(detune, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, start);
    filter.Q.setValueAtTime(0.7, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, attackEnd);
    gain.gain.setValueAtTime(peak * 0.82, holdEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(filter).connect(gain).connect(musicLayers.input);
    if (echo && musicLayers.echoInput) gain.connect(musicLayers.echoInput);

    oscillator.start(start);
    oscillator.stop(stopTime + 0.03);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, { once: true });
  }

  function scheduleMusicNoise(start, duration, volume, frequency, type = "highpass") {
    if (!musicActive || !musicLayers.input || muted || !musicLayers.noiseBuffer) return;
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const stopTime = start + duration;

    source.buffer = musicLayers.noiseBuffer;
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, start);
    filter.Q.setValueAtTime(0.8, start);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    source.connect(filter).connect(gain).connect(musicLayers.input);
    source.start(start);
    source.stop(stopTime);
    source.addEventListener("ended", () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    }, { once: true });
  }

  function scheduleMusicKick(start, strength = 1) {
    if (!musicActive || !musicLayers.input || muted) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const stopTime = start + 0.32;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(118, start);
    oscillator.frequency.exponentialRampToValueAtTime(44, stopTime);
    gain.gain.setValueAtTime(0.075 * strength, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    oscillator.connect(gain).connect(musicLayers.input);
    oscillator.start(start);
    oscillator.stop(stopTime + 0.02);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
  }

  function scheduleMusicSnare(start, strength = 1) {
    scheduleMusicNoise(start, 0.13, 0.022 * strength, 1500, "bandpass");
    scheduleMusicTone({
      note: 43,
      start,
      duration: 0.04,
      type: "triangle",
      volume: 0.018 * strength,
      attack: 0.003,
      release: 0.1,
      cutoff: 900
    });
  }

  function schedulePadChord(chord, start, intensity) {
    chord.forEach((note, index) => {
      scheduleMusicTone({
        note,
        start: start + index * 0.018,
        duration: 1.5,
        type: index === 1 ? "triangle" : "sine",
        volume: (0.012 + intensity * 0.004) / (index === 1 ? 1.05 : 1),
        attack: 0.28,
        release: 0.72,
        detune: (index - 1) * 3,
        cutoff: 1500 + intensity * 1800,
        echo: true
      });
    });
  }

  function scheduleMusicStep(start, step) {
    if (!musicActive || !musicLayers.input) return;
    const intensity = musicLayers.intensity || 0.3;
    const bossMode = Boolean(musicLayers.bossMode);
    const barIndex = Math.floor(step / 16) % MUSIC_PROGRESSIONS.length;
    const localStep = step % 16;
    const progression = MUSIC_PROGRESSIONS[barIndex];

    if (localStep === 0) {
      schedulePadChord(progression.chord, start, intensity);
    }

    if (localStep % 4 === 0) {
      scheduleMusicKick(start, localStep === 0 ? 1.08 : 0.86);
      const bassNote = localStep === 8 ? progression.bass + 7 : progression.bass;
      scheduleMusicTone({
        note: bassNote,
        start,
        duration: 0.22,
        type: "triangle",
        volume: 0.045 + intensity * 0.012,
        attack: 0.008,
        release: 0.22,
        cutoff: 720 + intensity * 420
      });
    }

    if (localStep === 4 || localStep === 12) {
      scheduleMusicSnare(start, bossMode ? 1.12 : 0.9);
    }

    if (intensity > 0.4 && localStep % 2 === 0) {
      scheduleMusicNoise(start, 0.045, 0.0055 + intensity * 0.003, 5600, "highpass");
    }

    if (localStep % 2 === 0) {
      const arpeggioIndex = (localStep / 2 + barIndex) % progression.chord.length;
      const arpeggioNote = progression.chord[arpeggioIndex] + 12;
      scheduleMusicTone({
        note: arpeggioNote,
        start,
        duration: 0.07,
        type: "triangle",
        volume: 0.012 + intensity * 0.012,
        attack: 0.004,
        release: 0.18,
        cutoff: 2200 + intensity * 2600,
        echo: true
      });
    }

    const melodyNote = MUSIC_MELODY[step % MUSIC_MELODY.length];
    if (melodyNote && intensity > 0.52) {
      scheduleMusicTone({
        note: melodyNote,
        start: start + 0.012,
        duration: bossMode ? 0.18 : 0.12,
        type: bossMode ? "triangle" : "sine",
        volume: 0.012 + intensity * 0.009,
        attack: 0.02,
        release: 0.28,
        cutoff: 3000 + intensity * 2600,
        echo: true
      });
    }

    if (bossMode && localStep % 4 === 2) {
      const accentNote = progression.chord[(localStep / 4) % progression.chord.length] + 24;
      scheduleMusicTone({
        note: accentNote,
        start,
        duration: 0.05,
        type: "square",
        volume: 0.007,
        attack: 0.003,
        release: 0.11,
        cutoff: 2500
      });
    }
  }

  function musicScheduler() {
    if (!musicActive || !audioContext || !musicLayers.input) return;
    while (musicLayers.nextNoteTime < audioContext.currentTime + MUSIC_SCHEDULE_AHEAD) {
      scheduleMusicStep(musicLayers.nextNoteTime, musicLayers.step);
      musicLayers.nextNoteTime += 60 / musicLayers.tempo / 4;
      musicLayers.step = (musicLayers.step + 1) % 64;
    }
  }

  function startMusic() {
    if (!audioContext || musicActive) return;
    const input = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    const master = audioContext.createGain();
    const echoInput = audioContext.createGain();
    const delay = audioContext.createDelay(0.6);
    const feedback = audioContext.createGain();
    const wet = audioContext.createGain();
    const now = audioContext.currentTime;

    filter.type = "lowpass";
    filter.frequency.value = 2600;
    filter.Q.value = 0.45;
    compressor.threshold.value = -24;
    compressor.knee.value = 20;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.24;
    delay.delayTime.value = 0.28;
    feedback.gain.value = 0.16;
    wet.gain.value = 0.16;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, masterVolume * 0.55), now + 0.8);

    input.connect(filter).connect(compressor).connect(master).connect(audioContext.destination);
    echoInput.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(compressor);

    musicActive = true;
    musicLayers = {
      input,
      filter,
      compressor,
      master,
      echoInput,
      delay,
      feedback,
      wet,
      noiseBuffer: createMusicNoiseBuffer(),
      timer: null,
      nextNoteTime: now + 0.08,
      step: 0,
      tempo: 86,
      intensity: 0.32,
      bossMode: false
    };
    musicLayers.timer = window.setInterval(musicScheduler, MUSIC_LOOKAHEAD_MS);
    musicScheduler();
  }

  function stopMusic() {
    if (!musicActive) return;
    musicActive = false;
    const closingLayers = musicLayers;
    musicLayers = {};
    if (closingLayers.timer) window.clearInterval(closingLayers.timer);
    if (!audioContext || !closingLayers.master) return;
    const now = audioContext.currentTime;
    closingLayers.master.gain.cancelScheduledValues(now);
    closingLayers.master.gain.setValueAtTime(Math.max(0.0001, closingLayers.master.gain.value), now);
    closingLayers.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    window.setTimeout(() => {
      for (const node of [
        closingLayers.input,
        closingLayers.filter,
        closingLayers.compressor,
        closingLayers.master,
        closingLayers.echoInput,
        closingLayers.delay,
        closingLayers.feedback,
        closingLayers.wet
      ]) {
        try { node?.disconnect(); } catch (_error) {}
      }
    }, 450);
  }

  function updateMusic() {
    if (!musicActive || !audioContext || !musicLayers.master) return;
    const hp = player.health / (player.maxHealth || 100);
    const combo = player.combo || 0;
    const isBoss = Boolean(activeBoss && !activeBoss.dead);
    const isPhasing = Boolean(player.phasing);
    const stage = Number(soloStage || 0);
    const intensity = clamp(
      0.3
        + stage * 0.08
        + Math.min(combo, 12) * 0.012
        + (isBoss ? 0.24 : 0)
        + (isPhasing ? 0.06 : 0),
      0.28,
      0.92
    );
    const targetTempo = isBoss ? 104 : 86 + Math.min(12, stage * 4);
    const targetGain = muted ? 0.0001 : Math.max(0.0001, masterVolume * 0.55);
    const now = audioContext.currentTime;

    musicLayers.intensity = intensity;
    musicLayers.bossMode = isBoss;
    musicLayers.tempo += (targetTempo - musicLayers.tempo) * 0.025;
    musicLayers.master.gain.cancelScheduledValues(now);
    musicLayers.master.gain.setTargetAtTime(targetGain, now, 0.08);
    musicLayers.filter.frequency.setTargetAtTime(
      2100 + intensity * 2500 + (hp < 0.3 ? -350 : 0),
      now,
      0.12
    );
    musicLayers.wet.gain.setTargetAtTime(isBoss ? 0.2 : 0.14, now, 0.15);
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      masterVolume = clamp(Number(saved.masterVolume ?? 0.7), 0, 1);
      muted = Boolean(saved.muted);
      screenShakeEnabled = saved.screenShake !== false;
      flashEnabled = saved.flashes !== false;
    } catch {
      masterVolume = 0.7;
    }
    ui.volume.value = String(Math.round(masterVolume * 100));
    ui.volumeValue.textContent = `${Math.round(masterVolume * 100)}%`;
    ui.shakeSetting.checked = screenShakeEnabled;
    ui.flashSetting.checked = flashEnabled;
    ui.sound.classList.toggle("is-muted", muted);
    ui.sound.setAttribute("aria-label", muted ? "Ativar som" : "Desativar som");
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      masterVolume,
      muted,
      screenShake: screenShakeEnabled,
      flashes: flashEnabled
    }));
  }

  function setStartStatus(message = "", isError = false) {
    ui.startStatus.textContent = message;
    ui.startStatus.classList.toggle("is-error", isError);
  }

  function setSelectedMode(mode) {
    selectedMode = mode === "multiplayer" ? "multiplayer" : "solo";
    const multiplayer = selectedMode === "multiplayer";
    ui.soloMode.classList.toggle("is-selected", !multiplayer);
    ui.multiplayerMode.classList.toggle("is-selected", multiplayer);
    ui.soloMode.setAttribute("aria-pressed", String(!multiplayer));
    ui.multiplayerMode.setAttribute("aria-pressed", String(multiplayer));
    ui.multiplayerFields.classList.toggle("is-hidden", !multiplayer);
    ui.start.classList.toggle("is-multiplayer", multiplayer);
    ui.startSubmit.querySelector("span").textContent = multiplayer ? "ENTRAR NA SALA" : "INICIAR RUN SOLO";
    setStartStatus();
    if (multiplayer) refreshRooms();
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Falha HTTP ${response.status}.`);
    return payload;
  }

  async function loadProfile() {
    try {
      const profile = await requestJson(`/api/profile?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      ui.profileSummary.innerHTML = `<strong>RECORDE SOLO ${profile.solo.best_score}</strong> · ${profile.solo.runs} RUNS · <strong>${profile.multiplayer.total_kills} RUPTURAS ONLINE</strong> · <strong style="color:#ffd86b">${profile.resonance} ♦</strong> · <strong style="color:#45e6ff">${profile.skillPoints} ◈</strong>`;
      playerSkillPoints = profile.skillPoints || 0;
      playerOwnedMutations = profile.ownedMutations || {};
      playerLoadout = profile.loadout || [null, null, null, null];
    } catch {
      ui.profileSummary.textContent = "Inicie com npm start para ativar banco local e multiplayer.";
    }
  }

  async function loadUpgrades() {
    try {
      const data = await requestJson(`/api/upgrades?name=${encodeURIComponent(sanitizeName(ui.name.value))}`);
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
    } catch {
      playerResonance = 0;
      playerUpgrades = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
    }
  }

  async function purchaseUpgrade(type) {
    try {
      const data = await requestJson("/api/upgrades", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), upgradeType: type })
      });
      playerResonance = data.resonance;
      playerUpgrades = data.upgrades;
      updateWorkshopUI();
      sound(520, 0.25, "triangle", 0.04);
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  const UPGRADE_META = {
    core: { name: "NÚCLEO", symbol: "♥", description: "+5 vida máxima por nível", color: "#ff4fd8" },
    charge: { name: "CARGA", symbol: "⚡", description: "+10 energia máxima por nível", color: "#45e6ff" },
    calibration: { name: "CALIBRAÇÃO", symbol: "◎", description: "-8% cooldown base por nível", color: "#78ffba" },
    collection: { name: "COLETA", symbol: "◉", description: "+5px raio de coleta por nível", color: "#b792ff" },
    regeneration: { name: "REGENERAÇÃO", symbol: "∞", description: "+0.3 HP/s passivo por nível", color: "#ff8cb7" }
  };
  const UPGRADE_COSTS = [15, 30, 50, 80, 120];

  function updateWorkshopUI() {
    if (ui.workshopResonance) ui.workshopResonance.textContent = playerResonance;
    if (!ui.upgradeCards) return;
    ui.upgradeCards.replaceChildren();
    for (const [type, meta] of Object.entries(UPGRADE_META)) {
      const level = playerUpgrades[type];
      const cost = level < 5 ? UPGRADE_COSTS[level] : null;
      const canAfford = cost !== null && playerResonance >= cost;
      const isMaxed = level >= 5;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `upgrade-card${isMaxed ? " is-maxed" : ""}`;
      card.style.setProperty("--card-color", meta.color);
      card.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true" style="--card-color:${meta.color}">${meta.symbol}</span>
        <small style="color:${meta.color}">NÍVEL ${level}/5</small>
        <h3>${meta.name}</h3>
        <p>${meta.description}</p>
        <div class="level-bar">${Array.from({ length: 5 }, (_, i) => `<div class="level-pip${i < level ? " is-filled" : ""}" style="--pip-color:${meta.color}"></div>`).join("")}</div>
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} ♦`}</span>
      `;
      if (!isMaxed && canAfford) {
        card.addEventListener("click", () => purchaseUpgrade(type));
      }
      ui.upgradeCards.append(card);
    }
  }

  const SKILL_MUTATION_COSTS = [8, 12, 12, 10, 14, 10, 8, 10, 14, 12, 14, 12, 10, 16, 14, 14, 16];
  const SKILL_UPGRADE_COSTS = [[20, 35], [28, 48], [28, 48], [22, 38], [32, 55], [22, 38], [18, 30], [22, 38], [32, 55], [28, 48], [32, 55], [28, 48], [22, 38], [36, 62], [32, 55], [32, 55], [36, 62]];

  function openSkillShop() {
    updateSkillShopUI();
    ui.skillShop.classList.remove("is-hidden");
    sound(262, 0.3, "sine", 0.03);
  }

  function closeSkillShop() {
    ui.skillShop.classList.add("is-hidden");
    loadProfile();
  }

  function updateSkillShopUI() {
    if (ui.skillShopPoints) ui.skillShopPoints.textContent = playerSkillPoints;
    if (!ui.skillShopCards) return;
    ui.skillShopCards.replaceChildren();
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      const owned = playerOwnedMutations[mutation.id];
      const isOwned = !!owned;
      const level = owned || 0;
      const isMaxed = level >= 3;
      let cost = 0;
      let canAfford = false;
      let action = "";
      if (!isOwned) {
        cost = SKILL_MUTATION_COSTS[i];
        canAfford = playerSkillPoints >= cost;
        action = "DESBLOQUEAR";
      } else if (!isMaxed) {
        cost = SKILL_UPGRADE_COSTS[i][level - 1];
        canAfford = playerSkillPoints >= cost;
        action = `UPGRADE NÍVEL ${["I", "II", "III"][level]}`;
      }
      const card = document.createElement("button");
      card.type = "button";
      card.className = `skill-card${isMaxed ? " is-maxed" : ""}${!isOwned ? " is-locked" : ""}`;
      card.style.setProperty("--card-color", mutation.color);
      card.innerHTML = `
        <span class="mutation-symbol" aria-hidden="true">${mutation.symbol}</span>
        <small>${mutation.tag}</small>
        <h3>${mutation.name}</h3>
        <p>${isOwned ? mutation.tiers[level - 1]?.desc || mutation.description : mutation.description}</p>
        <div class="level-bar">${Array.from({ length: 3 }, (_, i) => `<div class="level-pip${i < level ? " is-filled" : ""}" style="--pip-color:${mutation.color}"></div>`).join("")}</div>
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} ◈`}</span>
      `;
      if (!isMaxed && canAfford) {
        card.addEventListener("click", () => purchaseSkillMutation(mutation.id));
      }
      ui.skillShopCards.append(card);
    }
  }

  async function purchaseSkillMutation(mutationId) {
    try {
      const endpoint = playerOwnedMutations[mutationId] ? "/api/shop/upgrade" : "/api/shop/purchase";
      const data = await requestJson(endpoint, {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), mutationId })
      });
      playerSkillPoints = data.skillPoints;
      playerOwnedMutations = data.mutations;
      updateSkillShopUI();
      sound(520, 0.25, "triangle", 0.04);
      loadProfile();
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  async function saveLoadoutToServer() {
    try {
      const data = await requestJson("/api/shop/loadout", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value), slots: playerLoadout })
      });
      playerLoadout = data.loadout;
      showToast("LOADOUT SALVA", 1200);
    } catch (e) {
      showToast(e.message, 2000);
    }
  }

  function openWorkshop() {
    updateWorkshopUI();
    ui.workshop.classList.remove("is-hidden");
    sound(262, 0.3, "sine", 0.03);
  }

  function closeWorkshop() {
    ui.workshop.classList.add("is-hidden");
    loadProfile();
  }

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
            <small>NÍVEL ${["I", "II", "III"][level - 1]} — ATIVA NO ${MUTATION_THRESHOLDS[i]}</small>
            <button class="loadout-remove" data-slot="${i}" type="button">✕</button>
          `;
        }
      } else {
        slot.innerHTML = `<span class="slot-empty">SLOT ${i + 1}</span><small>SCORE ${MUTATION_THRESHOLDS[i]}</small>`;
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
      ui.loadoutAvailable.innerHTML = `<p style="color:rgba(205,197,220,0.5);text-align:center;grid-column:1/-1;padding:20px">NENHUMA HABILIDADE DESBLOQUEADA. VISITE A LOJA DE HABILIDADES.</p>`;
    }
  }

  async function refreshRooms() {
    if (selectedMode !== "multiplayer") return;
    ui.roomList.replaceChildren();
    try {
      const payload = await requestJson("/api/rooms");
      if (!payload.rooms.length) {
        ui.roomList.textContent = "Nenhuma sala ativa. Crie a primeira ressonância.";
        return;
      }
      for (const room of payload.rooms) {
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `<strong>${room.code}</strong><span>${room.players}/${room.maxPlayers} SINAIS</span><span>${formatTime(room.remaining)}</span>`;
        button.addEventListener("click", () => {
          ui.roomCode.value = room.code;
          setStartStatus(`Sala ${room.code} selecionada.`);
        });
        ui.roomList.append(button);
      }
    } catch (error) {
      setStartStatus(`Servidor local indisponível: ${error.message}`, true);
    }
  }

  async function createRoom() {
    setStartStatus("Criando sala local...");
    try {
      const payload = await requestJson("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value) })
      });
      ui.roomCode.value = payload.room.code;
      connectMultiplayer(payload.room.code);
    } catch (error) {
      setStartStatus(error.message, true);
    }
  }

  function connectMultiplayer(rawCode) {
    const code = sanitizeRoomCode(rawCode);
    if (code.length !== 6) {
      setStartStatus("Informe um código de sala com 6 caracteres.", true);
      return;
    }
    if (multiplayerSocket) multiplayerSocket.close();
    setStartStatus(`Conectando à sala ${code}...`);
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${location.host}/ws`);
    multiplayerSocket = socket;
    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "join", roomCode: code, name: sanitizeName(ui.name.value) }));
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "error") {
        setStartStatus(message.message, true);
        socket.close();
        return;
      }
      if (message.type === "joined") {
        activeMode = "multiplayer";
        multiplayerRoomCode = message.roomCode;
        multiplayerPlayerId = message.playerId;
        resetWorld();
        bots = [];
        motes = [];
        state = "playing";
        document.body.classList.add("is-playing");
        ui.start.classList.add("is-hidden");
        ui.gameover.classList.add("is-hidden");
        pointer.x = width * 0.66;
        pointer.y = height * 0.5;
        showToast(`SALA ${message.roomCode} // SERVIDOR AUTORITATIVO`, 2400);
        initAudio();
      }
      if (message.type === "snapshot") applyMultiplayerSnapshot(message);
      if (message.type === "system" && state === "playing") showToast(message.message, 1300);
      if (message.type === "match_end") finishMultiplayer(message.standings);
    });
    socket.addEventListener("close", () => {
      if (multiplayerSocket !== socket) return;
      multiplayerSocket = null;
      if (activeMode === "multiplayer" && state === "playing") {
        returnToMenu("A conexão com a sala foi encerrada.", true);
      }
    });
    socket.addEventListener("error", () => setStartStatus("Não foi possível abrir o WebSocket local.", true));
  }

  function mergeNetworkEntity(current, incoming) {
    const entity = current || { ...incoming, x: incoming.x, y: incoming.y };
    entity.networkX = incoming.x;
    entity.networkY = incoming.y;
    entity.networkVx = incoming.vx;
    entity.networkVy = incoming.vy;
    Object.assign(entity, incoming, { x: entity.x, y: entity.y, vx: entity.vx || incoming.vx, vy: entity.vy || incoming.vy });
    entity.dead = incoming.respawnTimer > 0;
    entity.hitTimer = 0;
    return entity;
  }

  function applyMultiplayerSnapshot(snapshot) {
    multiplayerSnapshot = snapshot;
    multiplayerRemaining = snapshot.remaining;
    runTime = snapshot.elapsed;
    const incomingPlayer = snapshot.players.find((entry) => entry.id === multiplayerPlayerId);
    if (incomingPlayer) player = mergeNetworkEntity(player.id === incomingPlayer.id ? player : null, incomingPlayer);
    const existingBots = new Map(bots.map((bot) => [bot.id, bot]));
    bots = snapshot.players
      .filter((entry) => entry.id !== multiplayerPlayerId)
      .map((entry) => mergeNetworkEntity(existingBots.get(entry.id), entry));
    motes = snapshot.motes;
    ribbons = snapshot.ribbons.map((ribbon) => ({ ...ribbon, points: ribbon.points.map((point) => ({ ...point })) }));
    updateLeaderboard();
    updateHud();
  }

  function startSoloGame() {
    if (multiplayerSocket) {
      multiplayerSocket.close();
      multiplayerSocket = null;
    }
    activeMode = "solo";
    bossDefeatedThisRun = false;
    loadUpgrades().then(() => {
      resetWorld();
      applyModifiers();
      captureMutationBaseline(player);
      initAudio();
      startMusic();
      runStats = { kills: 0, score: 0, maxCombo: 0, bossDefeated: 0, bossSpeedKill: 0, runTime: 0, redMotes: 0, noHitBoss: 0 };
      state = "playing";
      document.body.classList.add("is-playing");
      ui.start.classList.add("is-hidden");
      ui.gameover.classList.add("is-hidden");
      pointer.x = width * 0.66;
      pointer.y = height * 0.5;
      showToast("SINAL ESTABILIZADO — SEGURE ESPAÇO PARA PROJETAR", 2600);
      sound(146, 0.6, "sine", 0.055);
      setTimeout(() => sound(293, 0.4, "sine", 0.035), 110);
    });
  }

  function finishSolo(outcome = "defeat") {
    if (state === "gameover") return;
    endPhase(true);
    restorePlayerMutations();
    stopMusic();
    checkChallenges();
    state = "gameover";
    const victory = outcome === "victory";
    const bossBonus = bossDefeatedThisRun ? 10 : 0;
    pendingResonance = Math.floor(player.score / 10) + player.kills * 2 + bossBonus;
    if (runModifiers.length > 0) pendingResonance += runModifiers[0].bonusResonance;
    ui.gameoverKicker.innerHTML = `<span></span> ${victory ? "PROTOCOLO CONCLUÍDO" : "SINAL INTERROMPIDO"}`;
    ui.gameoverKicker.classList.toggle("danger", !victory);
    const modifierLabel = runModifiers.length > 0 ? ` [${runModifiers[0].name}]` : "";
    ui.gameoverTitle.textContent = victory ? "A COROA FOI ROMPIDA." : "VOCÊ DEIXOU UM ECO.";
    ui.gameoverCopy.textContent = `${victory ? "A arena reconheceu sua trajetória. Uma nova frequência foi registrada." : "Todo fim altera o campo. Toda volta encontra um mundo diferente."}${modifierLabel}`;
    ui.finalTimeLabel.textContent = "SOBREVIVÊNCIA";
    ui.restart.querySelector("span").textContent = "RESSOAR NOVAMENTE";
    ui.finalScore.textContent = Math.floor(player.score).toString();
    ui.finalKills.textContent = player.kills.toString();
    ui.finalTime.textContent = formatTime(runTime);
    if (ui.resonanceEarned) ui.resonanceEarned.textContent = `+${pendingResonance}`;
    ui.gameover.classList.remove("is-hidden");
    updateSkinProgress(player.score, bossDefeatedThisRun);
    sound(victory ? 392 : 132, 0.8, victory ? "triangle" : "sawtooth", 0.045);
    saveRun({ mode: "solo", outcome, bossDefeated: bossDefeatedThisRun });
  }

  function finishMultiplayer(standings = []) {
    if (activeMode !== "multiplayer" || state === "gameover") return;
    state = "gameover";
    endPhase(true);
    const rank = Math.max(1, standings.findIndex((entry) => entry.id === multiplayerPlayerId) + 1);
    const self = standings.find((entry) => entry.id === multiplayerPlayerId) || player;
    ui.gameoverKicker.innerHTML = `<span></span> PARTIDA ENCERRADA // SALA ${multiplayerRoomCode}`;
    ui.gameoverKicker.classList.toggle("danger", rank !== 1);
    ui.gameoverTitle.textContent = rank === 1 ? "RESSONÂNCIA DOMINANTE." : `${rank}º LUGAR REGISTRADO.`;
    ui.gameoverCopy.textContent = "O resultado foi persistido no banco local do servidor.";
    ui.finalTimeLabel.textContent = "POSIÇÃO";
    ui.finalScore.textContent = Math.floor(self.score || 0).toString();
    ui.finalKills.textContent = String(self.kills || 0);
    ui.finalTime.textContent = `${rank}º`;
    ui.restart.querySelector("span").textContent = "VOLTAR AO MENU";
    ui.gameover.classList.remove("is-hidden");
  }

  function saveRun({ mode, outcome, bossDefeated = false }) {
    if (lastRunSaved || mode !== "solo") return;
    lastRunSaved = true;
    requestJson("/api/runs", {
      method: "POST",
      body: JSON.stringify({
        name: player.name,
        mode,
        score: Math.floor(player.score),
        kills: player.kills,
        durationMs: Math.floor(runTime * 1000),
        outcome,
        bossDefeated
      })
    }).then(() => loadProfile()).catch(() => showToast("RUN NÃO FOI SALVA // INICIE PELO SERVIDOR LOCAL", 2600));
  }

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
    ui.pause.classList.add("is-hidden");
    ui.gameover.classList.add("is-hidden");
    ui.mutation.classList.add("is-hidden");
    ui.skin?.classList.add("is-hidden");
    ui.loadoutScreen?.classList.add("is-hidden");
    document.getElementById("modifier-screen")?.classList.add("is-hidden");
    ui.start.classList.remove("is-hidden");
    document.body.classList.remove("is-playing");
    setStartStatus(message, isError);
    loadProfile();
    if (selectedMode === "multiplayer") refreshRooms();
  }

  function showToast(message, duration = 1500) {
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), duration);
  }

  function beginPhase() {
    if (state !== "playing" || mutationPending || player.phasing || player.cooldown > 0 || player.energy < 12) return;
    if (player.dualPhase && player.dualPhaseUsed >= player.dualPhaseCharges) return;
    if (activeMode === "multiplayer") {
      if (multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "phase_begin" }));
      ui.mobilePhase.classList.add("is-active");
      sound(220, 0.2, "sine", 0.025);
      return;
    }
    player.phasing = true;
    player.phase = {
      x: player.x,
      y: player.y,
      vx: player.vx * 0.4,
      vy: player.vy * 0.4,
      points: [{ x: player.x, y: player.y }],
      distance: 0
    };
    player.vx *= 0.25;
    player.vy *= 0.25;
    ui.mobilePhase.classList.add("is-active");
    sound(220, 0.32, "sine", 0.035);
    spawnWave(player.x, player.y, player.hue, 22, 0.35);
  }

  function endPhase(cancelled = false) {
    if (activeMode === "multiplayer") {
      ui.mobilePhase.classList.remove("is-active");
      if (!cancelled && multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "phase_end" }));
      return;
    }
    if (!player.phasing || !player.phase) return;
    const phase = player.phase;
    player.phasing = false;
    ui.mobilePhase.classList.remove("is-active");

    if (cancelled) {
      player.phase = null;
      if (player.dualPhase) {
        player.dualPhaseUsed = 0;
      }
      return;
    }

    const points = phase.points.map((point) => ({ ...point }));
    const hasAttack = phase.distance > 55;

    let effectiveDamage = player.trailDamage * (player.damageDebuff || 1);
    if (player.berserkerBonus && player.berserkerBonus > 1 && player.health < player.maxHealth * 0.5) {
      effectiveDamage *= player.berserkerBonus;
    }
    if (player.chainDamage) {
      player.chainCombo = (player.chainCombo || 0) + 1;
      player.chainTimer = player.chainWindow || 2;
      const chainBonus = 1 + Math.min(player.chainCombo - 1, player.chainMaxStacks || 5) * 0.3;
      effectiveDamage *= chainBonus;
    }

    player.x = clamp(phase.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.y = clamp(phase.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    player.vx = phase.vx * 0.42;
    player.vy = phase.vy * 0.42;
    player.phase = null;

    if (player.dualPhase) {
      player.dualPhaseUsed += 1;
      if (player.dualPhaseUsed < player.dualPhaseCharges) {
        player.cooldown = 0.12 * player.cooldownScale;
      } else {
        player.cooldown = (hasAttack ? 0.72 : 0.28) * player.cooldownScale;
        player.dualPhaseUsed = 0;
      }
    } else {
      player.cooldown = (hasAttack ? 0.72 : 0.28) * player.cooldownScale;
    }

    if (hasAttack) {
      const hitIds = damageAlongPath(points, effectiveDamage, player);
      const hits = hitIds.size;
      ribbons.push({
        points,
        hue: player.hue,
        life: player.ribbonLife,
        maxLife: player.ribbonLife,
        width: 11 * (player.ribbonWidthBonus || 1) * (player.skinTrail || 1),
        dangerLife: player.trailLinger,
        damage: effectiveDamage * 0.55 * (player.ribbonLingerDamageBonus || 1),
        owner: player,
        hitIds
      });
      if (player.siphon && hits > 0) {
        const siphonMult = player.siphonBonus || 1;
        player.energy = clamp(player.energy + hits * 13 * siphonMult, 0, player.maxEnergy);
        player.health = clamp(player.health + hits * 5 * player.healScale * siphonMult, 0, player.maxHealth);
      }
      if (screenShakeEnabled) screenShake = Math.max(screenShake, 5 + hits * 2.5);
      if (flashEnabled) flash = Math.max(flash, 0.22);
      sound(hits ? 92 : 176, 0.24, hits ? "sawtooth" : "sine", hits ? 0.065 : 0.035);
      if (hits > 0) {
        spawnWave(player.x, player.y, 42, 55 + hits * 15, 0.65);
        for (let i = 0; i < hits * 2; i += 1) {
          spawnParticle(player.x, player.y, 42, random(100, 250), random(0.3, 0.7));
        }
      }
    } else {
      if (player.dualPhase) {
        player.dualPhaseUsed = 0;
      }
    }

    if (player.overloadActive && hasAttack) {
      player.overloadActive = false;
      player.overloadTimer = 0;
      player.trailDamage /= 3;
    }
    if (player.arrivalNova && hasAttack) {
      arrivalNova(player.x, player.y);
    }
    if (player.arrivalGuard && hasAttack) player.hitTimer = Math.max(player.hitTimer, player.arrivalGuard);

    spawnWave(player.x, player.y, player.hue, hasAttack ? 80 : 38, 0.48);
    for (let i = 0; i < (hasAttack ? 18 : 8); i += 1) {
      spawnParticle(player.x, player.y, player.hue, random(40, 210), random(0.25, 0.65));
    }
  }

  function arrivalNova(x, y) {
    const radius = 118 * (player.novaRadiusBonus || 1);
    let hit = false;
    for (const bot of bots) {
      if (bot.dead) continue;
      const dx = bot.x - x;
      const dy = bot.y - y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < radius + bot.radius) {
        bot.health -= 13;
        bot.vx += (dx / distance) * 240;
        bot.vy += (dy / distance) * 240;
        bot.hitTimer = 0.18;
        hit = true;
        if (bot.boss) checkBossPhase(bot);
        if (bot.health <= 0) killBot(bot, player);
      }
    }
    waves.push({ x, y, radius: 18, maxRadius: radius, life: 0.52, maxLife: 0.52, hue: 42, width: 4 });
    if (hit) sound(72, 0.28, "triangle", 0.05);
  }

  function applyBossDefense(bot, amount) {
    let adjusted = amount;
    if (bot.archetype === "necrostro" && bot.bossPhaseIndex >= 1) adjusted *= 0.6;
    if (bot.archetype === "silenciador" && bot.bossPhaseIndex >= 1) adjusted *= 0.75;
    if (bot.copiedDefense) adjusted *= bot.copiedDefense;
    return adjusted;
  }

  function redirectBulwarkDamage(target, amount, attacker) {
    const guard = bots.find((candidate) => (
      candidate !== target
      && !candidate.dead
      && candidate.archetype === "bulwark"
      && Math.hypot(candidate.x - target.x, candidate.y - target.y) < 120
    ));
    if (!guard) return amount;
    const absorbed = amount * 0.3;
    guard.health -= absorbed;
    guard.hitTimer = Math.max(guard.hitTimer, 0.16);
    burst(guard.x, guard.y, guard.hue, 4);
    if (guard.health <= 0) killBot(guard, attacker);
    return amount - absorbed;
  }

  function damageAlongPath(points, damage, owner, hitIds = new Set()) {
    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1];
      const b = points[index];
      for (const bot of bots) {
        if (bot.dead || hitIds.has(bot.id) || (bot.archetype === "phantom" && bot.stealthed)) continue;
        const distance = pointToSegmentDistance(bot.x, bot.y, a.x, a.y, b.x, b.y);
        if (distance < bot.radius + 12) {
          hitIds.add(bot.id);
          let dmg = applyBossDefense(bot, damage);
          dmg = redirectBulwarkDamage(bot, dmg, owner);
          bot.health -= Math.max(1, dmg);
          bot.hitTimer = 0.22;
          const angle = Math.atan2(b.y - a.y, b.x - a.x);
          bot.vx += Math.cos(angle) * 185;
          bot.vy += Math.sin(angle) * 185;
          burst(bot.x, bot.y, bot.hue, 11);
          if (bot.boss) checkBossPhase(bot);
          if (bot.health <= 0) killBot(bot, owner);
        }
      }
    }
    return hitIds;
  }

  function damagePlayer(amount, x, y) {
    if (activeMode !== "solo" || state !== "playing" || player.hitTimer > 0) return;
    if (player.barrierActive) {
      player.barrierActive = false;
      player.barrierTimer = 0;
      spawnWave(player.x, player.y, 270, 120, 0.6);
      burst(player.x, player.y, 270, 16);
      sound(440, 0.25, "triangle", 0.05);
      showToast("BARRERA ABSORVEU O DANO", 1200);
      return;
    }
    const multiplier = player.phasing ? player.shellDefense : 1;
    let applied = amount * multiplier;

    if (player.reversal) {
      const reflected = applied * 0.3;
      for (const bot of bots) {
        if (bot.dead) continue;
        const dist = Math.hypot(bot.x - x, bot.y - y);
        if (dist < 120) {
          bot.health -= reflected;
          bot.hitTimer = 0.22;
          burst(bot.x, bot.y, 0, 6);
          if (bot.health <= 0) killBot(bot, player);
          break;
        }
      }
    }

    player.health -= applied;
    player.hitTimer = 0.55;
    if (screenShakeEnabled) screenShake = Math.max(screenShake, 7);
    if (flashEnabled) flash = Math.max(flash, 0.3);
    const angle = Math.atan2(player.y - y, player.x - x);
    player.vx += Math.cos(angle) * 150;
    player.vy += Math.sin(angle) * 150;
    burst(player.x, player.y, 326, 12);
    for (let i = 0; i < 8; i += 1) {
      const angle = Math.random() * TAU;
      particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * random(60, 180),
        vy: Math.sin(angle) * random(60, 180),
        hue: 326,
        life: random(0.4, 0.8),
        maxLife: 0.8,
        radius: random(2, 4.5)
      });
    }
    sound(82, 0.2, "square", 0.055);

    if (player.health <= 0) {
      if (player.ghostWall && !player.ghostWallUsed) {
        player.ghostWallUsed = true;
        player.health = 1;
        player.hitTimer = 1.5;
        spawnWave(player.x, player.y, player.hue, 140, 0.9);
        burst(player.x, player.y, 42, 20);
        showToast("MURALHA FANTASMA ATIVADA", 2000);
        sound(330, 0.5, "triangle", 0.06);
        if (player.ghostwallNova) {
          for (const bot of bots) {
            if (bot.dead) continue;
            const dx = bot.x - player.x;
            const dy = bot.y - player.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 140 + bot.radius) {
              bot.health -= 22;
              bot.vx += (dx / dist) * 300;
              bot.vy += (dy / dist) * 300;
              bot.hitTimer = 0.2;
              if (bot.boss) checkBossPhase(bot);
              if (bot.health <= 0) killBot(bot, player);
            }
          }
          spawnWave(player.x, player.y, 285, 140, 1);
          sound(55, 0.3, "sawtooth", 0.06);
        }
        return;
      }
      finishSolo("defeat");
    }
  }

  function damageBot(bot, amount, attacker, x, y) {
    if (bot.dead || bot.hitTimer > 0) return;
    if (bot.archetype === "phantom" && bot.stealthed) return;
    let finalDamage = applyBossDefense(bot, amount);
    finalDamage = redirectBulwarkDamage(bot, finalDamage, attacker);
    bot.health -= Math.max(1, finalDamage);
    bot.hitTimer = 0.22;
    const dx = bot.x - x;
    const dy = bot.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    bot.vx += (dx / dist) * 185;
    bot.vy += (dy / dist) * 185;
    burst(bot.x, bot.y, bot.hue, 11);
    if (bot.boss) checkBossPhase(bot);
    if (bot.health <= 0) killBot(bot, attacker);
  }

  const SKILL_DEFS = [
    {
      id: "pulse",
      name: "PULSO",
      symbol: "◉",
      color: "#ff4fd8",
      description: "Explosão radial ao redor do núcleo. Afasta e fere inimigos.",
      cooldown: 5,
      energyCost: 25,
      execute(player) {
        const radius = 130;
        let hit = false;
        for (const bot of bots) {
          if (bot.dead) continue;
          const dx = bot.x - player.x;
          const dy = bot.y - player.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < radius + bot.radius) {
            const dmg = 18 + player.score * 0.02;
            bot.health -= dmg;
            bot.vx += (dx / dist) * 280;
            bot.vy += (dy / dist) * 280;
            bot.hitTimer = 0.2;
            hit = true;
            if (bot.boss) checkBossPhase(bot);
            if (bot.health <= 0) killBot(bot, player);
          }
        }
        spawnWave(player.x, player.y, player.hue, radius, 0.6);
        burst(player.x, player.y, player.hue, 20);
        sound(82, 0.3, "triangle", 0.06);
        if (hit) sound(110, 0.2, "sawtooth", 0.04);
        return true;
      }
    },
    {
      id: "blink",
      name: "BLINK",
      symbol: "⟿",
      color: "#45e6ff",
      description: "Teleporta curta distância na direção do cursor.",
      cooldown: 4,
      energyCost: 20,
      execute(player) {
        const angle = Math.atan2(pointer.y - height / 2, pointer.x - width / 2);
        const dist = 160;
        const nx = clamp(player.x + Math.cos(angle) * dist, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        const ny = clamp(player.y + Math.sin(angle) * dist, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        burst(player.x, player.y, player.hue, 12);
        player.x = nx;
        player.y = ny;
        burst(player.x, player.y, player.hue, 14);
        spawnWave(player.x, player.y, player.hue, 80, 0.45);
        sound(520, 0.18, "sine", 0.04);
        camera.x = player.x;
        camera.y = player.y;
        return true;
      }
    },
    {
      id: "barrier",
      name: "BARRERA",
      symbol: "◇",
      color: "#a88cff",
      description: "Escudo que bloqueia o próximo dano recebido por3s.",
      cooldown: 8,
      energyCost: 30,
      execute(player) {
        player.barrierActive = true;
        player.barrierTimer = 3;
        spawnWave(player.x, player.y, 270, 100, 0.7);
        burst(player.x, player.y, 270, 10);
        sound(330, 0.35, "triangle", 0.04);
        showToast("BARRERA ATIVA // 3s", 1500);
        return true;
      }
    },
    {
      id: "overload",
      name: "SOBRECARGA",
      symbol: "ϟ",
      color: "#ff725e",
      description: "Próximo ataque causa3x de dano. Dura5s ou até atacar.",
      cooldown: 10,
      energyCost: 35,
      execute(player) {
        player.overloadActive = true;
        player.overloadTimer = 5;
        player.trailDamage *= 3;
        burst(player.x, player.y, 0, 16);
        sound(146, 0.4, "sawtooth", 0.05);
        showToast("SOBRECARGA // PRÓXIMO GOLPE x3", 1800);
        return true;
      }
    },
    {
      id: "magnet",
      name: "IMÃ",
      symbol: "⊛",
      color: "#b792ff",
      description: "Atrai todos os fragmentos próximos (raio 350).",
      cooldown: 6,
      energyCost: 15,
      execute(player) {
        const magnetRadius = 350;
        let pulled = 0;
        for (const mote of motes) {
          const dx = mote.x - player.x;
          const dy = mote.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist < magnetRadius && dist > 5) {
            mote.x -= (dx / dist) * 200;
            mote.y -= (dy / dist) * 200;
            pulled += 1;
          }
        }
        spawnWave(player.x, player.y, 268, magnetRadius * 0.6, 0.5);
        burst(player.x, player.y, 268, 8);
        sound(440, 0.2, "sine", 0.035);
        if (pulled > 0) showToast(`${pulled} FRAGMENTOS ATRAÍDOS`, 1200);
        return true;
      }
    },
    {
      id: "phase-walk",
      name: "CAMINHO ETÉREO",
      symbol: "⟿",
      color: "#78ffba",
      description: "2s de invulnerabilidade + 40% mais velocidade.",
      cooldown: 12,
      energyCost: 40,
      execute(player) {
        player.hitTimer = Math.max(player.hitTimer, 2);
        player.phaseSpeed *= 1.4;
        player.ghostWallUsed = false;
        spawnWave(player.x, player.y, 150, 110, 0.8);
        burst(player.x, player.y, 150, 14);
        sound(660, 0.3, "sine", 0.04);
        showToast("CAMINHO ETÉREO // 2s INVULNERÁVEL", 1500);
        setTimeout(() => { player.phaseSpeed /= 1.4; }, 2000);
        return true;
      }
    }
  ];

  let activeSkills = [];
  let skillCooldowns = [];
  let skillSlots = 4;

  function initSkills() {
    const pool = [...SKILL_DEFS].sort(() => Math.random() - 0.5);
    activeSkills = pool.slice(0, skillSlots);
    skillCooldowns = activeSkills.map(() => 0);
  }

  function useSkill(index) {
    if (index < 0 || index >= activeSkills.length) return;
    if (state !== "playing" || activeMode !== "solo") return;
    const skill = activeSkills[index];
    if (!skill || skillCooldowns[index] > 0) return;
    if (player.energy < skill.energyCost) {
      showToast("CARGA INSUFICIENTE", 1000);
      return;
    }
    player.energy -= skill.energyCost;
    skillCooldowns[index] = skill.cooldown;
    skill.execute(player);
  }

  function updateSkills(dt) {
    for (let i = 0; i < skillCooldowns.length; i++) {
      if (skillCooldowns[i] > 0) skillCooldowns[i] = Math.max(0, skillCooldowns[i] - dt);
    }
    if (player.barrierActive && player.barrierTimer > 0) {
      player.barrierTimer -= dt;
      if (player.barrierTimer <= 0) {
        player.barrierActive = false;
      }
    }
    if (player.overloadActive && player.overloadTimer > 0) {
      player.overloadTimer -= dt;
      if (player.overloadTimer <= 0) {
        player.overloadActive = false;
        player.trailDamage /= 3;
      }
    }
  }

  function drawSkillHud() {
    if (state !== "playing" || activeMode !== "solo") return;
    const slotW = 50;
    const gap = 6;
    const totalW = activeSkills.length * slotW + (activeSkills.length - 1) * gap;
    const startX = width / 2 - totalW / 2;
    const y = height - 145;
    ctx.save();
    ctx.textAlign = "center";
    const panelPad = 10;
    ctx.fillStyle = "rgba(11,9,24,0.45)";
    ctx.beginPath();
    ctx.roundRect(startX - panelPad, y - panelPad, totalW + panelPad * 2, slotW + 36 + panelPad * 2, 10);
    ctx.fill();
    for (let i = 0; i < activeSkills.length; i++) {
      const skill = activeSkills[i];
      if (!skill) continue;
      const x = startX + i * (slotW + gap);
      const cd = skillCooldowns[i];
      const ready = cd <= 0 && player.energy >= skill.energyCost;
      ctx.fillStyle = ready ? "rgba(11,9,24,0.85)" : "rgba(11,9,24,0.65)";
      ctx.beginPath();
      ctx.roundRect(x, y, slotW, slotW, 6);
      ctx.fill();
      ctx.strokeStyle = ready ? skill.color : "rgba(132,105,202,0.25)";
      ctx.lineWidth = ready ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, slotW, slotW, 6);
      ctx.stroke();
      ctx.fillStyle = ready ? skill.color : "rgba(205,197,220,0.25)";
      ctx.font = "600 17px Inter, sans-serif";
      ctx.fillText(skill.symbol, x + slotW / 2, y + slotW / 2 + 1);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "700 9px Inter, sans-serif";
      ctx.fillText(`[${i + 1}]`, x + slotW / 2, y + slotW - 4);
      ctx.fillStyle = ready ? "rgba(255,255,255,0.65)" : "rgba(205,197,220,0.25)";
      ctx.font = "500 8px Inter, sans-serif";
      ctx.fillText(skill.name, x + slotW / 2, y + slotW + 12);
      ctx.fillStyle = ready ? "rgba(255,255,255,0.35)" : "rgba(205,197,220,0.15)";
      ctx.font = "400 7px Inter, sans-serif";
      ctx.fillText(`${skill.energyCost}⚡`, x + slotW / 2, y + slotW + 22);
      if (cd > 0) {
        const cdRatio = cd / skill.cooldown;
        ctx.fillStyle = `rgba(255,79,216,${0.2 * cdRatio})`;
        ctx.beginPath();
        ctx.roundRect(x, y + slotW * (1 - cdRatio), slotW, slotW * cdRatio, [0, 0, 6, 6]);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillText(`${cd.toFixed(1)}`, x + slotW / 2, y + slotW / 2 + 12);
      }
    }
    ctx.restore();
  }

  function killBot(bot, owner = null) {
    if (bot.dead) return;

    if (bot.archetype === "prisma" && bot.boss && !bot.prismaFragment && !bot.prismaSplit) {
      bot.prismaSplit = true;
      bot.dead = true;
      bot.phasing = false;
      bot.phase = null;
      bot.respawnTimer = Number.POSITIVE_INFINITY;
      const fragmentHealth = Math.max(70, Math.floor(bot.maxHealth * 0.28));
      const fragmentData = [
        { aspect: "red", name: "PRISMA RUBRO", hue: 0, speed: 178, damage: 1.35 },
        { aspect: "blue", name: "PRISMA AZUL", hue: 205, speed: 205, damage: 0.8 },
        { aspect: "green", name: "PRISMA VERDE", hue: 120, speed: 155, damage: 0.72 }
      ];
      const fragments = fragmentData.map((data, index) => {
        const fragment = createBot(bots.length + index, {
          id: `prisma-frag-${data.aspect}-${Math.random().toString(36).slice(2, 7)}`,
          name: data.name,
          archetype: "prisma",
          roleLabel: "FRAGMENTO",
          boss: true,
          bossTemplate: bot.bossTemplate,
          bossPhaseIndex: 1,
          bossPhaseTransitioning: false,
          bossPhaseTimer: 0,
          bossClone: false,
          prismaFragment: true,
          prismaAspect: data.aspect,
          radius: 17,
          hue: data.hue,
          health: fragmentHealth,
          maxHealth: fragmentHealth,
          energy: 100,
          score: Math.floor(bot.bossTemplate.score / 3),
          aggression: 1,
          speed: data.speed,
          baseSpeed: data.speed,
          attackDamage: Math.max(8, Math.floor(bot.attackDamage * data.damage)),
          cooldown: 0.8,
          respawnTimer: 0,
          noRespawn: true
        });
        const angle = index * TAU / 3 + random(-0.18, 0.18);
        fragment.x = clamp(bot.x + Math.cos(angle) * 92, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        fragment.y = clamp(bot.y + Math.sin(angle) * 92, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        return fragment;
      });
      bots.push(...fragments);
      activeBoss = fragments[0];
      showToast("O PRISMA SE FRACIONA EM TRÊS!", 2600);
      sound(330, 0.4, "triangle", 0.06);
      spawnWave(bot.x, bot.y, bot.hue, 180, 0.9);
      burst(bot.x, bot.y, bot.hue, 30);
      return;
    }

    bot.dead = true;
    bot.phasing = false;
    bot.phase = null;
    bot.telegraphType = null;
    bot.telegraphTimer = 0;
    bot.respawnTimer = bot.boss || bot.bossClone || bot.noRespawn ? Number.POSITIVE_INFINITY : random(4.5, 7.5);
    scars.push({ x: bot.x, y: bot.y, hue: bot.hue, life: 18, maxLife: 18, radius: bot.radius * 2.5 });
    burst(bot.x, bot.y, bot.hue, bot.prismaIllusion ? 8 : 28);
    spawnWave(bot.x, bot.y, bot.hue, bot.prismaIllusion ? 50 : 120, bot.prismaIllusion ? 0.35 : 0.8);

    if (!bot.prismaIllusion) {
      const moteCount = bot.boss ? 14 : bot.bossClone ? 5 : 8;
      for (let i = 0; i < moteCount; i += 1) {
        const mote = createMote();
        mote.x = clamp(bot.x + random(-55, 55), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        mote.y = clamp(bot.y + random(-55, 55), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        mote.type = i < 2 ? "gold" : i === 2 ? "red" : Math.random() > 0.45 ? "violet" : "cyan";
        motes.push(mote);
      }
    }

    if (bot.silenceAnchor) {
      restorePlayerMutations();
      showToast("ÂNCORA DE SILÊNCIO ROMPIDA", 1800);
    }

    if (owner === player && !bot.prismaIllusion) {
      player.kills += 1;
      let reward = 24;
      if (bot.prismaFragment) reward = Math.floor((bot.bossTemplate?.score || 1300) / 3);
      else if (bot.boss) reward = bot.bossTemplate ? bot.bossTemplate.score : 900;
      else if (bot.bossClone) reward = bot.silenceAnchor ? 140 : 120;
      player.score += reward;
      runStats.kills += 1;
      runStats.score = Math.floor(player.score);
      if (player.killRestore) {
        const killBonus = player.killRestoreHealBonus || 1;
        player.health = clamp(player.health + 9 * killBonus, 0, player.maxHealth);
        player.energy = clamp(player.energy + 24 * killBonus, 0, player.maxEnergy);
      }
      showToast(`RUPTURA CONFIRMADA // ${bot.name}`, 1200);
      sound(420, 0.25, "triangle", 0.055);
      setTimeout(() => sound(630, 0.22, "sine", 0.035), 70);
    } else if (owner && owner !== player && !owner.dead && !bot.prismaIllusion) {
      owner.score += 18;
      owner.health = Math.min(owner.maxHealth, owner.health + 8);
      owner.energy = Math.min(100, owner.energy + 20);
      burst(owner.x, owner.y, owner.hue, 8);
    }

    if (bot.prismaFragment) {
      const remaining = bots.filter((candidate) => candidate.prismaFragment && !candidate.dead);
      if (remaining.length > 0) {
        activeBoss = remaining[0];
        showToast(`PRISMA // ${remaining.length} FRAGMENTO${remaining.length > 1 ? "S" : ""} RESTANTE${remaining.length > 1 ? "S" : ""}`, 1600);
        return;
      }
    }

    if (bot.boss && !bot.bossClone) {
      if (bot.archetype === "silenciador") restorePlayerMutations();
      bossDefeated = true;
      bossDefeatedThisRun = true;
      activeBoss = null;
      runStats.bossDefeated = 1;
      if (runTime < 90) runStats.bossSpeedKill = 1;
      const bossRewards = {
        "coroa-vazia": { motes: 20, bonusScore: 150, toast: "A COROA VAZIA FOI ROMPIDA // RECOMPENSA COLETADA" },
        "espectro-decisivo": { motes: 22, bonusScore: 180, toast: "O ESPECTRO DECISIVO SE DISSOLVE // RECOMPENSA COLETADA" },
        "tremor-deep": { motes: 24, bonusScore: 200, toast: "O TREMOR DEEP CESOU // RECOMPENSA COLETADA" },
        "necrostro": { motes: 18, bonusScore: 160, toast: "O NECRÓSTRO RETORNA AO SILÊNCIO // RECOMPENSA COLETADA" },
        "vortice": { motes: 20, bonusScore: 190, toast: "O VÓRVICE COLAPSOU // RECOMPENSA COLETADA" },
        "cicatriz": { motes: 18, bonusScore: 170, toast: "A CICATRIZ SAROU // RECOMPENSA COLETADA" },
        "mimico": { motes: 16, bonusScore: 155, toast: "O ESPELHO QUEBROU // RECOMPENSA COLETADA" },
        "prisma": { motes: 22, bonusScore: 210, toast: "OS FRAGMENTOS SE DISPERSARAM // RECOMPENSA COLETADA" },
        "silenciador": { motes: 20, bonusScore: 175, toast: "O SILÊNCIO FOI ROMPIDO // RECOMPENSA COLETADA" }
      };
      const reward = bossRewards[bot.archetype];
      if (reward) {
        player.score += reward.bonusScore;
        runStats.score = Math.floor(player.score);
        for (let i = 0; i < reward.motes; i++) {
          const mote = createMote();
          mote.x = clamp(bot.x + random(-65, 65), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          mote.y = clamp(bot.y + random(-65, 65), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          mote.type = i < 4 ? "gold" : i < 6 ? "red" : Math.random() > 0.4 ? "violet" : "cyan";
          motes.push(mote);
        }
        showToast(reward.toast, 2800);
      }
      window.setTimeout(() => finishSolo("victory"), 900);
    }
  }

  function copyMimicMutations(bot, requestedCount) {
    const available = player.mutations
      .map((id) => mutations.find((mutation) => mutation.id === id))
      .filter(Boolean)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(3, requestedCount));
    const phase = bot.bossTemplate?.phases?.[bot.bossPhaseIndex] || {};
    const offensive = new Set(["blade", "overclock", "chain", "resonance"]);
    const mobile = new Set(["drift", "dualphase", "focus"]);
    const defensive = new Set(["shell", "prism", "ghostwall"]);
    const sustain = new Set(["siphon", "reweave", "resonance"]);
    bot.copiedMutationIds = available.map((mutation) => mutation.id);
    const offenseCount = bot.copiedMutationIds.filter((id) => offensive.has(id)).length;
    const mobileCount = bot.copiedMutationIds.filter((id) => mobile.has(id)).length;
    const defenseCount = bot.copiedMutationIds.filter((id) => defensive.has(id)).length;
    const sustainCount = bot.copiedMutationIds.filter((id) => sustain.has(id)).length;
    bot.attackDamage = Math.floor((phase.attackDamage || bot.attackDamage) * (1 + offenseCount * 0.18));
    bot.speed = (phase.speed || bot.baseSpeed || bot.speed) * (1 + mobileCount * 0.12);
    bot.baseSpeed = bot.speed;
    bot.copiedDefense = defenseCount > 0 ? Math.max(0.62, 1 - defenseCount * 0.12) : 1;
    bot.copiedRegen = sustainCount * 1.5;
    bot.hue = available.length ? (45 + available.reduce((sum, mutation) => sum + mutations.indexOf(mutation) * 23, 0)) % 360 : 45;
  }

  function spawnPrismaIllusions(source) {
    if (bots.some((bot) => bot.prismaIllusion && bot.illusionSourceId === source.id && !bot.dead)) return;
    for (let index = 0; index < 2; index += 1) {
      const illusion = createBot(bots.length + index, {
        id: `prisma-illusion-${Math.random().toString(36).slice(2, 7)}`,
        name: "REFRAÇÃO",
        archetype: "prisma",
        roleLabel: "ILUSÃO",
        boss: false,
        bossClone: true,
        prismaIllusion: true,
        illusionSourceId: source.id,
        illusionLife: 4,
        noRespawn: true,
        hue: source.hue + random(-18, 18),
        radius: 13,
        health: 1,
        maxHealth: 1,
        speed: source.speed * 1.12,
        baseSpeed: source.speed * 1.12,
        aggression: 0.35,
        attackDamage: 0,
        cooldown: 99
      });
      const angle = index * Math.PI + random(-0.4, 0.4);
      illusion.x = clamp(source.x + Math.cos(angle) * 70, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      illusion.y = clamp(source.y + Math.sin(angle) * 70, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bots.push(illusion);
    }
  }

  function spawnSilenceAnchor(source) {
    const existing = bots.find((bot) => bot.silenceAnchor && !bot.dead);
    if (existing) return existing;
    const anchor = createBot(bots.length, {
      id: `silence-anchor-${Math.random().toString(36).slice(2, 7)}`,
      name: "ÂNCORA DO VÁCUO",
      archetype: "silenciador",
      roleLabel: "ÂNCORA",
      boss: false,
      bossClone: true,
      silenceAnchor: true,
      noRespawn: true,
      hue: 285,
      radius: 20,
      health: 95,
      maxHealth: 95,
      speed: 42,
      baseSpeed: 42,
      aggression: 0.2,
      attackDamage: 6,
      cooldown: 4
    });
    const angle = Math.random() * TAU;
    anchor.x = clamp(source.x + Math.cos(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    anchor.y = clamp(source.y + Math.sin(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(anchor);
    source.silenceAnchorId = anchor.id;
    silencePlayer(Number.POSITIVE_INFINITY, true);
    showToast("ROMPA A ÂNCORA PARA RECUPERAR AS MUTAÇÕES", 2800);
    return anchor;
  }

  function checkBossPhase(bot) {
    if (!bot.boss || !bot.bossTemplate || bot.dead) return;
    const hpRatio = bot.health / bot.maxHealth;
    const phases = bot.bossTemplate.phases;
    let nextPhaseIndex = -1;
    for (let i = phases.length - 1; i > bot.bossPhaseIndex; i--) {
      if (hpRatio <= phases[i].hpThreshold) {
        nextPhaseIndex = i;
        break;
      }
    }
    if (nextPhaseIndex > bot.bossPhaseIndex && !bot.bossPhaseTransitioning) {
      bot.bossPhaseIndex = nextPhaseIndex;
      bot.bossPhaseTransitioning = true;
      bot.bossPhaseTimer = 1.5;
      bot.telegraphType = null;
      bot.telegraphTimer = 0;
      const phase = phases[nextPhaseIndex];
      bot.roleLabel = phase.label;
      bot.speed = phase.speed;
      bot.aggression = phase.aggression;
      bot.radius = phase.radius;
      bot.attackDamage = phase.attackDamage;
      bot.energy = Math.min(75, phase.energy);
      bot.cooldown = Math.max(bot.cooldown, 1.45);
      bot.sniperAimTimer = 0;
      bot.sniperTarget = null;
      spawnWave(bot.x, bot.y, bot.hue, 160, 1);
      burst(bot.x, bot.y, bot.hue, 40);
      sound(55, 0.5, "sawtooth", 0.08);
      setTimeout(() => sound(110, 0.4, "triangle", 0.06), 150);
      const dialogue = bot.bossTemplate.phaseDialogues[nextPhaseIndex - 1];
      if (dialogue) showToast(dialogue, 2600);
      if (nextPhaseIndex === 1 && bot.archetype === "espectro-decisivo") {
        spawnBossClone(bot);
      }
      if (nextPhaseIndex === 2 && bot.archetype === "tremor-deep") {
        tremorShockwaves(bot);
      }
      if (bot.archetype === "necrostro" && nextPhaseIndex === 2) {
        bot.health = Math.min(bot.maxHealth, bot.health + 50);
        bot.enraged = true;
      }
      if (bot.archetype === "vortice" && nextPhaseIndex === 2) {
        bot.gravityDirection = -1;
        bot.gravityModeTimer = 2;
      }
      if (bot.archetype === "cicatriz") {
        const woundCount = nextPhaseIndex === 2 ? 8 : 4;
        for (let index = 0; index < woundCount; index += 1) {
          scars.push({
            x: clamp(bot.x + random(-280, 280), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
            y: clamp(bot.y + random(-280, 280), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
            hue: 350,
            life: 15,
            maxLife: 15,
            radius: 55,
            wound: true,
            owner: bot
          });
        }
      }
      if (bot.archetype === "mimico") {
        copyMimicMutations(bot, nextPhaseIndex >= 2 ? 3 : 2);
      }
      if (bot.archetype === "silenciador" && nextPhaseIndex === 2) {
        spawnSilenceAnchor(bot);
      }
    }
  }

  function spawnBossClone(original) {
    const clone = createBot(19, {
      id: `boss-clone-${Math.random().toString(36).slice(2, 7)}`,
      name: "CLONE",
      archetype: original.archetype,
      roleLabel: "CLONE",
      boss: false,
      bossClone: true,
      radius: original.radius * 0.8,
      hue: original.hue + 30,
      health: Math.floor(original.maxHealth * 0.25),
      maxHealth: Math.floor(original.maxHealth * 0.25),
      energy: 100,
      score: 300,
      aggression: 1,
      speed: original.speed * 1.15,
      attackDamage: Math.floor(original.attackDamage * 0.7),
      cooldown: 1,
      respawnTimer: 0
    });
    const angle = Math.random() * TAU;
    clone.x = clamp(original.x + Math.cos(angle) * 120, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    clone.y = clamp(original.y + Math.sin(angle) * 120, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(clone);
    showToast("UM CLONE SE MATERIALIZA!", 1800);
    sound(220, 0.3, "triangle", 0.05);
  }

  function tremorShockwaves(bot) {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (bot.dead) return;
        for (const otherBot of bots) {
          if (otherBot === bot || otherBot.dead) continue;
          const dx = otherBot.x - bot.x;
          const dy = otherBot.y - bot.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 200) {
            otherBot.health -= 18;
            otherBot.vx += (dx / dist) * 260;
            otherBot.vy += (dy / dist) * 260;
            otherBot.hitTimer = 0.18;
            if (otherBot.health <= 0) killBot(otherBot, bot);
          }
        }
        const dx = player.x - bot.x;
        const dy = player.y - bot.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 200) {
          damagePlayer(15, bot.x, bot.y);
        }
        spawnWave(bot.x, bot.y, bot.hue, 200, 0.7);
        burst(bot.x, bot.y, bot.hue, 20);
        sound(40, 0.35, "sawtooth", 0.06);
      }, i * 400);
    }
  }

  function runPrismaFragmentMechanic(bot) {
    if (!bot.prismaFragment || bot.cooldown > 0) return;
    const prismaAspectHandlers = {
      green() {
        for (const fragment of bots) {
          if (!fragment.prismaFragment || fragment.dead) continue;
          fragment.health = Math.min(fragment.maxHealth, fragment.health + 16);
          burst(fragment.x, fragment.y, 120, 3);
        }
        spawnWave(bot.x, bot.y, 120, 150, 0.55);
        bot.cooldown = 4.5;
      },
      blue() {
        spawnPrismaIllusions(bot);
        bot.cooldown = 4;
      },
      red() {
        bot.energy = Math.min(100, bot.energy + 20);
        bot.cooldown = 2.4;
      }
    };
    (prismaAspectHandlers[bot.prismaAspect] || prismaAspectHandlers.red)();
  }

  function fireRadialBurst(bot) {
    const phaseIndex = bot.bossPhaseIndex;
    const count = phaseIndex >= 2 ? 16 : phaseIndex >= 1 ? 12 : 8;
    const speed = 210 + phaseIndex * 35;
    const damage = Math.floor(bot.attackDamage * (0.45 + phaseIndex * 0.1));
    const radius = 12 + phaseIndex * 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU;
      projectiles.push({
        x: bot.x,
        y: bot.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hue: bot.hue,
        life: 1.8,
        maxLife: 1.8,
        radius,
        damage,
        owner: bot,
        boss: true
      });
    }
    spawnWave(bot.x, bot.y, bot.hue, 180 + phaseIndex * 40, 0.7);
    burst(bot.x, bot.y, bot.hue, 22 + phaseIndex * 6);
    sound(55, 0.35, "sawtooth", 0.065);
  }

  function fireDashAttack(bot) {
    const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
    const dist = Math.hypot(player.x - bot.x, player.y - bot.y) || 1;
    const travel = Math.min(dist + 80, 400);
    const phaseVelocity = 480;
    bot.phasing = true;
    bot.phase = {
      x: bot.x,
      y: bot.y,
      vx: (Math.cos(angle)) * phaseVelocity,
      vy: (Math.sin(angle)) * phaseVelocity,
      targetX: bot.x + Math.cos(angle) * travel,
      targetY: bot.y + Math.sin(angle) * travel,
      life: clamp(travel / phaseVelocity, 0.3, 0.9),
      points: [{ x: bot.x, y: bot.y }],
      attackTarget: null
    };
    bot.energy -= 35;
    spawnWave(bot.x, bot.y, bot.hue, 40, 0.4);
    sound(110, 0.2, "triangle", 0.045);
  }

  const bossMechanicRegistry = Object.freeze({
    "coroa-vazia": Object.freeze({
      update(bot, dt) {
        if (bot.cooldown > 0 || bot.energy <= 30) return;
        if (!bot.telegraphType) {
          const useDash = bot.bossPhaseIndex >= 1 && Math.random() < 0.3;
          bot.telegraphType = useDash ? "dash" : "radial-burst";
          bot.telegraphTimer = 1.2;
          bot.telegraphMaxTimer = 1.2;
          bot.telegraphRadius = useDash ? 350 : 160;
          bot.telegraphProjectiles = bot.bossPhaseIndex >= 2 ? 16 : bot.bossPhaseIndex >= 1 ? 12 : 8;
          sound(82, 0.25, "triangle", 0.04);
          return;
        }
        bot.telegraphTimer -= dt;
        if (bot.telegraphTimer <= 0) {
          const type = bot.telegraphType;
          bot.telegraphType = null;
          bot.telegraphTimer = 0;
          if (type === "radial-burst") {
            fireRadialBurst(bot);
          } else if (type === "dash") {
            fireDashAttack(bot);
          }
          bot.cooldown = bot.bossPhaseIndex >= 2 ? random(3, 4.5) : bot.bossPhaseIndex >= 1 ? random(4, 6) : random(5.5, 8);
          bot.energy -= 30;
        }
      }
    }),
    "tremor-deep": Object.freeze({
      update(bot, _dt, context) {
        if (bot.bossPhaseIndex < 1 || bot.energy <= 30) return;
        if (!bot.telegraphType && context.distToPlayer < 220 && bot.cooldown <= 0) {
          bot.telegraphType = "area-slam";
          bot.telegraphTimer = 0.9;
          bot.telegraphMaxTimer = 0.9;
          bot.telegraphRadius = 200;
          sound(40, 0.2, "sawtooth", 0.04);
          return;
        }
        if (bot.telegraphType) {
          bot.telegraphTimer -= _dt;
          if (bot.telegraphTimer <= 0) {
            bot.telegraphType = null;
            bot.telegraphTimer = 0;
            spawnWave(bot.x, bot.y, bot.hue, 160, 0.6);
            burst(bot.x, bot.y, bot.hue, 18);
            sound(40, 0.3, "sawtooth", 0.05);
            const dx = player.x - bot.x;
            const dy = player.y - bot.y;
            const distance = Math.hypot(dx, dy) || 1;
            if (distance < 200) damagePlayer(Math.floor(bot.attackDamage * 0.6), bot.x, bot.y);
            for (const otherBot of bots) {
              if (otherBot === bot || otherBot.dead) continue;
              const dxb = otherBot.x - bot.x;
              const dyb = otherBot.y - bot.y;
              const distB = Math.hypot(dxb, dyb) || 1;
              if (distB < 200) {
                otherBot.health -= 12;
                otherBot.vx += (dxb / distB) * 200;
                otherBot.vy += (dyb / distB) * 200;
                otherBot.hitTimer = 0.15;
                if (otherBot.health <= 0) killBot(otherBot, bot);
              }
            }
            bot.cooldown = bot.bossPhaseIndex >= 2 ? random(2.5, 4) : random(4, 6);
            bot.energy -= 30;
          }
        }
      }
    }),
    "espectro-decisivo": Object.freeze({
      update(bot) {
        if (bot.bossClone) return;
        if (!bot.telegraphType && Math.random() < 0.025 * (bot.bossPhaseIndex + 1)) {
          bot.telegraphType = "area-slam";
          bot.telegraphTimer = 0.8;
          bot.telegraphMaxTimer = 0.8;
          bot.telegraphRadius = 90;
          sound(330, 0.15, "triangle", 0.03);
          return;
        }
        if (bot.telegraphType) {
          bot.telegraphTimer -= 1 / 60;
          if (bot.telegraphTimer <= 0) {
            bot.telegraphType = null;
            bot.telegraphTimer = 0;
            for (const clone of bots) {
              if (clone === bot || !clone.bossClone || clone.dead) continue;
              clone.x = clamp(player.x + random(-80, 80), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
              clone.y = clamp(player.y + random(-80, 80), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
              burst(clone.x, clone.y, clone.hue, 12);
              sound(330, 0.2, "triangle", 0.04);
            }
          }
        }
      }
    }),
    necrostro: Object.freeze({
      update(bot) {
        if (bot.cooldown > 0 || bot.energy <= 25) return;
        const healAmount = bot.bossPhaseIndex >= 2 ? 50 : bot.bossPhaseIndex >= 1 ? 18 : 12;
        const healRadius = bot.bossPhaseIndex >= 1 ? 450 : 400;
        for (const other of bots) {
          if (other === bot || other.dead) continue;
          const distance = Math.hypot(other.x - bot.x, other.y - bot.y);
          if (distance < healRadius) {
            const effective = Math.floor(healAmount * (1 - distance / healRadius));
            other.health = Math.min(other.maxHealth, other.health + effective);
            burst(other.x, other.y, 120, 3);
          }
        }
        spawnWave(bot.x, bot.y, 120, 180, 0.5);
        sound(220, 0.25, "sine", 0.03);
        bot.cooldown = bot.bossPhaseIndex >= 2 ? random(3, 5) : random(5, 8);
        bot.energy -= 25;
        if (bot.bossPhaseIndex >= 1) bot.health = Math.min(bot.maxHealth, bot.health + 3);
      }
    }),
    vortice: Object.freeze({
      update(bot, dt) {
        const pullStrength = bot.bossPhaseIndex >= 2 ? 230 : bot.bossPhaseIndex >= 1 ? 175 : 135;
        const pullRadius = 360;
        let direction = 1;
        if (bot.bossPhaseIndex >= 2) {
          bot.gravityModeTimer = (bot.gravityModeTimer || 2) - dt;
          if (bot.gravityModeTimer <= 0) {
            bot.gravityDirection = (bot.gravityDirection || 1) * -1;
            bot.gravityModeTimer = 2;
            spawnWave(bot.x, bot.y, bot.gravityDirection < 0 ? 188 : bot.hue, 220, 0.55);
          }
          direction = bot.gravityDirection || 1;
        }
        const dxp = bot.x - player.x;
        const dyp = bot.y - player.y;
        const playerDistance = Math.hypot(dxp, dyp) || 1;
        if (playerDistance < pullRadius) {
          const force = pullStrength * (1 - playerDistance / pullRadius) * direction;
          player.vx += (dxp / playerDistance) * force * dt;
          player.vy += (dyp / playerDistance) * force * dt;
        }
        for (const other of bots) {
          if (other === bot || other.dead) continue;
          const dx = bot.x - other.x;
          const dy = bot.y - other.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < pullRadius) {
            const force = pullStrength * 0.5 * (1 - distance / pullRadius) * direction;
            other.vx += (dx / distance) * force * dt;
            other.vy += (dy / distance) * force * dt;
          }
        }
        if (bot.bossPhaseIndex >= 1 && bot.cooldown <= 0 && bot.energy > 20) {
          for (let index = 0; index < 2; index += 1) {
            const angle = runTime * (1.9 + index * 0.35) + index * Math.PI;
            const orbitDistance = 85 + index * 58;
            const orbitX = bot.x + Math.cos(angle) * orbitDistance;
            const orbitY = bot.y + Math.sin(angle) * orbitDistance;
            if (Math.hypot(player.x - orbitX, player.y - orbitY) < 54) {
              damagePlayer(Math.floor(bot.attackDamage * 0.42), orbitX, orbitY);
            }
          }
          spawnWave(bot.x, bot.y, bot.hue, 120, 0.4);
          bot.cooldown = random(2.8, 4.5);
          bot.energy -= 20;
        }
      }
    }),
    cicatriz: Object.freeze({
      update(bot) {
        if (bot.cooldown > 0 || bot.energy <= 20) return;
        const woundCount = bot.bossPhaseIndex >= 2 ? 5 : bot.bossPhaseIndex >= 1 ? 3 : 1;
        for (let index = 0; index < woundCount; index += 1) {
          const woundX = bot.bossPhaseIndex >= 2
            ? clamp(random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN)
            : clamp(bot.x + random(-120, 120), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          const woundY = bot.bossPhaseIndex >= 2
            ? clamp(random(WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN)
            : clamp(bot.y + random(-120, 120), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          scars.push({ x: woundX, y: woundY, hue: 350, life: 15, maxLife: 15, radius: 55, wound: true, owner: bot });
        }
        spawnWave(bot.x, bot.y, 350, 80, 0.4);
        sound(55, 0.2, "sawtooth", 0.04);
        bot.cooldown = bot.bossPhaseIndex >= 2 ? random(2, 3.5) : random(3.5, 6);
        bot.energy -= 20;
      }
    }),
    mimico: Object.freeze({
      update(bot) {
        if (bot.cooldown > 0 || bot.energy <= 35 || player.mutations.length === 0) return;
        const maxCopies = bot.bossPhaseIndex >= 2 ? 3 : bot.bossPhaseIndex >= 1 ? 2 : 1;
        copyMimicMutations(bot, maxCopies);
        if (bot.copiedRegen) bot.health = Math.min(bot.maxHealth, bot.health + bot.copiedRegen * 4);
        spawnWave(bot.x, bot.y, bot.hue, 100, 0.5);
        burst(bot.x, bot.y, bot.hue, 14);
        sound(380, 0.2, "triangle", 0.04);
        bot.cooldown = random(6, 9);
        bot.energy -= 35;
      }
    }),
    silenciador: Object.freeze({
      update(bot) {
        if (bot.cooldown > 0 || bot.energy <= 30) return;
        const permanent = bot.bossPhaseIndex >= 2 && bots.some((candidate) => candidate.silenceAnchor && !candidate.dead);
        const silenceDuration = bot.bossPhaseIndex >= 1 ? 4 : 3;
        const silenceInterval = bot.bossPhaseIndex >= 1 ? 5 : 8;
        silencePlayer(permanent ? Number.POSITIVE_INFINITY : silenceDuration, permanent);
        spawnWave(player.x, player.y, 280, 140, 0.7);
        burst(player.x, player.y, 280, 16);
        sound(82, 0.3, "sawtooth", 0.05);
        showToast(permanent ? "SILÊNCIO ABSOLUTO — ROMPA A ÂNCORA" : "SILENCIADO — MUTAÇÕES DESATIVADAS", 2200);
        bot.cooldown = silenceInterval;
        bot.energy -= 30;
      }
    }),
    prisma: Object.freeze({
      update(bot) {
        if (bot.cooldown > 0 || bot.energy <= 25) return;
        const dashAngle = Math.random() * TAU;
        bot.vx += Math.cos(dashAngle) * 250;
        bot.vy += Math.sin(dashAngle) * 250;
        spawnWave(bot.x, bot.y, bot.hue, 60, 0.3);
        burst(bot.x, bot.y, bot.hue, 8);
        bot.cooldown = random(1.5, 3);
        bot.energy -= 25;
      }
    })
  });

  function runBossMechanic(bot, dt) {
    if (!bot.boss || !bot.bossTemplate || bot.bossPhaseTransitioning) return;
    runPrismaFragmentMechanic(bot);
    const mechanic = bossMechanicRegistry[bot.archetype];
    mechanic?.update(bot, dt, {
      distToPlayer: Math.hypot(bot.x - player.x, bot.y - player.y)
    });
  }

  function respawnBot(bot) {
    if (bot.boss) return;
    const fresh = createBot(Math.floor(Math.random() * names.length));
    Object.assign(bot, fresh, { id: bot.id });
  }

  function spawnWave(x, y, hue, maxRadius = 70, life = 0.5) {
    waves.push({ x, y, radius: 10, maxRadius, life, maxLife: life, hue, width: 2 });
  }

  function spawnParticle(x, y, hue, speed = 100, life = 0.5) {
    const maxParticles = MOBILE_QUALITY ? 60 : 200;
    if (particles.length >= maxParticles) return;
    const angle = Math.random() * TAU;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed * random(0.45, 1),
      vy: Math.sin(angle) * speed * random(0.45, 1),
      hue,
      life,
      maxLife: life,
      radius: random(1.2, 3.4)
    });
  }

  function burst(x, y, hue, count) {
    const limit = MOBILE_QUALITY ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < limit; i += 1) spawnParticle(x, y, hue, random(80, 260), random(0.28, 0.8));
  }

  function worldTarget() {
    return {
      x: camera.x + (pointer.x - width / 2) / camera.zoom,
      y: camera.y + (pointer.y - height / 2) / camera.zoom
    };
  }

  function updatePlayer(dt) {
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.hitTimer = Math.max(0, player.hitTimer - dt);
    if (!player.phasing && player.hitTimer <= 0 && player.health < player.maxHealth) {
      const baseRegen = 1.15;
      const upgradeRegen = playerUpgrades.regeneration * 0.3;
      player.health = Math.min(player.maxHealth, player.health + (baseRegen + upgradeRegen) * dt);
    }
    player.comboTimer -= dt;
    if (player.comboTimer <= 0) player.combo = 0;

    if (player.skinId === "caotico") player.hue = (runTime * 52) % 360;

    if (player.silenced && !player.silencePermanent) {
      player.silencedTimer -= dt;
      if (player.silencedTimer <= 0) restorePlayerMutations();
    }

    if (player.chainTimer > 0) {
      player.chainTimer -= dt;
      if (player.chainTimer <= 0) player.chainCombo = 0;
    }

    const target = worldTarget();
    if (player.phasing && player.phase) {
      const phase = player.phase;
      const phaseEntity = { x: phase.x, y: phase.y, vx: phase.vx, vy: phase.vy };
      steerVelocity(phaseEntity, target.x, target.y, player.phaseSpeed, dt, 8.5);
      phase.vx = phaseEntity.vx;
      phase.vy = phaseEntity.vy;
      phase.x = clamp(phase.x + phase.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      phase.y = clamp(phase.y + phase.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.max(0, player.energy - player.phaseDrain * dt);
      const last = phase.points[phase.points.length - 1];
      const segmentDistance = Math.hypot(phase.x - last.x, phase.y - last.y);
      if (segmentDistance > 11) {
        phase.points.push({ x: phase.x, y: phase.y });
        phase.distance += segmentDistance;
        if (phase.points.length > 100) phase.points.shift();
      }

      if (player.vortexPull) {
        const vortexRadius = 120;
        const vortexStrength = 2.8 * (player.vortexPullBonus || 1);
        for (const bot of bots) {
          if (bot.dead || bot.phasing) continue;
          const dx = phase.x - bot.x;
          const dy = phase.y - bot.y;
          const dist = Math.hypot(dx, dy);
          if (dist < vortexRadius && dist > 5) {
            const pull = vortexStrength * (1 - dist / vortexRadius) * dt * 60;
            bot.vx += (dx / dist) * pull;
            bot.vy += (dy / dist) * pull;
          }
        }
      }

      collectMotes(phase, true);
      if (player.energy <= 0) endPhase();
    } else {
      steerVelocity(player, target.x, target.y, 205, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.min(player.maxEnergy, player.energy + 13 * dt);
      collectMotes(player, false);
    }

    resolveEntityOverlap();
  }

  function collectMotes(entity, spectral) {
    for (let index = motes.length - 1; index >= 0; index -= 1) {
      const mote = motes[index];
      const range = (spectral ? 16 : player.radius) + mote.radius + 5 + player.pickupRadius * (spectral ? (player.phasePickupBonus || 1) : 1);
      if (distanceSq(entity.x, entity.y, mote.x, mote.y) > range * range) continue;
      motes.splice(index, 1);
      const baseValue = mote.type === "gold" ? 7 : mote.type === "red" ? 10 : mote.type === "violet" ? 3 : 1;
      const spectralMultiplier = spectral ? 0.72 : 1;
      player.score += baseValue * spectralMultiplier * (player.scoreMultiplier || 1);
      player.energy = clamp(player.energy + baseValue * (spectral ? 1.5 : 0.8), 0, player.maxEnergy);
      player.combo = player.comboTimer > 0 ? player.combo + 1 : 1;
      player.comboTimer = 1.45;
      if (player.combo > runStats.maxCombo) runStats.maxCombo = player.combo;
      runStats.score = Math.floor(player.score);

      if (mote.type === "red" && !spectral) {
        player.health = Math.max(1, player.health - 5);
        runStats.redMotes += 1;
        showToast("FRAGMENTO VERMELHO // DANO RECEBIDO", 1200);
        for (const bot of bots) {
          if (bot.dead) continue;
          const dist = Math.hypot(bot.x - mote.x, bot.y - mote.y);
          if (dist < 200 && dist > 5) {
            bot.vx += ((bot.x - mote.x) / dist) * 120;
            bot.vy += ((bot.y - mote.y) / dist) * 120;
          }
        }
        spawnWave(mote.x, mote.y, 0, 55, 0.5);
      }

      if (player.moteHealing) player.health = clamp(player.health + (mote.type === "gold" ? 3 : mote.type === "red" ? 1.5 : 0.7) * Math.min(2.2, 1 + player.combo / 20) * player.healScale, 0, player.maxHealth);
      playCollectSound(mote.type);
      for (let i = 0; i < (mote.type === "gold" ? 7 : mote.type === "red" ? 5 : 3); i += 1) spawnParticle(mote.x, mote.y, mote.type === "gold" ? 42 : mote.type === "red" ? 0 : mote.type === "violet" ? 268 : 188, random(30, 90), 0.35);
      motes.push(createMote());
      checkMutation();
    }
  }

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

  const defaultEnemyBehavior = Object.freeze({});
  const enemyBehaviorRegistry = Object.freeze({
    hunter: Object.freeze({ attackRange: 430 }),
    berserker: Object.freeze({
      beforeMovement(bot) {
        const definition = botArchetypes.find((entry) => entry.id === bot.archetype);
        if (bot.health < bot.maxHealth * 0.4) {
          bot.speed = bot.baseSpeed * 1.4;
          bot.attackDamage = Math.ceil(definition.attackDamage * 1.5);
        } else {
          bot.speed = bot.baseSpeed;
          bot.attackDamage = definition.attackDamage;
        }
      }
    }),
    swarmer: Object.freeze({
      attackRange: 310,
      beforeMovement(bot) {
        let nearbyPack = 0;
        for (const ally of bots) {
          if (ally === bot || ally.dead || ally.faction !== bot.faction || ally.archetype !== bot.archetype) continue;
          if (distanceSq(bot.x, bot.y, ally.x, ally.y) < 190 * 190) nearbyPack += 1;
        }
        bot.speed = bot.baseSpeed * (1 + Math.min(0.3, nearbyPack * 0.1));
      }
    }),
    phantom: Object.freeze({
      untargetableWhileStealthed: true,
      beforeMovement(bot, dt) {
        bot.stealthTimer += dt;
        const threshold = bot.stealthed ? 2 : 4;
        if (bot.stealthTimer >= threshold) {
          bot.stealthed = !bot.stealthed;
          bot.stealthTimer = 0;
          burst(bot.x, bot.y, bot.hue, 6);
        }
      }
    }),
    sniper: Object.freeze({
      attackRange: 580,
      phaseAttack: false,
      updateTarget(bot) {
        const dx = bot.x - player.x;
        const dy = bot.y - player.y;
        const distanceToPlayer = Math.hypot(dx, dy) || 1;
        const ideal = bot.idealRange || 470;
        if (distanceToPlayer < ideal - 115) {
          bot.targetX = clamp(bot.x + (dx / distanceToPlayer) * 300, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          bot.targetY = clamp(bot.y + (dy / distanceToPlayer) * 300, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        } else if (distanceToPlayer > ideal + 135) {
          bot.targetX = player.x;
          bot.targetY = player.y;
        } else if (bot.sniperAimTimer <= 0) {
          const strafeDirection = Math.sin(runTime * 0.7 + bot.x) >= 0 ? 1 : -1;
          bot.targetX = clamp(player.x + (dx / distanceToPlayer) * ideal + (-dy / distanceToPlayer) * 150 * strafeDirection, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          bot.targetY = clamp(player.y + (dy / distanceToPlayer) * ideal + (dx / distanceToPlayer) * 150 * strafeDirection, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        } else {
          bot.targetX = bot.x;
          bot.targetY = bot.y;
        }
      },
      movementSpeed(bot) {
        return bot.sniperAimTimer > 0 ? bot.speed * 0.22 : bot.speed;
      },
      afterMovement(bot, dt) {
        updateSniper(bot, dt);
      }
    }),
    sprinter: Object.freeze({
      phaseAttack: false,
      afterMovement(bot) {
        if (bot.cooldown <= 0) {
          const distToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
          if (distToPlayer < player.radius + bot.radius + 8) {
            damagePlayer(bot.attackDamage, bot.x, bot.y);
            bot.cooldown = random(1.2, 2.5);
            const angle = Math.atan2(bot.y - player.y, bot.x - player.x);
            bot.vx += Math.cos(angle) * 220;
            bot.vy += Math.sin(angle) * 220;
          }
        }

        let closestEnemy = null;
        let closestDist = Infinity;
        for (const other of bots) {
          if (other === bot || other.dead || other.faction === bot.faction || other.boss) continue;
          const distance = Math.hypot(bot.x - other.x, bot.y - other.y);
          if (distance < closestDist) {
            closestEnemy = other;
            closestDist = distance;
          }
        }
        if (closestEnemy && closestDist < 300) {
          bot.targetX = closestEnemy.x;
          bot.targetY = closestEnemy.y;
        } else {
          const playerDistance = Math.hypot(bot.x - player.x, bot.y - player.y);
          if (playerDistance < 400) {
            bot.targetX = player.x;
            bot.targetY = player.y;
          }
        }
      }
    }),
    bruiser: Object.freeze({ attackRange: 320 }),
    bulwark: Object.freeze({ attackRange: 320 })
  });

  function getEnemyBehavior(bot) {
    return enemyBehaviorRegistry[bot.archetype] || defaultEnemyBehavior;
  }

  function updateBots(dt) {
    for (const bot of bots) {
      if (bot.dead) {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0 && !bot.boss && !bot.bossClone && !bot.noRespawn) respawnBot(bot);
        continue;
      }

      bot.cooldown -= dt;
      bot.hitTimer = Math.max(0, bot.hitTimer - dt);
      bot.thinkTimer -= dt;
      bot.energy = Math.min(100, bot.energy + 8 * dt);
      const behavior = getEnemyBehavior(bot);
      behavior.beforeMovement?.(bot, dt);

      if (bot.prismaIllusion) {
        bot.illusionLife -= dt;
        if (bot.illusionLife <= 0) {
          bot.dead = true;
          bot.respawnTimer = Number.POSITIVE_INFINITY;
          burst(bot.x, bot.y, bot.hue, 6);
          continue;
        }
      }

      if (bot.boss && bot.bossPhaseTransitioning) {
        bot.bossPhaseTimer -= dt;
        if (bot.bossPhaseTimer <= 0) bot.bossPhaseTransitioning = false;
      }

      if (bot.phasing && bot.phase) {
        updateBotPhase(bot, dt);
        continue;
      }

      if (bot.thinkTimer <= 0) {
        bot.thinkTimer = random(0.5, 1.4);
        bot.factionTarget = null;
        let closestEnemy = null;
        let closestEnemyDist = Infinity;
        for (const other of bots) {
          if (other === bot || other.dead || other.faction === bot.faction || other.boss) continue;
          const distance = Math.hypot(bot.x - other.x, bot.y - other.y);
          if (distance < closestEnemyDist) {
            closestEnemy = other;
            closestEnemyDist = distance;
          }
        }
        if (closestEnemy && closestEnemyDist < 480 && bot.aggression > 0.45 && bot.health > 32) {
          bot.targetX = closestEnemy.x + (closestEnemy.vx || 0) * 0.6;
          bot.targetY = closestEnemy.y + (closestEnemy.vy || 0) * 0.6;
          bot.factionTarget = closestEnemy;
        } else {
          const playerDistance = Math.hypot(bot.x - player.x, bot.y - player.y);
          if (playerDistance < 520 && bot.aggression > 0.45 && bot.health > 32) {
            bot.targetX = player.x + player.vx * 0.7;
            bot.targetY = player.y + player.vy * 0.7;
          } else {
            let closest = null;
            let closestDistance = Infinity;
            for (let sample = 0; sample < 28; sample += 1) {
              const mote = motes[Math.floor(Math.random() * motes.length)];
              const distance = distanceSq(bot.x, bot.y, mote.x, mote.y);
              if (distance < closestDistance) {
                closest = mote;
                closestDistance = distance;
              }
            }
            if (closest) {
              bot.targetX = closest.x;
              bot.targetY = closest.y;
            }
          }
        }
      }

      behavior.updateTarget?.(bot, dt);
      const desired = { x: bot.x, y: bot.y, vx: bot.vx, vy: bot.vy };
      const movementSpeed = behavior.movementSpeed?.(bot) ?? bot.speed;
      steerVelocity(desired, bot.targetX, bot.targetY, movementSpeed, dt, 3.3);
      bot.vx = desired.vx;
      bot.vy = desired.vy;
      bot.x = clamp(bot.x + bot.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.y = clamp(bot.y + bot.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      collectBotMotes(bot);
      behavior.afterMovement?.(bot, dt);

      const distanceToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
      const allyAlreadyAttacking = bots.some((other) => (
        other !== bot
        && other.phasing
        && other.faction === bot.faction
        && distanceSq(other.x, other.y, player.x, player.y) < 600 * 600
      ));
      let attackRange = bot.boss ? 540 : (behavior.attackRange ?? 360);
      if (bot.longRange) attackRange = 580;
      if (bot.swarmer) attackRange = 310;
      if (bot.heavyHit) attackRange = 320;

      runBossMechanic(bot, dt);

      if (behavior.phaseAttack !== false && !bot.stealthed && !(bot.boss && bot.bossPhaseTransitioning)) {
        if (bot.factionTarget && !bot.factionTarget.dead && bot.cooldown <= 0 && bot.energy > 45 && bot.aggression > 0.5) {
          const distToTarget = Math.hypot(bot.x - bot.factionTarget.x, bot.y - bot.factionTarget.y);
          if (distToTarget < attackRange) {
            beginBotPhase(bot, bot.factionTarget);
          }
        } else if (bot.cooldown <= 0 && bot.energy > 45 && distanceToPlayer < attackRange && bot.aggression > 0.5 && (!allyAlreadyAttacking || bot.boss || bot.swarmer)) {
          beginBotPhase(bot);
        }
      }
    }
  }


  function updateSniper(bot, dt) {
    const fallbackTarget = player;

    if (bot.sniperAimTimer > 0) {
      const target = bot.sniperTarget && !bot.sniperTarget.dead ? bot.sniperTarget : fallbackTarget;
      bot.sniperTarget = target;
      bot.sniperAimTimer -= dt;

      const leadScale = target === player ? 0.2 : 0.3;
      const tracking = clamp(dt * 2.2, 0, 1);
      bot.sniperAimX = lerp(bot.sniperAimX, target.x + (target.vx || 0) * leadScale, tracking);
      bot.sniperAimY = lerp(bot.sniperAimY, target.y + (target.vy || 0) * leadScale, tracking);

      if (bot.sniperAimTimer <= 0) {
        const dx = bot.sniperAimX - bot.x;
        const dy = bot.sniperAimY - bot.y;
        const distance = Math.hypot(dx, dy) || 1;
        const shotLength = 820;
        const endX = clamp(bot.x + (dx / distance) * shotLength, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        const endY = clamp(bot.y + (dy / distance) * shotLength, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        const points = [{ x: bot.x, y: bot.y }, { x: endX, y: endY }];

        ribbons.push({
          points,
          hue: bot.hue,
          life: 0.24,
          maxLife: 0.24,
          width: 3.2,
          sniperShot: true
        });
        spawnWave(bot.x, bot.y, bot.hue, 62, 0.32);
        burst(bot.x, bot.y, bot.hue, 10);
        sound(178, 0.12, "square", 0.035);
        setTimeout(() => sound(62, 0.2, "triangle", 0.028), 35);

        if (target === player) {
          const missDistance = pointToSegmentDistance(player.x, player.y, bot.x, bot.y, endX, endY);
          if (missDistance < player.radius + 10) {
            damagePlayer(bot.attackDamage * random(0.96, 1.08), bot.x, bot.y);
          }
        } else if (!target.dead) {
          const missDistance = pointToSegmentDistance(target.x, target.y, bot.x, bot.y, endX, endY);
          if (missDistance < target.radius + 9) {
            damageBot(target, bot.attackDamage * random(0.92, 1.06), bot, bot.x, bot.y);
          }
        }

        bot.cooldown = random(3.6, 5.1);
        bot.energy = Math.max(0, bot.energy - 34);
        bot.sniperTarget = null;
        bot.sniperAimTimer = 0;
      }
      return;
    }

    if (bot.cooldown > 0 || bot.energy < 34 || bot.stealthed) return;

    const factionTarget = bot.factionTarget && !bot.factionTarget.dead ? bot.factionTarget : null;
    const target = factionTarget || fallbackTarget;
    const targetDistance = Math.hypot(bot.x - target.x, bot.y - target.y);
    if (targetDistance < 245 || targetDistance > 700) return;

    bot.sniperTarget = target;
    bot.sniperAimDuration = targetDistance > 540 ? 1.12 : 0.92;
    bot.sniperAimTimer = bot.sniperAimDuration;
    bot.sniperAimX = target.x + (target.vx || 0) * 0.42;
    bot.sniperAimY = target.y + (target.vy || 0) * 0.42;
    bot.vx *= 0.35;
    bot.vy *= 0.35;
    spawnWave(bot.x, bot.y, bot.hue, 40, 0.35);

    if (target === player && !bot.sniperWarned) {
      bot.sniperWarned = true;
      showToast("FRANCO-ATIRADOR MIRANDO — SAIA DA LINHA", 1700);
    }
  }

  function collectBotMotes(bot) {
    for (let index = motes.length - 1; index >= 0; index -= 1) {
      const mote = motes[index];
      const range = bot.radius + mote.radius + 3;
      if (distanceSq(bot.x, bot.y, mote.x, mote.y) < range * range) {
        bot.score += mote.type === "gold" ? 5 : mote.type === "violet" ? 2 : 1;
        bot.energy = Math.min(100, bot.energy + 2);
        motes.splice(index, 1);
        motes.push(createMote());
        break;
      }
    }
  }

  function beginBotPhase(bot, target = null) {
    const isPlayerTarget = !target || target === player;
    let targetX, targetY;
    if (isPlayerTarget) {
      targetX = player.phasing && player.phase ? player.x : player.x + player.vx * 0.8;
      targetY = player.phasing && player.phase ? player.y : player.y + player.vy * 0.8;
    } else {
      targetX = target.x + (target.vx || 0) * 0.6;
      targetY = target.y + (target.vy || 0) * 0.6;
    }
    const dx = targetX - bot.x;
    const dy = targetY - bot.y;
    const distance = Math.hypot(dx, dy) || 1;
    let maxTravel = bot.boss ? 560 : bot.fastPhase ? 460 : 390;
    if (bot.longRange) maxTravel = 520;
    if (bot.swarmer) maxTravel = 340;
    if (bot.heavyHit) maxTravel = 350;
    const travel = clamp(distance + 70, 150, maxTravel);
    let phaseVelocity = bot.boss ? 455 : bot.fastPhase ? 430 : 390;
    if (bot.longRange) phaseVelocity = 440;
    if (bot.swarmer) phaseVelocity = 460;
    if (bot.heavyHit) phaseVelocity = 350;
    bot.phasing = true;
    bot.phase = {
      x: bot.x,
      y: bot.y,
      vx: (dx / distance) * phaseVelocity,
      vy: (dy / distance) * phaseVelocity,
      targetX: bot.x + (dx / distance) * travel,
      targetY: bot.y + (dy / distance) * travel,
      life: clamp(travel / phaseVelocity, 0.38, bot.boss ? 1.2 : 0.92),
      points: [{ x: bot.x, y: bot.y }],
      attackTarget: isPlayerTarget ? null : target
    };
    bot.energy -= 40;
    spawnWave(bot.x, bot.y, bot.hue, 34, 0.35);
  }

  function updateBotPhase(bot, dt) {
    const phase = bot.phase;
    phase.life -= dt;
    phase.x += phase.vx * dt;
    phase.y += phase.vy * dt;
    const last = phase.points[phase.points.length - 1];
    if (Math.hypot(phase.x - last.x, phase.y - last.y) > 12) phase.points.push({ x: phase.x, y: phase.y });
    if (phase.life <= 0 || phase.x < WORLD_MARGIN || phase.x > WORLD_SIZE - WORLD_MARGIN || phase.y < WORLD_MARGIN || phase.y > WORLD_SIZE - WORLD_MARGIN) {
      const points = phase.points.map((point) => ({ ...point }));
      bot.x = clamp(phase.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.y = clamp(phase.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.phasing = false;
      bot.phase = null;
      bot.cooldown = bot.boss ? random(2.3, 3.8) : bot.fastPhase ? random(3.5, 5.6) : bot.swarmer ? random(2.8, 4.5) : random(5.2, 9.2);
      ribbons.push({ points, hue: bot.hue, life: 0.38, maxLife: 0.38, width: 8 });
      let hitPlayer = false;
      const hitBots = new Set();
      for (let index = 1; index < points.length; index += 1) {
        const a = points[index - 1];
        const b = points[index];
        if (!hitPlayer) {
          const tx = player.x;
          const ty = player.y;
          if (pointToSegmentDistance(tx, ty, a.x, a.y, b.x, b.y) < player.radius + 10) {
            let dmg = bot.attackDamage * random(0.88, 1.12);
            if (bot.heavyHit) dmg *= 1.4;
            damagePlayer(dmg, bot.x, bot.y);
            if (bot.energyDrain) player.energy = Math.max(0, player.energy - bot.energyDrain);
            hitPlayer = true;
          }
        }
        for (const other of bots) {
          const otherBehavior = getEnemyBehavior(other);
          if (other === bot || other.dead || other.faction === bot.faction || hitBots.has(other.id) || (otherBehavior.untargetableWhileStealthed && other.stealthed)) continue;
          if (pointToSegmentDistance(other.x, other.y, a.x, a.y, b.x, b.y) < other.radius + 10) {
            let dmg = bot.attackDamage * random(0.88, 1.12);
            if (bot.heavyHit) dmg *= 1.4;
            damageBot(other, dmg, bot, bot.x, bot.y);
            hitBots.add(other.id);
          }
        }
        if (hitPlayer && hitBots.size > 0) break;
      }
      spawnWave(bot.x, bot.y, bot.hue, 58, 0.4);
    }
  }

  function resolveEntityOverlap() {
    if (player.phasing) return;
    for (const bot of bots) {
      if (bot.dead || bot.phasing) continue;
      const dx = player.x - bot.x;
      const dy = player.y - bot.y;
      const distance = Math.hypot(dx, dy) || 1;
      const minimum = player.radius + bot.radius + 2;
      if (distance < minimum) {
        const overlap = minimum - distance;
        player.x += (dx / distance) * overlap * 0.55;
        player.y += (dy / distance) * overlap * 0.55;
        bot.x -= (dx / distance) * overlap * 0.45;
        bot.y -= (dy / distance) * overlap * 0.45;
      }
    }
  }

  function updateEffects(dt) {
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.035, dt);
      particle.vy *= Math.pow(0.035, dt);
      if (particle.life <= 0) particles.splice(index, 1);
    }
    for (let index = ribbons.length - 1; index >= 0; index -= 1) {
      const ribbon = ribbons[index];
      ribbon.life -= dt;
      if (ribbon.dangerLife > 0 && ribbon.owner === player) {
        const before = ribbon.hitIds.size;
        ribbon.hitIds = damageAlongPath(ribbon.points, ribbon.damage, player, ribbon.hitIds);
        const newHits = ribbon.hitIds.size - before;
        if (player.siphon && newHits > 0) {
          player.energy = clamp(player.energy + newHits * 8, 0, player.maxEnergy);
          player.health = clamp(player.health + newHits * 3 * player.healScale, 0, player.maxHealth);
        }
        ribbon.dangerLife -= dt;
      }
      if (ribbon.life <= 0) ribbons.splice(index, 1);
    }
    for (let index = waves.length - 1; index >= 0; index -= 1) {
      const wave = waves[index];
      wave.life -= dt;
      wave.radius = lerp(wave.radius, wave.maxRadius, 1 - Math.exp(-8 * dt));
      if (wave.life <= 0) waves.splice(index, 1);
    }
    for (let index = scars.length - 1; index >= 0; index -= 1) {
      scars[index].life -= dt;
      if (scars[index].wound && scars[index].life > 0 && state === "playing") {
        const s = scars[index];
        const woundOwner = s.owner;
        const dwp = Math.hypot(player.x - s.x, player.y - s.y);
        if (dwp < s.radius + player.radius && player.hitTimer <= 0) {
          const explode = woundOwner && woundOwner.bossPhaseIndex >= 1 && Math.random() < 0.02;
          damagePlayer(explode ? 12 : 5, s.x, s.y);
        }
      }
      if (scars[index].life <= 0) scars.splice(index, 1);
    }
    screenShake = Math.max(0, screenShake - 22 * dt);
    flash = Math.max(0, flash - 2.4 * dt);
  }

  function updateCamera(dt) {
    const target = player.phasing && player.phase ? player.phase : player;
    const leadX = (target.vx || 0) * 0.28;
    const leadY = (target.vy || 0) * 0.28;
    const amount = 1 - Math.exp(-4.8 * dt);
    camera.x = lerp(camera.x, target.x + leadX, amount);
    camera.y = lerp(camera.y, target.y + leadY, amount);
    const targetZoom = player.phasing ? 0.9 : 1;
    camera.zoom = lerp(camera.zoom, targetZoom, 1 - Math.exp(-3 * dt));
  }

  function updateHud() {
    const energy = Math.round(player.energy || 0);
    const health = Math.max(0, Math.round(player.health || 0));
    ui.score.textContent = Math.floor(player.score || 0).toString().padStart(3, "0");
    ui.kills.textContent = String(player.kills || 0);
    ui.time.textContent = formatTime(activeMode === "multiplayer" ? multiplayerRemaining : runTime);
    ui.integrity.textContent = health.toString();
    ui.integrityFill.style.width = `${clamp(player.health, 0, player.maxHealth || 100) / (player.maxHealth || 100) * 100}%`;
    ui.charge.textContent = `${energy}%`;
    ui.chargeFill.style.width = `${clamp(player.energy, 0, player.maxEnergy || 100) / (player.maxEnergy || 100) * 100}%`;
    ui.abilityRing.style.setProperty("--charge", `${clamp(player.energy, 0, player.maxEnergy || 100) / (player.maxEnergy || 100) * 100}%`);

    if (activeMode === "multiplayer") {
      ui.sector.textContent = `SALA ${multiplayerRoomCode} // ${formatTime(multiplayerRemaining)}`;
    } else {
      const sectorX = clamp(Math.floor(player.x / (WORLD_SIZE / 3)), 0, 2);
      const sectorY = clamp(Math.floor(player.y / (WORLD_SIZE / 3)), 0, 2);
      ui.sector.textContent = sectorNames[sectorY * 3 + sectorX];
    }
    const combo = player.combo || 0;
    ui.comboValue.textContent = Math.max(2, combo).toString();
    ui.combo.classList.toggle("is-visible", activeMode === "solo" && combo >= 5 && player.comboTimer > 0);

    if (leaderboardTimer <= 0) updateChallengePanel();

    if (activeBoss && !activeBoss.dead) {
      ui.bossBar.classList.remove("is-hidden");
      const activePhase = activeBoss.bossTemplate?.phases?.[activeBoss.bossPhaseIndex];
      const mechanic = activePhase?.description?.replace(/^Fase \d+\s*—\s*/, "").toUpperCase();
      ui.bossRole.textContent = mechanic ? `${activeBoss.roleLabel} // ${mechanic}` : activeBoss.roleLabel;
      ui.bossName.textContent = activeBoss.name;
      const bossHpRatio = clamp(activeBoss.health, 0, activeBoss.maxHealth) / activeBoss.maxHealth;
      ui.bossHpFill.style.width = `${bossHpRatio * 100}%`;
      if (activeBoss.bossPhaseTransitioning) {
        ui.bossHpFill.style.background = `linear-gradient(90deg, ${hsl(activeBoss.hue, 90, 64, 1)}, white)`;
      } else {
        ui.bossHpFill.style.background = "";
      }
    } else {
      ui.bossBar.classList.add("is-hidden");
    }
  }

  function updateLeaderboard() {
    const visibleBots = activeMode === "multiplayer" ? bots : bots.filter((bot) => !bot.dead);
    const entries = visibleBots.map((bot) => ({ name: bot.name, score: Math.floor(bot.score || 0), player: false }));
    entries.push({ name: player.name, score: Math.floor(player.score), player: true });
    entries.sort((a, b) => b.score - a.score);
    ui.leaderboard.replaceChildren();
    for (const [index, entry] of entries.slice(0, 6).entries()) {
      const item = document.createElement("li");
      if (entry.player) item.className = "is-player";
      item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(entry.name)}</strong><em>${entry.score}</em>`;
      ui.leaderboard.append(item);
    }
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function spawnSoloBoss(templateId = null) {
    if (activeMode !== "solo" || state !== "playing" || bossSpawned) return;
    bossSpawned = true;
    const boss = createBoss(templateId);
    const stageMultiplier = 1 + soloStage * 0.18;
    boss.health = Math.floor(boss.health * stageMultiplier);
    boss.maxHealth = boss.health;
    boss.attackDamage = Math.floor(boss.attackDamage * (1 + soloStage * 0.12));
    const angle = Math.random() * TAU;
    boss.x = clamp(player.x + Math.cos(angle) * 620, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    boss.y = clamp(player.y + Math.sin(angle) * 620, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(boss);
    activeBoss = boss;
    showToast(boss.bossTemplate.spawnDialogue, 3200);
    sound(62, 1.1, "sawtooth", 0.07);
  }

  function updateSoloDirector() {
    const nextStage = runTime >= 240 ? 4 : runTime >= 170 ? 3 : runTime >= 110 ? 2 : runTime >= 65 ? 1 : runTime >= 30 ? 0.5 : 0;
    if (nextStage > soloStage) {
      soloStage = nextStage;
      let additions;
      let label;
      if (soloStage === 0.5) { additions = 1; label = "NOVOS SINAIS DETECTADOS"; }
      else if (soloStage === 1) { additions = 2; label = "AMEAÇA 2 // FREQÜÊNCIAS INIMIGAS ESCALONADAS"; }
      else if (soloStage === 2) { additions = 3; label = "AMEAÇA 3 // CAMPO DE BATALHA INSTÁVEL"; }
      else if (soloStage === 3) {
        additions = 2;
        label = "AMEAÇA 4 // MEGA-AMEAÇA DETECTADA";
        const megaIndices = [bots.length, bots.length + 1];
        for (const idx of megaIndices) {
          const arch = botArchetypes[idx % botArchetypes.length];
          const mega = createBot(idx, {
            health: arch.health * 1.6,
            maxHealth: arch.health * 1.6,
            attackDamage: Math.floor(arch.attackDamage * 1.3),
            speed: arch.speed * 1.1
          });
          bots.push(mega);
        }
      }
      else { additions = 3; label = "AMEAÇA 5 // TERMINAL IMINENTE"; }
      const firstIndex = bots.length;
      for (let index = 0; index < additions; index += 1) bots.push(createBot(firstIndex + index));
      showToast(label, 2200);
      sound(110 + soloStage * 34, 0.6, "sawtooth", 0.035);
    }
    if (!bossSpawned && runTime >= SOLO_BOSS_TIME) spawnSoloBoss();
  }

  function updateMultiplayer(dt) {
    if (!multiplayerSnapshot) return;
    runTime += dt;
    multiplayerRemaining = Math.max(0, multiplayerRemaining - dt);
    const blend = 1 - Math.exp(-16 * dt);
    for (const entity of [player, ...bots]) {
      if (Number.isFinite(entity.networkX)) entity.x = lerp(entity.x, entity.networkX, blend);
      if (Number.isFinite(entity.networkY)) entity.y = lerp(entity.y, entity.networkY, blend);
      if (Number.isFinite(entity.networkVx)) entity.vx = lerp(entity.vx || 0, entity.networkVx, blend);
      if (Number.isFinite(entity.networkVy)) entity.vy = lerp(entity.vy || 0, entity.networkVy, blend);
    }
    networkInputTimer -= dt;
    if (networkInputTimer <= 0 && multiplayerSocket?.readyState === WebSocket.OPEN) {
      networkInputTimer = 1 / 20;
      const target = worldTarget();
      multiplayerSocket.send(JSON.stringify({ type: "input", targetX: target.x, targetY: target.y }));
    }
    updateEffects(dt);
    updateCamera(dt);
    updateHud();
  }

  function update(dt) {
    if (state !== "playing") return;
    if (activeMode === "multiplayer") {
      updateMultiplayer(dt);
      return;
    }
    runTime += dt;
    runStats.runTime = runTime;
    updatePlayer(dt);
    updateBots(dt);
    updateSkills(dt);
    updateSoloDirector();
    updateEffects(dt);
    updateCamera(dt);
    updateMusic();
    updateHud();
    leaderboardTimer -= dt;
    if (leaderboardTimer <= 0) {
      leaderboardTimer = 0.7;
      updateLeaderboard();
    }
  }

  function toScreen(x, y) {
    return {
      x: (x - camera.x) * camera.zoom + width / 2,
      y: (y - camera.y) * camera.zoom + height / 2
    };
  }

  function visible(x, y, padding = 80) {
    const point = toScreen(x, y);
    return point.x > -padding && point.x < width + padding && point.y > -padding && point.y < height + padding;
  }

  function drawBackground(time) {
    const gradient = ctx.createRadialGradient(width * 0.52, height * 0.48, 0, width * 0.52, height * 0.48, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, "#0d0920");
    gradient.addColorStop(0.52, "#080612");
    gradient.addColorStop(1, "#03030a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const grid = 105 * camera.zoom;
    const offsetX = ((-camera.x * camera.zoom + width / 2) % grid + grid) % grid;
    const offsetY = ((-camera.y * camera.zoom + height / 2) % grid + grid) % grid;
    ctx.strokeStyle = "rgba(132, 105, 202, 0.055)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = offsetX; x < width; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = offsetY; y < height; y += grid) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    for (const seed of ambientSeeds) {
      if (!visible(seed.x, seed.y, 10)) continue;
      const point = toScreen(seed.x, seed.y);
      const pulse = 0.65 + Math.sin(time * 0.0007 + seed.x) * 0.25;
      ctx.fillStyle = hsl(seed.hue, 75, 70, seed.alpha * pulse);
      ctx.beginPath();
      ctx.arc(point.x, point.y, seed.radius * camera.zoom, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    drawWorldBoundary();
  }

  function drawWorldBoundary() {
    const topLeft = toScreen(0, 0);
    const bottomRight = toScreen(WORLD_SIZE, WORLD_SIZE);
    ctx.save();
    ctx.strokeStyle = "rgba(255, 79, 216, 0.13)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 12]);
    ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    ctx.setLineDash([]);

    if (!MOBILE_QUALITY) {
      const edgeGradient = ctx.createLinearGradient(topLeft.x, 0, topLeft.x + 130, 0);
      edgeGradient.addColorStop(0, "rgba(255, 50, 130, 0.08)");
      edgeGradient.addColorStop(1, "rgba(255, 50, 130, 0)");
      ctx.fillStyle = edgeGradient;
      ctx.fillRect(topLeft.x, topLeft.y, 130, bottomRight.y - topLeft.y);
    }
    ctx.restore();
  }

  function drawScars() {
    if (!MOBILE_QUALITY) {
      const wounds = scars.filter((scar) => scar.wound && scar.life > 0 && visible(scar.x, scar.y, scar.radius));
      ctx.save();
      ctx.strokeStyle = hsl(350, 88, 58, 0.14);
      ctx.lineWidth = 1;
      for (let index = 1; index < wounds.length; index += 1) {
        const previous = toScreen(wounds[index - 1].x, wounds[index - 1].y);
        const current = toScreen(wounds[index].x, wounds[index].y);
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const scar of scars) {
      if (!visible(scar.x, scar.y, scar.radius)) continue;
      const point = toScreen(scar.x, scar.y);
      const alpha = clamp(scar.life / scar.maxLife, 0, 1) * 0.24;
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, scar.radius * camera.zoom);
      gradient.addColorStop(0, hsl(scar.hue, 85, 55, alpha));
      gradient.addColorStop(0.35, hsl(scar.hue, 80, 40, alpha * 0.45));
      gradient.addColorStop(1, hsl(scar.hue, 80, 35, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, scar.radius * camera.zoom, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hsl(scar.hue, 85, 65, alpha * 0.75);
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        const angle = i * TAU / 5 + scar.x;
        ctx.beginPath();
        ctx.moveTo(point.x + Math.cos(angle) * 6, point.y + Math.sin(angle) * 6);
        ctx.lineTo(point.x + Math.cos(angle + 0.18) * scar.radius * camera.zoom, point.y + Math.sin(angle + 0.18) * scar.radius * camera.zoom);
        ctx.stroke();
      }
    }
  }

  function drawMotes(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const mote of motes) {
      if (!visible(mote.x, mote.y, 20)) continue;
      const point = toScreen(mote.x, mote.y);
      const pulse = 0.78 + Math.sin(time * 0.002 * mote.drift + mote.phase) * 0.22;
      const hue = mote.type === "gold" ? 42 : mote.type === "red" ? 0 : mote.type === "violet" ? 268 : 188;
      const radius = mote.radius * pulse * camera.zoom;
      if (!MOBILE_QUALITY) {
        ctx.shadowColor = hsl(hue, 90, mote.type === "red" ? 50 : 65, 0.9);
        ctx.shadowBlur = mote.type === "gold" ? 15 : mote.type === "red" ? 18 : 9;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = hsl(hue, mote.type === "red" ? 95 : 95, mote.type === "red" ? 55 : 68, 0.88);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TAU);
      ctx.fill();
      if (!MOBILE_QUALITY && mote.type === "gold") {
        ctx.strokeStyle = hsl(hue, 90, 72, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 5 + pulse * 2, 0, TAU);
        ctx.stroke();
      }
      if (mote.type === "red" && !MOBILE_QUALITY) {
        const warnPulse = 0.5 + Math.sin(time * 0.006 + mote.phase) * 0.5;
        ctx.strokeStyle = hsl(0, 95, 55, 0.55 * warnPulse);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 6 + pulse * 3, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hsl(30, 90, 60, 0.3 * warnPulse);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + 12 + pulse * 5, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRibbon(ribbon, active = false) {
    if (ribbon.points.length < 2) return;
    const alpha = active ? 0.75 : clamp(ribbon.life / ribbon.maxLife, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(ribbon.hue, 90, 60, 0.8);
      ctx.shadowBlur = active ? 18 : 12;
    }
    const lifeRatio = clamp(ribbon.life / ribbon.maxLife, 0, 1);
    const taperWidth = ribbon.width * (0.35 + lifeRatio * 0.65);
    ctx.beginPath();
    ribbon.points.forEach((point, index) => {
      const screen = toScreen(point.x, point.y);
      if (index === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    });
    ctx.strokeStyle = hsl(ribbon.hue, 94, 64, alpha * 0.22);
    ctx.lineWidth = taperWidth * 2.8 * camera.zoom;
    ctx.stroke();
    ctx.strokeStyle = hsl(ribbon.hue, 95, 74, alpha * 0.78);
    ctx.lineWidth = taperWidth * 0.7 * camera.zoom;
    ctx.stroke();
    if (!MOBILE_QUALITY) {
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.65})`;
      ctx.lineWidth = 1.2 * camera.zoom;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEntity(entity, isPlayer = false, spectral = false, time = 0) {
    if (!visible(entity.x, entity.y, 70)) return;
    const point = toScreen(entity.x, entity.y);
    const radius = (entity.radius || 16) * camera.zoom * (spectral ? 0.85 : 1);
    const healthRatio = clamp(entity.health / (entity.maxHealth || 100), 0, 1);
    const pulse = 1 + Math.sin(time * 0.004 + entity.x) * 0.035;
    const isLowHealth = !isPlayer && !spectral && healthRatio < 0.3 && healthRatio > 0;
    const renderHue = isPlayer && entity.skinId === "caotico" ? (time * 0.05) % 360 : entity.hue;
    const glow = isPlayer ? entity.skinGlow || 1 : 1;

    if (!isPlayer && !spectral && entity.archetype === "sniper" && entity.sniperAimTimer > 0) {
      const aimPoint = toScreen(entity.sniperAimX, entity.sniperAimY);
      const charge = 1 - clamp(entity.sniperAimTimer / Math.max(0.01, entity.sniperAimDuration), 0, 1);
      ctx.save();
      ctx.strokeStyle = hsl(entity.hue, 96, 68, 0.35 + charge * 0.55);
      ctx.lineWidth = 1.2 + charge * 1.8;
      ctx.setLineDash([8 - charge * 4, 7]);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(aimPoint.x, aimPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(aimPoint.x, aimPoint.y, 9 + charge * 8, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(aimPoint.x - 15, aimPoint.y);
      ctx.lineTo(aimPoint.x + 15, aimPoint.y);
      ctx.moveTo(aimPoint.x, aimPoint.y - 15);
      ctx.lineTo(aimPoint.x, aimPoint.y + 15);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    if (entity.alpha != null) ctx.globalAlpha = entity.alpha;
    ctx.translate(point.x, point.y);
    ctx.globalCompositeOperation = "lighter";
    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(renderHue, 90, 62, spectral ? 0.9 : 0.65);
      ctx.shadowBlur = (spectral ? 24 : 16) * glow;
    }

    if (!MOBILE_QUALITY || isPlayer) {
      const auraRadius = (isLowHealth ? radius * 2.8 : radius * 2.1) * glow;
      const auraAlpha = isLowHealth ? 0.42 + Math.sin(time * 0.008) * 0.18 : spectral ? 0.42 : 0.34;
      const aura = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, auraRadius);
      aura.addColorStop(0, hsl(isLowHealth ? 0 : renderHue, 95, isLowHealth ? 55 : 72, auraAlpha));
      aura.addColorStop(0.35, hsl(isLowHealth ? 0 : renderHue, 85, 55, spectral ? 0.14 : 0.1));
      aura.addColorStop(1, hsl(isLowHealth ? 0 : renderHue, 80, 40, 0));
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, TAU);
      ctx.fill();
    }

    if (!MOBILE_QUALITY) {
      ctx.rotate(time * 0.00045 * (isPlayer ? 1 : -1) + entity.x * 0.002);
      ctx.strokeStyle = hsl(renderHue, 92, 70, spectral ? 0.75 : 0.46);
      ctx.lineWidth = 1.15 * glow;
      ctx.setLineDash(spectral ? [3, 5] : []);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.35 * pulse, radius * 0.86, 0.4, 0, TAU);
      ctx.stroke();
      ctx.rotate(-time * 0.0009);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.75, radius * 1.45, -0.6, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (!MOBILE_QUALITY) {
      const coreGradient = ctx.createRadialGradient(-radius * 0.25, -radius * 0.3, 0, 0, 0, radius);
      coreGradient.addColorStop(0, spectral ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.92)");
      coreGradient.addColorStop(0.2, hsl(renderHue, 95, 75, spectral ? 0.75 : 0.95));
      coreGradient.addColorStop(0.72, hsl(renderHue, 85, 45, spectral ? 0.23 : 0.68));
      coreGradient.addColorStop(1, hsl(renderHue, 85, 35, 0.08));
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      for (let index = 0; index <= 18; index += 1) {
        const angle = index / 18 * TAU;
        const distortion = 1 + Math.sin(angle * 3 + time * 0.003 + entity.x) * 0.07;
        const x = Math.cos(angle) * radius * distortion;
        const y = Math.sin(angle) * radius * distortion;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = hsl(renderHue, 85, 50, spectral ? 0.5 : 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fill();
    }

    if (isPlayer && !spectral && !MOBILE_QUALITY) {
      const skinId = entity.skinId;
      ctx.save();
      ctx.rotate(time * 0.0012);
      if (skinId === "fenix" || skinId === "sangue") {
        const count = skinId === "fenix" ? 6 : 4;
        for (let index = 0; index < count; index += 1) {
          const angle = index * TAU / count;
          const distance = radius * (1.35 + 0.18 * Math.sin(time * 0.006 + index));
          ctx.fillStyle = hsl(renderHue + index * 5, 95, 62, 0.58);
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, skinId === "fenix" ? 2.2 : 1.7, 0, TAU);
          ctx.fill();
        }
      } else if (skinId === "gelo") {
        ctx.strokeStyle = hsl(renderHue, 95, 78, 0.62);
        for (let index = 0; index < 6; index += 1) {
          const angle = index * TAU / 6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          ctx.lineTo(Math.cos(angle) * radius * 1.55, Math.sin(angle) * radius * 1.55);
          ctx.stroke();
        }
      } else if (skinId === "neon" || skinId === "dourado" || skinId === "caotico") {
        ctx.strokeStyle = hsl(renderHue, 96, 70, 0.72);
        ctx.lineWidth = skinId === "neon" ? 2.3 : 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.45, 0, TAU);
        ctx.stroke();
      } else if (skinId === "sombra") {
        ctx.strokeStyle = hsl(280, 80, 55, 0.38);
        ctx.setLineDash([2, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.7, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    if (!isPlayer && !spectral && entity.faction != null && !entity.boss && !entity.bossClone) {
      const factionHues = [15, 200, 280];
      ctx.strokeStyle = hsl(factionHues[entity.faction] || renderHue, 88, 62, 0.34);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, -Math.PI * 0.75, Math.PI * 0.15);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    if (!MOBILE_QUALITY) ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(-radius * 0.18, -radius * 0.2, Math.max(1.4, radius * 0.12), 0, TAU);
    ctx.fill();
    ctx.restore();

    if (!spectral) {
      ctx.save();
      ctx.textAlign = "center";
      if (!MOBILE_QUALITY || isPlayer || entity.boss) {
        if (entity.roleLabel) {
          ctx.font = `600 ${entity.boss ? 12 : 10}px Inter, sans-serif`;
          ctx.fillStyle = entity.boss ? "rgba(255,85,122,0.95)" : hsl(renderHue, 88, 72, 0.7);
          ctx.fillText(entity.roleLabel, point.x, point.y - radius - 27);
        }
        ctx.font = `${isPlayer || entity.boss ? 700 : 600} ${entity.boss ? 16 : isPlayer ? 13 : 12}px Inter, sans-serif`;
        ctx.fillStyle = isPlayer ? "rgba(222,250,255,0.9)" : "rgba(205,197,220,0.72)";
        ctx.fillText(entity.name, point.x, point.y - radius - 15);
      }
      if (!isPlayer && (healthRatio < 0.99 || entity.boss)) {
        const barWidth = entity.boss ? 74 : 32;
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(point.x - barWidth / 2, point.y + radius + 10, barWidth, 2);
        ctx.fillStyle = hsl(renderHue, 90, 64, 0.85);
        ctx.fillRect(point.x - barWidth / 2, point.y + radius + 10, barWidth * healthRatio, 2);
      }
      ctx.restore();
    }
  }

  function drawShell(entity, time) {
    const point = toScreen(entity.x, entity.y);
    const radius = entity.radius * camera.zoom;
    drawEntity(entity, entity === player, false, time);
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.strokeStyle = hsl(entity.hue, 90, 70, 0.45 + Math.sin(time * 0.006) * 0.12);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 10, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawBots(time) {
    for (const bot of bots) {
      if (bot.dead) continue;
      drawBossTelegraph(bot);
      if (!MOBILE_QUALITY && bot.boss && bot.bossPhaseTransitioning) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        const pulse = 0.3 + Math.sin(time * 0.01) * 0.15;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 20 + Math.sin(time * 0.008) * 8, 0, TAU);
        ctx.strokeStyle = hsl(bot.hue, 80, 50, pulse);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        const phasePulse = 0.06 + bot.bossPhaseIndex * 0.04 + Math.sin(time * 0.004) * 0.03;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const gradient = ctx.createRadialGradient(point.x, point.y, radius * 0.5, point.x, point.y, radius + 22);
        gradient.addColorStop(0, hsl(bot.hue, 80, 40, phasePulse));
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(point.x - radius - 22, point.y - radius - 22, (radius + 22) * 2, (radius + 22) * 2);
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "necrostro" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const healPulse = 0.08 + Math.sin(time * 0.003) * 0.05;
        const healRadius = 400 * camera.zoom;
        const grad = ctx.createRadialGradient(point.x, point.y, radius, point.x, point.y, healRadius);
        grad.addColorStop(0, hsl(120, 80, 50, healPulse));
        grad.addColorStop(0.5, hsl(120, 70, 40, healPulse * 0.4));
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(point.x - healRadius, point.y - healRadius, healRadius * 2, healRadius * 2);
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "vortice" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        for (let i = 0; i < 3; i++) {
          const angle = time * 0.002 + (i * TAU / 3);
          const spiralR = radius + 20 + i * 15;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * spiralR, Math.sin(angle) * spiralR, 3, 0, TAU);
          ctx.fillStyle = hsl(240, 80, 60, 0.5);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, radius + 15, 0, TAU);
        ctx.strokeStyle = hsl(240, 70, 50, 0.15 + Math.sin(time * 0.005) * 0.08);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "cicatriz" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.strokeStyle = hsl(350, 90, 58, 0.32 + Math.sin(time * 0.006) * 0.12);
        ctx.lineWidth = 1.5;
        for (let index = 0; index < 5; index += 1) {
          const angle = index * TAU / 5 + time * 0.0004;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * radius * 0.4, Math.sin(angle) * radius * 0.4);
          ctx.lineTo(Math.cos(angle + 0.16) * radius * 2.2, Math.sin(angle + 0.16) * radius * 2.2);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "mimico" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        const copied = bot.copiedMutationIds || [];
        copied.forEach((id, index) => {
          const mutation = mutations.find((entry) => entry.id === id);
          const angle = time * 0.0018 + index * TAU / Math.max(1, copied.length);
          ctx.fillStyle = mutation?.color || hsl(bot.hue, 90, 65, 0.7);
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * (radius + 14), Math.sin(angle) * (radius + 14), 3, 0, TAU);
          ctx.fill();
        });
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "silenciador" && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        for (let index = 0; index < 3; index += 1) {
          const wave = (time * 0.05 + index * 18) % 58;
          ctx.strokeStyle = hsl(280, 78, 60, 0.3 * (1 - wave / 58));
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, radius + wave, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "prisma" && bot.boss && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * TAU + time * 0.001;
          const d = radius + 10 + Math.sin(time * 0.004 + i) * 5;
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * d, Math.sin(angle) * d, 2.5, 0, TAU);
          ctx.fillStyle = hsl((time * 0.05 + i * 60) % 360, 80, 65, 0.6);
          ctx.fill();
        }
        ctx.restore();
      }
      if (bot.prismaIllusion) {
        drawEntity({ ...bot, alpha: 0.22 }, false, false, time);
        continue;
      }
      if (bot.archetype === "phantom" && bot.stealthed) {
        if (bot.phasing && bot.phase) {
          drawRibbon({ points: bot.phase.points, hue: bot.hue, width: 4 }, true);
          drawEntity({ ...bot, x: bot.phase.x, y: bot.phase.y, alpha: 0.3 }, false, true, time);
        } else {
          drawEntity({ ...bot, alpha: 0.25 }, false, false, time);
        }
        continue;
      }
      if (!MOBILE_QUALITY && bot.archetype === "berserker" && bot.health < bot.maxHealth * 0.4) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const ragePulse = 0.15 + Math.sin(time * 0.012) * 0.1;
        const rageGrad = ctx.createRadialGradient(point.x, point.y, radius * 0.3, point.x, point.y, radius * 2.5);
        rageGrad.addColorStop(0, hsl(0, 90, 55, ragePulse));
        rageGrad.addColorStop(1, "transparent");
        ctx.fillStyle = rageGrad;
        ctx.fillRect(point.x - radius * 2.5, point.y - radius * 2.5, radius * 5, radius * 5);
        ctx.restore();
      }
      if (!MOBILE_QUALITY && bot.archetype === "bulwark" && !bot.dead) {
        const point = toScreen(bot.x, bot.y);
        const radius = bot.radius * camera.zoom;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.beginPath();
        ctx.arc(0, 0, radius + 6, 0, TAU);
        ctx.strokeStyle = hsl(bot.hue, 60, 55, 0.25 + Math.sin(time * 0.004) * 0.1);
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      if (bot.phasing && bot.phase) {
        drawRibbon({ points: bot.phase.points, hue: bot.hue, width: 6 }, true);
        drawShell(bot, time);
        drawEntity({ ...bot, x: bot.phase.x, y: bot.phase.y }, false, true, time);
      } else {
        drawEntity(bot, false, false, time);
      }
    }
  }

  function drawPlayer(time) {
    if (activeMode === "multiplayer" && player.respawnTimer > 0) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(238,232,255,0.88)";
      ctx.font = "600 13px Inter, sans-serif";
      ctx.fillText(`REMATERIALIZANDO // ${Math.ceil(player.respawnTimer)}`, width / 2, height / 2 + 70);
      ctx.restore();
      return;
    }
    if (player.phasing && player.phase) {
      drawRibbon({ points: player.phase.points, hue: player.hue, width: 8 * (player.skinTrail || 1) }, true);
      drawShell(player, time);
      drawEntity({ ...player, x: player.phase.x, y: player.phase.y }, true, true, time);

      const shell = toScreen(player.x, player.y);
      const ghost = toScreen(player.phase.x, player.phase.y);
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 9]);
      ctx.beginPath();
      ctx.moveTo(shell.x, shell.y);
      ctx.lineTo(ghost.x, ghost.y);
      ctx.stroke();
      ctx.restore();
    } else {
      drawEntity(player, true, false, time);
    }
    if (player.silenced) {
      const point = toScreen(player.phasing && player.phase ? player.phase.x : player.x, player.phasing && player.phase ? player.phase.y : player.y);
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.strokeStyle = hsl(280, 90, 68, 0.72 + Math.sin(time * 0.009) * 0.16);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius * camera.zoom + 14, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11, 11);
      ctx.lineTo(11, -11);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEffects() {
    for (const ribbon of ribbons) drawRibbon(ribbon, false);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const wave of waves) {
      if (!visible(wave.x, wave.y, wave.maxRadius)) continue;
      const point = toScreen(wave.x, wave.y);
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.strokeStyle = hsl(wave.hue, 92, 68, alpha * 0.65);
      ctx.lineWidth = wave.width * alpha;
      ctx.beginPath();
      ctx.arc(point.x, point.y, wave.radius * camera.zoom, 0, TAU);
      ctx.stroke();
    }
    for (const particle of particles) {
      if (!visible(particle.x, particle.y, 10)) continue;
      const point = toScreen(particle.x, particle.y);
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = hsl(particle.hue, 95, 70, alpha * 0.8);
      if (!MOBILE_QUALITY) ctx.shadowColor = hsl(particle.hue, 95, 62, alpha);
      ctx.beginPath();
      ctx.arc(point.x, point.y, particle.radius * alpha * camera.zoom, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  let minimapFrame = 0;
  const MINIMAP_SIZE = MOBILE_QUALITY ? 100 : 140;

  if (MOBILE_QUALITY && ui.minimap) {
    ui.minimap.width = 100;
    ui.minimap.height = 100;
  }

  function drawMinimap(time) {
    if (state !== "playing" || activeMode !== "solo") {
      ui.minimap.classList.add("is-hidden");
      return;
    }
    ui.minimap.classList.remove("is-hidden");

    minimapFrame += 1;
    if (minimapFrame % 6 !== 0 && ui.minimap.dataset.drawn === "1") return;
    ui.minimap.dataset.drawn = "1";

    const mctx = ui.minimap.getContext("2d");
    const mw = MINIMAP_SIZE;
    const mh = MINIMAP_SIZE;
    const scale = mw / WORLD_SIZE;

    mctx.clearRect(0, 0, mw, mh);

    mctx.fillStyle = "rgba(11, 9, 24, 0.85)";
    mctx.fillRect(0, 0, mw, mh);

    mctx.strokeStyle = "rgba(132, 105, 202, 0.15)";
    mctx.lineWidth = 0.5;
    const gridStep = mw / 3;
    for (let i = 1; i < 3; i += 1) {
      mctx.beginPath();
      mctx.moveTo(i * gridStep, 0);
      mctx.lineTo(i * gridStep, mh);
      mctx.stroke();
      mctx.beginPath();
      mctx.moveTo(0, i * gridStep);
      mctx.lineTo(mw, i * gridStep);
      mctx.stroke();
    }

    for (const bot of bots) {
      if (bot.dead) continue;
      const bx = bot.x * scale;
      const by = bot.y * scale;
      if (bot.boss) {
        mctx.fillStyle = `hsl(${bot.hue}, 85%, 60%, 0.9)`;
        mctx.beginPath();
        mctx.arc(bx, by, 4, 0, TAU);
        mctx.fill();
        const bossGlow = 0.3 + Math.sin(time * 0.006) * 0.2;
        mctx.strokeStyle = `hsla(${bot.hue}, 85%, 60%, ${bossGlow})`;
        mctx.lineWidth = 1;
        mctx.beginPath();
        mctx.arc(bx, by, 7, 0, TAU);
        mctx.stroke();
      } else {
        mctx.fillStyle = `hsla(${bot.hue}, 80%, 60%, 0.65)`;
        mctx.beginPath();
        mctx.arc(bx, by, 1.8, 0, TAU);
        mctx.fill();
      }
    }

    const px = player.x * scale;
    const py = player.y * scale;
    mctx.fillStyle = "rgba(69, 230, 255, 0.95)";
    mctx.beginPath();
    mctx.arc(px, py, 3, 0, TAU);
    mctx.fill();
    mctx.strokeStyle = "rgba(69, 230, 255, 0.35)";
    mctx.lineWidth = 1;
    const viewW = (width / camera.zoom) * scale * 0.5;
    const viewH = (height / camera.zoom) * scale * 0.5;
    mctx.strokeRect(px - viewW, py - viewH, viewW * 2, viewH * 2);
  }

  function drawCursor() {
    if (state !== "playing" || pointer.type !== "mouse") return;
    ctx.save();
    ctx.translate(pointer.x, pointer.y);
    ctx.strokeStyle = player.phasing ? "rgba(69,230,255,0.72)" : "rgba(191,179,224,0.34)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, player.phasing ? 11 : 7, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(-9, 0);
    ctx.moveTo(15, 0); ctx.lineTo(9, 0);
    ctx.moveTo(0, -15); ctx.lineTo(0, -9);
    ctx.moveTo(0, 15); ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.restore();
  }

  function drawBossTelegraph(bot) {
    if (!bot.boss || !bot.telegraphType || bot.telegraphTimer <= 0 || bot.dead) return;
    if (!visible(bot.x, bot.y, bot.telegraphRadius || 200)) return;
    const point = toScreen(bot.x, bot.y);
    const progress = 1 - (bot.telegraphTimer / bot.telegraphMaxTimer);
    const alpha = 0.25 + progress * 0.5;
    ctx.save();
    if (bot.telegraphType === "radial-burst") {
      const radius = (bot.telegraphRadius || 160) * (0.3 + progress * 0.7) * camera.zoom;
      ctx.strokeStyle = hsl(bot.hue, 95, 65, alpha * 0.8);
      ctx.lineWidth = 2.5 * camera.zoom;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = hsl(bot.hue, 90, 55, alpha * 0.3);
      ctx.lineWidth = 8 * camera.zoom;
      ctx.stroke();
      const tickCount = bot.telegraphProjectiles || 8;
      for (let i = 0; i < tickCount; i++) {
        const angle = (i / tickCount) * TAU + runTime * 0.4;
        const tickX = point.x + Math.cos(angle) * radius;
        const tickY = point.y + Math.sin(angle) * radius;
        ctx.fillStyle = hsl(bot.hue, 100, 75, alpha * 0.9);
        ctx.beginPath();
        ctx.arc(tickX, tickY, 3 * camera.zoom, 0, TAU);
        ctx.fill();
      }
    } else if (bot.telegraphType === "dash") {
      const angle = Math.atan2(player.y - bot.y, player.x - bot.x);
      const dashDist = (bot.telegraphRadius || 200) * camera.zoom;
      const endX = point.x + Math.cos(angle) * dashDist;
      const endY = point.y + Math.sin(angle) * dashDist;
      ctx.strokeStyle = hsl(bot.hue, 95, 65, alpha * 0.7);
      ctx.lineWidth = 4 * camera.zoom;
      ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      const headSize = 12 * camera.zoom;
      ctx.fillStyle = hsl(bot.hue, 100, 70, alpha * 0.85);
      ctx.beginPath();
      ctx.moveTo(endX + Math.cos(angle) * headSize, endY + Math.sin(angle) * headSize);
      ctx.lineTo(endX + Math.cos(angle + 2.4) * headSize * 0.6, endY + Math.sin(angle + 2.4) * headSize * 0.6);
      ctx.lineTo(endX + Math.cos(angle - 2.4) * headSize * 0.6, endY + Math.sin(angle - 2.4) * headSize * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (bot.telegraphType === "area-slam") {
      const radius = (bot.telegraphRadius || 120) * camera.zoom;
      const pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.08;
      ctx.fillStyle = hsl(bot.hue, 85, 45, alpha * 0.15);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * pulse, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = hsl(bot.hue, 95, 60, alpha * 0.75);
      ctx.lineWidth = 2 * camera.zoom;
      ctx.setLineDash([6 * camera.zoom, 4 * camera.zoom]);
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius * pulse, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function render(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const shakeX = screenShake ? random(-screenShake, screenShake) : 0;
    const shakeY = screenShake ? random(-screenShake, screenShake) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground(time);
    drawScars();
    drawMotes(time);
    drawEffects();
    drawBots(time);
    drawPlayer(time);
    ctx.restore();

    if (flashEnabled && flash > 0) {
      ctx.fillStyle = `rgba(118, 63, 190, ${flash * 0.22})`;
      ctx.fillRect(0, 0, width, height);
    }
    drawCursor();
    drawSkillHud();
    drawMinimap(time);
  }

  function frame(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.034);
    previousTime = now;
    update(dt);
    render(now);
    requestAnimationFrame(frame);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, MOBILE_QUALITY ? 1.5 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    pointer.x = clamp(pointer.x, 0, width);
    pointer.y = clamp(pointer.y, 0, height);
  }

  function openPause() {
    if (state !== "playing") return;
    endPhase();
    stopMusic();
    pausedFromState = state;
    state = "paused";
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
    ui.pause.classList.add("is-hidden");
    canvas.focus?.();
  }

  ui.startForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (selectedMode === "multiplayer") connectMultiplayer(ui.roomCode.value);
    else showLoadoutScreen();
  });

  ui.restart.addEventListener("click", () => {
    if (activeMode === "multiplayer") returnToMenu();
    else startSoloGame();
  });

  ui.soloMode.addEventListener("click", () => setSelectedMode("solo"));
  ui.multiplayerMode.addEventListener("click", () => setSelectedMode("multiplayer"));
  ui.createRoom.addEventListener("click", createRoom);
  ui.refreshRooms.addEventListener("click", refreshRooms);
  ui.roomCode.addEventListener("input", () => { ui.roomCode.value = sanitizeRoomCode(ui.roomCode.value); });
  ui.name.addEventListener("change", loadProfile);

  if (ui.workshopButton) ui.workshopButton.addEventListener("click", openWorkshop);
  if (ui.workshopClose) ui.workshopClose.addEventListener("click", closeWorkshop);
  if (ui.skillShopButton) ui.skillShopButton.addEventListener("click", openSkillShop);
  if (ui.skillShopClose) ui.skillShopClose.addEventListener("click", closeSkillShop);
  if (ui.loadoutConfirm) ui.loadoutConfirm.addEventListener("click", () => {
    ui.loadoutScreen.classList.add("is-hidden");
    saveLoadoutToServer();
    showSkinScreen();
  });

  if (ui.minimap) {
    ui.minimap.addEventListener("click", (event) => {
      if (state !== "playing" || activeMode !== "solo") return;
      const rect = ui.minimap.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const scale = WORLD_SIZE / MINIMAP_SIZE;
      const worldX = mx * scale;
      const worldY = my * scale;
      camera.x = clamp(worldX, width / (2 * camera.zoom), WORLD_SIZE - width / (2 * camera.zoom));
      camera.y = clamp(worldY, height / (2 * camera.zoom), WORLD_SIZE - height / (2 * camera.zoom));
    });
  }

  ui.pauseToggle.addEventListener("click", openPause);
  ui.resume.addEventListener("click", closePause);
  ui.returnMenu.addEventListener("click", () => returnToMenu());

  ui.volume.addEventListener("input", () => {
    masterVolume = clamp(Number(ui.volume.value) / 100, 0, 1);
    ui.volumeValue.textContent = `${Math.round(masterVolume * 100)}%`;
    if (masterVolume > 0) muted = false;
    ui.sound.classList.toggle("is-muted", muted);
    saveSettings();
  });
  ui.shakeSetting.addEventListener("change", () => {
    screenShakeEnabled = ui.shakeSetting.checked;
    if (!screenShakeEnabled) screenShake = 0;
    saveSettings();
  });
  ui.flashSetting.addEventListener("change", () => {
    flashEnabled = ui.flashSetting.checked;
    if (!flashEnabled) flash = 0;
    saveSettings();
  });

  ui.sound.addEventListener("click", () => {
    muted = !muted;
    ui.sound.classList.toggle("is-muted", muted);
    ui.sound.setAttribute("aria-label", muted ? "Ativar som" : "Desativar som");
    if (!muted) { initAudio(); sound(440, 0.1, "sine", 0.025); }
    saveSettings();
  });

  canvas.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.type = event.pointerType;
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.type = event.pointerType;
    pointer.active = true;
    pointer.id = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    if (event.pointerType === "mouse") beginPhase();
  });

  function releaseCanvasPointer(event) {
    if (pointer.id !== event.pointerId) return;
    pointer.active = false;
    pointer.id = null;
    if (event.pointerType === "mouse") endPhase();
  }

  canvas.addEventListener("pointerup", releaseCanvasPointer);
  canvas.addEventListener("pointercancel", releaseCanvasPointer);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  ui.mobilePhase.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ui.mobilePhase.setPointerCapture?.(event.pointerId);
    beginPhase();
  });
  ui.mobilePhase.addEventListener("pointerup", (event) => { event.preventDefault(); endPhase(); });
  ui.mobilePhase.addEventListener("pointercancel", endPhase);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape") {
      event.preventDefault();
      if (state === "paused") closePause();
      else openPause();
      return;
    }
    if (event.code === "Space" && !event.repeat) {
      event.preventDefault();
      beginPhase();
    }
    if (event.code === "KeyM") ui.sound.click();
    if (event.code === "Digit1") useSkill(0);
    if (event.code === "Digit2") useSkill(1);
    if (event.code === "Digit3") useSkill(2);
    if (event.code === "Digit4") useSkill(3);
    if (qaMode && activeMode === "solo" && event.code === "KeyU" && state === "playing") {
      player.score = Math.max(player.score, MUTATION_THRESHOLDS[player.nextMutationIndex] || player.score);
      checkMutation();
    }
    if (qaMode && activeMode === "solo" && event.code === "KeyB" && state === "playing") spawnSoloBoss();
    if (qaMode && activeMode === "solo" && event.code === "KeyV" && state === "playing") finishSolo("victory");
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      endPhase();
    }
  });

  window.addEventListener("blur", () => {
    if (state === "playing") endPhase();
  });
  window.addEventListener("resize", resize);
  window.addEventListener("beforeunload", () => multiplayerSocket?.close());

  loadSettings();
  resize();
  resetWorld();
  loadProfile();
  loadChallenges();
  requestAnimationFrame((now) => {
    previousTime = now;
    requestAnimationFrame(frame);
  });

  window.__echoDebug = {
    startSoloGame,
    beginPhase,
    endPhase,
    forceMutation() {
      if (state === "playing") {
        player.score = Math.max(player.score, MUTATION_THRESHOLDS[player.nextMutationIndex] || player.score);
        checkMutation();
      }
    },
    forceBoss: spawnSoloBoss,
    winSolo() { finishSolo("victory"); },
    damage(amount = 15) { damagePlayer(amount, player.x - 50, player.y); },
    getState() {
      return {
        state,
        player: {
          x: Math.round(player.x),
          y: Math.round(player.y),
          health: Math.round(player.health),
          energy: Math.round(player.energy),
          score: Math.floor(player.score),
          kills: player.kills,
          phasing: player.phasing,
          mutations: [...(player.mutations || [])]
        },
        mode: activeMode,
        roomCode: multiplayerRoomCode,
        counts: { bots: bots.filter((bot) => !bot.dead).length, motes: motes.length, particles: particles.length }
      };
    }
  };
}());
