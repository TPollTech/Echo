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
    skillPointsEarned: document.querySelector("#skillpoints-earned"),
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
    mutationLoadoutButton: document.querySelector("#mutation-loadout-button"),
    loadoutScreen: document.querySelector("#loadout-screen"),
    loadoutSlots: document.querySelector("#loadout-slots"),
    loadoutAvailable: document.querySelector("#loadout-available"),
    loadoutConfirm: document.querySelector("#loadout-confirm"),
    trainingMode: document.querySelector("#training-mode"),
    classGrid: document.querySelector("#class-grid"),
    classDetail: document.querySelector("#class-detail"),
    randomClass: document.querySelector("#random-class"),
    prepSkinGrid: document.querySelector("#prep-skin-grid"),
    prepAbilityGrid: document.querySelector("#prep-ability-grid"),
    abilityCount: document.querySelector("#ability-count"),
    difficulty: document.querySelector("#difficulty-select"),
    modifier: document.querySelector("#modifier-select"),
    classProgressGrid: document.querySelector("#class-progress-grid"),
    challengeProgressGrid: document.querySelector("#challenge-progress-grid"),
    preview: document.querySelector("#character-preview"),
    summaryClass: document.querySelector("#summary-class"),
    summarySkin: document.querySelector("#summary-skin"),
    summaryAbilities: document.querySelector("#summary-abilities"),
    summaryMode: document.querySelector("#summary-mode"),
    summaryDifficulty: document.querySelector("#summary-difficulty"),
    classSpecialButton: document.querySelector("#class-special-button"),
    fullscreenButton: document.querySelector("#fullscreen-button"),
    hudClassName: document.querySelector("#hud-class-name"),
    hudClassLevel: document.querySelector("#hud-class-level"),
    hudResourceName: document.querySelector("#hud-resource-name"),
    hudResourceValue: document.querySelector("#hud-resource-value"),
    hudResourceFill: document.querySelector("#hud-resource-fill"),
    hudClassSpecial: document.querySelector("#hud-class-special"),
    joystickZone: document.querySelector("#joystick-zone"),
    joystickBase: document.querySelector("#joystick-base"),
    joystickKnob: document.querySelector("#joystick-knob"),
    mobileSkillButtons: document.querySelector("#mobile-skill-buttons"),
    mobileScoreValue: document.querySelector("#mobile-score-value"),
    mobileKillsValue: document.querySelector("#mobile-kills-value"),
    mobileTimeValue: document.querySelector("#mobile-time-value")
  };

  const MOTE_COUNT = 330;
  const BOT_COUNT = 10;
  const MUTATION_THRESHOLDS = [45, 160, 360, 650];
  const SOLO_BOSS_TIME = 280;
  const SETTINGS_KEY = "echo.settings";
  const qaMode = new URLSearchParams(window.location.search).has("qa");
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  const MOBILE_QUALITY = isMobile;
  const moteCount = MOBILE_QUALITY ? 80 : 330;
  const ambientSeedCount = MOBILE_QUALITY ? 35 : 180;
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
  const skins = globalThis.EchoSkinSystem.SKIN_DEFINITIONS.map((definition) => ({
    ...definition,
    unlocked: () => definition.unlock === "always"
      || (definition.unlock === "boss" && skinProgress.bossesDefeated >= 1)
      || (definition.unlock === "score-500" && skinProgress.bestScore >= 500)
  }));

  const EchoClassSystem = (() => {
    "use strict";

    const CLASS_IDS = Object.freeze([
      "cutter", "marksman", "charger", "trapper", "defender",
      "assassin", "controller", "summoner", "orbiter", "loader"
    ]);

    const makeClass = (definition) => Object.freeze({
      ...definition,
      resource: Object.freeze({ ...definition.resource }),
      attributes: Object.freeze({ ...definition.attributes }),
      growth: Object.freeze({ ...definition.growth }),
      strengths: Object.freeze([...definition.strengths]),
      weaknesses: Object.freeze([...definition.weaknesses])
    });

    const classRegistry = Object.freeze({
      cutter: makeClass({
        id: "cutter", name: "CORTADOR", icon: "⌁", role: "melee", difficulty: 2,
        summary: "Transforma uma trajetória arriscada em um corte de retorno.",
        primaryAttack: "Corte de retorno", activeAbility: "Segundo corte", passiveAbility: "Risco calculado",
        resource: { id: "echo", name: "ECO", max: 100, color: "#45e6ff" },
        attributes: { health: 100, speed: 205, resistance: 1, preferredRange: 250, mobility: 5 },
        growth: { trailWidth: 0.08, range: 0.06, damage: 0.08, resourceEfficiency: 0.05 },
        aiBehavior: "cutter", sound: 176, strengths: ["trajetória", "mobilidade"], weaknesses: ["corpo vulnerável"]
      }),
      marksman: makeClass({
        id: "marksman", name: "ATIRADOR", icon: "◎", role: "long-range", difficulty: 3,
        summary: "Carrega disparos precisos e ganha dano com a distância.",
        primaryAttack: "Disparo carregado", activeAbility: "Disparo perfurante", passiveAbility: "Longa distância",
        resource: { id: "focus", name: "FOCO", max: 100, color: "#72f1ff" },
        attributes: { health: 85, speed: 185, resistance: 0.9, preferredRange: 620, mobility: 2 },
        growth: { chargeSpeed: 0.08, projectileSize: 0.07, range: 0.08, pierce: 0.25 },
        aiBehavior: "marksman", sound: 520, strengths: ["longo alcance", "alto dano"], weaknesses: ["combate próximo", "mira lenta"]
      }),
      charger: makeClass({
        id: "charger", name: "INVESTIDOR", icon: "➤", role: "melee", difficulty: 2,
        summary: "Investe fisicamente, empurra alvos e explode ao parar.",
        primaryAttack: "Investida", activeAbility: "Impacto circular", passiveAbility: "Armadura cinética",
        resource: { id: "momentum", name: "IMPULSO", max: 100, color: "#ff725e" },
        attributes: { health: 120, speed: 195, resistance: 0.78, preferredRange: 145, mobility: 5 },
        growth: { dashRange: 0.08, impact: 0.08, explosion: 0.07, resistance: 0.03 },
        aiBehavior: "charger", sound: 92, strengths: ["impacto", "interrupção"], weaknesses: ["erros de alinhamento"]
      }),
      trapper: makeClass({
        id: "trapper", name: "ARMADILHEIRO", icon: "⌗", role: "control", difficulty: 3,
        summary: "Fecha rotas com armadilhas e fragmentos de médio alcance.",
        primaryAttack: "Fragmento", activeAbility: "Armadilha lenta", passiveAbility: "Rede territorial",
        resource: { id: "devices", name: "DISPOSITIVOS", max: 4, color: "#b792ff" },
        attributes: { health: 92, speed: 198, resistance: 0.96, preferredRange: 380, mobility: 3 },
        growth: { traps: 0.34, area: 0.06, duration: 0.08, damage: 0.06 },
        aiBehavior: "trapper", sound: 262, strengths: ["controle de área", "preparação"], weaknesses: ["duelo direto"]
      }),
      defender: makeClass({
        id: "defender", name: "DEFENSOR", icon: "◇", role: "defense", difficulty: 2,
        summary: "Bloqueia pela frente e converte defesa em contra-ataque.",
        primaryAttack: "Golpe de energia", activeAbility: "Escudo direcional", passiveAbility: "Contra-carga",
        resource: { id: "guard", name: "GUARDA", max: 100, color: "#a88cff" },
        attributes: { health: 135, speed: 170, resistance: 0.72, preferredRange: 125, mobility: 1 },
        growth: { shieldArc: 0.05, duration: 0.06, block: 0.03, counter: 0.09 },
        aiBehavior: "defender", sound: 330, strengths: ["bloqueio", "resistência"], weaknesses: ["flancos", "baixo alcance"]
      }),
      assassin: makeClass({
        id: "assassin", name: "ASSASSINO", icon: "◈", role: "melee", difficulty: 4,
        summary: "Some do campo, teleporta e executa alvos feridos.",
        primaryAttack: "Golpe rápido", activeAbility: "Invisibilidade", passiveAbility: "Emboscada",
        resource: { id: "shadow", name: "SOMBRA", max: 100, color: "#ef74ff" },
        attributes: { health: 72, speed: 235, resistance: 1.12, preferredRange: 95, mobility: 5 },
        growth: { stealth: 0.08, teleport: 0.07, ambush: 0.1, cooldown: 0.05 },
        aiBehavior: "assassin", sound: 660, strengths: ["emboscada", "execução"], weaknesses: ["pouca vida", "combate longo"]
      }),
      controller: makeClass({
        id: "controller", name: "CONTROLADOR", icon: "⊛", role: "control", difficulty: 3,
        summary: "Agrupa inimigos e recursos em campos gravitacionais.",
        primaryAttack: "Pulso", activeAbility: "Campo gravitacional", passiveAbility: "Coleta ampliada",
        resource: { id: "gravity", name: "GRAVIDADE", max: 100, color: "#5ce0d2" },
        attributes: { health: 95, speed: 190, resistance: 0.94, preferredRange: 330, mobility: 2 },
        growth: { area: 0.08, pull: 0.08, duration: 0.07, pickup: 0.08 },
        aiBehavior: "controller", sound: 220, strengths: ["agrupamento", "combinações"], weaknesses: ["dano direto"]
      }),
      summoner: makeClass({
        id: "summoner", name: "INVOCADOR", icon: "✣", role: "control", difficulty: 4,
        summary: "Comanda unidades auxiliares e pressiona à distância.",
        primaryAttack: "Enviar unidade", activeAbility: "Comando de enxame", passiveAbility: "Nova unidade",
        resource: { id: "swarm", name: "UNIDADES", max: 6, color: "#78ffba" },
        attributes: { health: 82, speed: 188, resistance: 1.02, preferredRange: 500, mobility: 2 },
        growth: { units: 0.34, unitDamage: 0.08, unitSpeed: 0.07, autoCollect: 0.2 },
        aiBehavior: "summoner", sound: 392, strengths: ["pressão constante", "combate indireto"], weaknesses: ["unidades destrutíveis"]
      }),
      orbiter: makeClass({
        id: "orbiter", name: "ORBITADOR", icon: "⊙", role: "long-range", difficulty: 3,
        summary: "Administra esferas que atacam e interceptam ameaças.",
        primaryAttack: "Lançar esfera", activeAbility: "Órbita total", passiveAbility: "Bloqueio orbital",
        resource: { id: "orbs", name: "ESFERAS", max: 5, color: "#ffd86b" },
        attributes: { health: 96, speed: 195, resistance: 0.92, preferredRange: 420, mobility: 3 },
        growth: { orbs: 0.25, size: 0.06, orbitSpeed: 0.08, recovery: 0.06 },
        aiBehavior: "orbiter", sound: 440, strengths: ["ataque e defesa", "médio alcance"], weaknesses: ["recarga das esferas"]
      }),
      loader: makeClass({
        id: "loader", name: "CARREGADOR", icon: "◆", role: "long-range", difficulty: 4,
        summary: "Transforma fragmentos azuis e roxos em munição.",
        primaryAttack: "Disparo de fragmento", activeAbility: "Explosão armazenada", passiveAbility: "Munição por cor",
        resource: { id: "ammo", name: "MUNIÇÃO", max: 12, color: "#45e6ff" },
        attributes: { health: 100, speed: 192, resistance: 0.95, preferredRange: 460, mobility: 3 },
        growth: { capacity: 0.08, damage: 0.08, efficiency: 0.05, explosion: 0.08 },
        aiBehavior: "loader", sound: 294, strengths: ["economia de recursos", "explosão"], weaknesses: ["depende de fragmentos"]
      })
    });

    const EQUIPPABLE_SKILLS = Object.freeze([
      { id: "shield", name: "ESCUDO", symbol: "◇", color: "#a88cff", effect: "Bloqueia um ataque recebido por até 3 segundos.", cost: 30, cooldown: 8, compatibleClasses: CLASS_IDS },
      { id: "explosion", name: "EXPLOSÃO", symbol: "✦", color: "#ff4fd8", effect: "Causa 18 de dano e empurra inimigos em um raio de 130.", cost: 25, cooldown: 5, compatibleClasses: CLASS_IDS },
      { id: "heal", name: "CURA", symbol: "+", color: "#78ffba", effect: "Recupera 34 de vida do jogador imediatamente.", cost: 28, cooldown: 12, compatibleClasses: ["cutter", "trapper", "defender", "controller", "summoner", "orbiter", "loader"] },
      { id: "pull", name: "ÍMÃ DE FRAGMENTOS", symbol: "⊛", color: "#b792ff", effect: "Puxa fragmentos em um raio de 350 para perto do jogador.", cost: 24, cooldown: 8, compatibleClasses: ["cutter", "trapper", "controller", "summoner", "orbiter"] },
      { id: "teleport", name: "TELEPORTE", symbol: "⟿", color: "#45e6ff", effect: "Teleporta 160 de distância na direção da mira.", cost: 20, cooldown: 4, compatibleClasses: ["cutter", "marksman", "assassin", "controller", "loader"] },
      { id: "triple-shot", name: "TIRO TRIPLO", symbol: "⋔", color: "#45e6ff", effect: "Dispara 3 projéteis em leque; cada um causa 15 de dano.", cost: 26, cooldown: 7, compatibleClasses: ["marksman", "trapper", "orbiter", "loader"] },
      { id: "slow-trap", name: "ARMADILHA DE LENTIDÃO", symbol: "⌗", color: "#8b5cf6", effect: "Cria por 4 segundos uma área de 115 que desacelera e causa 3 de dano por acerto.", cost: 22, cooldown: 9, compatibleClasses: ["trapper", "defender", "controller"] },
      { id: "damage-field", name: "ÁREA DE DANO", symbol: "◉", color: "#ff725e", effect: "Cria ao redor do jogador uma área de 125 que causa 5 de dano por acerto durante 4 segundos.", cost: 34, cooldown: 11, compatibleClasses: ["charger", "trapper", "controller", "summoner", "orbiter"] },
      { id: "invisibility", name: "INVULNERABILIDADE", symbol: "◈", color: "#78ffba", effect: "Impede todo dano recebido durante 2 segundos.", cost: 32, cooldown: 12, compatibleClasses: ["cutter", "marksman", "assassin"] },
      { id: "charge", name: "INVESTIDA", symbol: "➤", color: "#ff8a65", effect: "Avança 180 na direção da mira e causa 24 de dano aos inimigos no caminho.", cost: 28, cooldown: 7, compatibleClasses: ["cutter", "charger", "defender", "assassin"] }
    ].map((skill) => Object.freeze({ ...skill, compatibleClasses: Object.freeze([...skill.compatibleClasses]) })));

    const MUTATION_CLASS_COMPATIBILITY = Object.freeze({
      blade: ["cutter", "charger", "assassin"], shell: ["cutter", "defender", "orbiter"], siphon: CLASS_IDS,
      drift: ["cutter", "marksman", "charger", "assassin", "controller"], nova: ["cutter", "charger", "defender", "controller", "loader"],
      reweave: CLASS_IDS, focus: CLASS_IDS, gravity: ["cutter", "trapper", "controller", "summoner", "loader"], resonance: CLASS_IDS,
      afterimage: ["cutter", "assassin", "controller"], overclock: ["cutter", "marksman", "charger", "assassin", "orbiter", "loader"],
      prism: CLASS_IDS, chain: CLASS_IDS, ghostwall: CLASS_IDS, vortex: ["cutter", "controller", "summoner"],
      reversal: ["defender", "controller", "orbiter"], dualphase: ["cutter", "charger", "assassin"]
    });

    const CLASS_LIMITS = Object.freeze({ marksman: 2, defender: 2, assassin: 1 });
    const CLASS_CHALLENGES = Object.freeze({
      cutter: Object.freeze({ label: "Elimine 30 inimigos com o Cortador.", metric: "kills", target: 30, resonance: 20, skillPoints: 8 }),
      marksman: Object.freeze({ label: "Elimine 25 inimigos com o Atirador.", metric: "kills", target: 25, resonance: 20, skillPoints: 8 }),
      charger: Object.freeze({ label: "Elimine 35 inimigos com o Investidor.", metric: "kills", target: 35, resonance: 22, skillPoints: 8 }),
      trapper: Object.freeze({ label: "Conclua 5 partidas com o Armadilheiro.", metric: "runs", target: 5, resonance: 18, skillPoints: 10 }),
      defender: Object.freeze({ label: "Vença 3 partidas com o Defensor.", metric: "victories", target: 3, resonance: 25, skillPoints: 10 }),
      assassin: Object.freeze({ label: "Elimine 40 inimigos com o Assassino.", metric: "kills", target: 40, resonance: 24, skillPoints: 9 }),
      controller: Object.freeze({ label: "Conclua 8 partidas com o Controlador.", metric: "runs", target: 8, resonance: 22, skillPoints: 10 }),
      summoner: Object.freeze({ label: "Elimine 30 inimigos com o Invocador.", metric: "kills", target: 30, resonance: 22, skillPoints: 10 }),
      orbiter: Object.freeze({ label: "Vença 4 partidas com o Orbitador.", metric: "victories", target: 4, resonance: 25, skillPoints: 10 }),
      loader: Object.freeze({ label: "Conclua 10 partidas com o Carregador.", metric: "runs", target: 10, resonance: 24, skillPoints: 12 })
    });
    const roleOf = (classId) => classRegistry[classId]?.role || "melee";
    const normalizeClassId = (classId) => CLASS_IDS.includes(classId) ? classId : "cutter";
    const getClassDefinition = (classId) => classRegistry[normalizeClassId(classId)];
    const getClassLevel = (experience) => Math.max(1, Math.min(12, Math.floor(Math.sqrt(Math.max(0, Number(experience) || 0) / 28)) + 1));
    const classExperienceForLevel = (level) => Math.max(0, Math.pow(Math.max(1, level) - 1, 2) * 28);
    const getClassEvolution = (classId, level) => {
      const definition = getClassDefinition(classId);
      const steps = Math.max(0, Math.min(11, Math.floor(level) - 1));
      return Object.fromEntries(Object.entries(definition.growth).map(([key, amount]) => [key, 1 + amount * steps]));
    };

    function createBalancedBotClassComposition({ botCount, playerClass = "cutter", randomFn = Math.random } = {}) {
      const count = Math.max(0, Math.floor(Number(botCount) || 0));
      const selected = [];
      const counts = Object.fromEntries(CLASS_IDS.map((id) => [id, id === normalizeClassId(playerClass) ? 1 : 0]));
      const requiredRoles = ["melee", "long-range", "control"];
      for (let index = 0; index < count; index += 1) {
        const missingRole = requiredRoles.find((role) => !selected.some((id) => roleOf(id) === role));
        const candidates = CLASS_IDS.filter((id) => {
          const limit = CLASS_LIMITS[id] ?? 2;
          return counts[id] < limit && (!missingRole || roleOf(id) === missingRole);
        });
        const pool = candidates.length ? candidates : CLASS_IDS.filter((id) => counts[id] < (CLASS_LIMITS[id] ?? 2));
        const lowest = Math.min(...pool.map((id) => counts[id]));
        const leastUsed = pool.filter((id) => counts[id] === lowest);
        const picked = leastUsed[Math.min(leastUsed.length - 1, Math.floor(randomFn() * leastUsed.length))] || "cutter";
        selected.push(picked);
        counts[picked] += 1;
      }
      return selected;
    }

    function compatibleSkills(classId) {
      const normalized = normalizeClassId(classId);
      return EQUIPPABLE_SKILLS.filter((skill) => skill.compatibleClasses.includes(normalized));
    }

    function chooseRandomClass(randomFn = Math.random) {
      const index = Math.min(CLASS_IDS.length - 1, Math.floor(clampUnit(randomFn()) * CLASS_IDS.length));
      return CLASS_IDS[index];
    }

    function clampUnit(value) {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(0, Math.min(0.999999, number)) : 0;
    }

    function sanitizeSkillLoadout(classId, requested = []) {
      const allowed = new Set(compatibleSkills(classId).map((skill) => skill.id));
      const unique = [...new Set(Array.isArray(requested) ? requested : [])].filter((id) => allowed.has(id)).slice(0, 4);
      for (const skill of compatibleSkills(classId)) {
        if (unique.length >= 4) break;
        if (!unique.includes(skill.id)) unique.push(skill.id);
      }
      return unique;
    }

    const classAiRegistry = Object.freeze({
      cutter: ({ distance, danger = 0 }) => ({ action: danger > 0.8 ? "retreat" : "cross", idealRange: 230 }),
      marksman: ({ distance, danger = 0 }) => ({ action: distance < 280 || danger > 0.65 ? "retreat" : "charge", idealRange: 620 }),
      charger: ({ distance, alignment = 0 }) => ({ action: distance < 420 && alignment > 0.72 ? "charge" : "align", idealRange: 135 }),
      trapper: ({ contested = 0, traps = 0 }) => ({ action: contested > 0.45 && traps < 4 ? "trap" : "kite", idealRange: 380 }),
      defender: ({ frontalThreat = 0, allyDanger = 0 }) => ({ action: frontalThreat > 0.35 || allyDanger > 0.7 ? "block" : "advance", idealRange: 125 }),
      assassin: ({ targetHealth = 1, isolated = 0 }) => ({ action: targetHealth < 0.42 && isolated > 0.5 ? "ambush" : "stalk", idealRange: 90 }),
      controller: ({ danger = 0, clustered = 0 }) => ({ action: clustered > 0.45 && danger < 0.78 ? "pull" : "reposition", idealRange: 330 }),
      summoner: ({ units = 0, distance = 0 }) => ({ action: units > 0 && distance < 600 ? "command" : "summon", idealRange: 520 }),
      orbiter: ({ orbs = 0, danger = 0 }) => ({ action: orbs <= 1 || danger > 0.7 ? "preserve" : "launch", idealRange: 420 }),
      loader: ({ ammo = 0, surrounded = 0 }) => ({ action: surrounded > 0.65 && ammo > 2 ? "explode" : ammo < 3 ? "collect" : "shoot", idealRange: 460 })
    });

    function decideClassAi(classId, context = {}) {
      return (classAiRegistry[normalizeClassId(classId)] || classAiRegistry.cutter)(context);
    }

    return Object.freeze({
      CLASS_IDS, classRegistry, EQUIPPABLE_SKILLS, MUTATION_CLASS_COMPATIBILITY, CLASS_LIMITS, CLASS_CHALLENGES,
      normalizeClassId, getClassDefinition, getClassLevel, classExperienceForLevel, getClassEvolution,
      createBalancedBotClassComposition, compatibleSkills, sanitizeSkillLoadout, chooseRandomClass, classAiRegistry, decideClassAi
    });
  })();

  const {
    CLASS_IDS, classRegistry, EQUIPPABLE_SKILLS, MUTATION_CLASS_COMPATIBILITY, CLASS_CHALLENGES,
    normalizeClassId, getClassDefinition, getClassLevel, classExperienceForLevel, getClassEvolution,
    createBalancedBotClassComposition, compatibleSkills, sanitizeSkillLoadout, chooseRandomClass, decideClassAi
  } = EchoClassSystem;

  if (typeof module !== "undefined" && module.exports) module.exports = EchoClassSystem;
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

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let state = "intro";
  let previousTime = performance.now();
  let runTime = 0;
  let screenShake = 0;
  let flash = 0;
  const PERFORMANCE_PROFILE = Object.freeze({
    activeMinimumFrameMs: MOBILE_QUALITY ? 12 : 10,
    idleMinimumFrameMs: 28,
    hudInterval: MOBILE_QUALITY ? 1 / 15 : 1 / 30,
    slowFrameMs: MOBILE_QUALITY ? 18 : 21.5,
    recoveryFrameMs: MOBILE_QUALITY ? 14 : 17.2,
    scaleCooldownMs: MOBILE_QUALITY ? 2000 : 4200,
    slowSamplesBeforeScale: MOBILE_QUALITY ? 8 : 36,
    fastSamplesBeforeScale: MOBILE_QUALITY ? 80 : 300
  });

  const nativeRenderDpr = Math.min(window.devicePixelRatio || 1, MOBILE_QUALITY ? 1.5 : 2);
  const renderPerformance = {
    averageFrameMs: 1000 / 60,
    averageWorkMs: 0,
    dprCap: nativeRenderDpr,
    minimumDpr: Math.min(nativeRenderDpr, MOBILE_QUALITY ? 0.6 : 1.25),
    maximumDpr: nativeRenderDpr,
    slowSamples: 0,
    fastSamples: 0,
    lastScaleChange: 0,
    scaleChanges: 0
  };

  let hudUpdateTimer = 0;
  let musicUpdateTimer = 0;

  function targetRenderDpr() {
    const manualScale = clamp(Number(preparation?.settings?.renderScale ?? 100) / 100, 0.55, 1);
    return Math.max(0.5, Math.min(window.devicePixelRatio || 1, renderPerformance.dprCap) * manualScale);
  }

  function updateAdaptiveResolution(frameMs, workMs, now) {
    if (state !== "playing" || document.hidden || preparation?.settings?.autoQuality === false) return;
    renderPerformance.averageFrameMs = lerp(renderPerformance.averageFrameMs, frameMs, 0.06);
    renderPerformance.averageWorkMs = lerp(renderPerformance.averageWorkMs, workMs, 0.08);
    if (now - renderPerformance.lastScaleChange < PERFORMANCE_PROFILE.scaleCooldownMs) return;

    const overloaded = renderPerformance.averageFrameMs > PERFORMANCE_PROFILE.slowFrameMs
      || renderPerformance.averageWorkMs > 15.5;
    const comfortable = renderPerformance.averageFrameMs < PERFORMANCE_PROFILE.recoveryFrameMs
      && renderPerformance.averageWorkMs < 10.5;

    if (overloaded) {
      renderPerformance.slowSamples += 1;
      renderPerformance.fastSamples = 0;
    } else if (comfortable) {
      renderPerformance.fastSamples += 1;
      renderPerformance.slowSamples = Math.max(0, renderPerformance.slowSamples - 2);
    } else {
      renderPerformance.slowSamples = Math.max(0, renderPerformance.slowSamples - 1);
      renderPerformance.fastSamples = Math.max(0, renderPerformance.fastSamples - 1);
    }

    if (renderPerformance.slowSamples >= PERFORMANCE_PROFILE.slowSamplesBeforeScale
      && renderPerformance.dprCap > renderPerformance.minimumDpr) {
      renderPerformance.dprCap = Math.max(renderPerformance.minimumDpr, renderPerformance.dprCap - (MOBILE_QUALITY ? 0.35 : 0.25));
      renderPerformance.slowSamples = 0;
      renderPerformance.fastSamples = 0;
      renderPerformance.lastScaleChange = now;
      renderPerformance.scaleChanges += 1;
      resize(true);
    } else if (renderPerformance.fastSamples >= PERFORMANCE_PROFILE.fastSamplesBeforeScale
      && renderPerformance.dprCap < renderPerformance.maximumDpr) {
      renderPerformance.dprCap = Math.min(renderPerformance.maximumDpr, renderPerformance.dprCap + 0.125);
      renderPerformance.slowSamples = 0;
      renderPerformance.fastSamples = 0;
      renderPerformance.lastScaleChange = now;
      renderPerformance.scaleChanges += 1;
      resize(true);
    }
  }

  let audioContext = null;
  let muted = false;
  let masterVolume = 0.7;
  let musicVolume = 0.7;
  let sfxVolume = 0.8;
  let interfaceVolume = 0.7;
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
  let multiplayerHasInitialSnapshot = false;
  let multiplayerMoteRevision = 0;
  let networkInputSequence = 0;
  let networkPingTimer = 0;
  let networkPingMs = 0;
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
    { id: "kill20", name: "PRIMEIRAS ELIMINAÇÕES", description: "Elimine 20 inimigos em uma partida", goal: 20, stat: "kills", reward: 25 },
    { id: "kill50", name: "50 ELIMINAÇÕES", description: "Elimine 50 inimigos em uma partida", goal: 50, stat: "kills", reward: 60 },
    { id: "score1500", name: "COLETOR", description: "Alcance 1500 pontos em uma partida", goal: 1500, stat: "score", reward: 30 },
    { id: "score5000", name: "PONTUAÇÃO ALTA", description: "Alcance 5000 pontos em uma partida", goal: 5000, stat: "score", reward: 80 },
    { id: "combo10", name: "FLUXO CONTÍNUO", description: "Atinja combo x10", goal: 10, stat: "maxCombo", reward: 20 },
    { id: "combo20", name: "COMBO INDOMÁVEL", description: "Atinja combo x20", goal: 20, stat: "maxCombo", reward: 50 },
    { id: "bossKill", name: "CHEFE DERROTADO", description: "Derrote o chefe da partida", goal: 1, stat: "bossDefeated", reward: 40 },
    { id: "bossSpeed", name: "VITÓRIA RÁPIDA", description: "Derrote o chefe em menos de 90 segundos", goal: 1, stat: "bossSpeedKill", reward: 70 },
    { id: "time5", name: "SOBREVIVENTE", description: "Sobreviva 5 minutos", goal: 300, stat: "runTime", reward: 30 },
    { id: "time10", name: "RESISTÊNCIA", description: "Sobreviva 10 minutos", goal: 600, stat: "runTime", reward: 65 },
    { id: "redMote5", name: "FRAGMENTOS VERMELHOS", description: "Colete 5 fragmentos vermelhos em uma partida", goal: 5, stat: "redMotes", reward: 20 },
    { id: "noHitBoss", name: "SEM DANO", description: "Derrote o chefe sem receber dano na fase final", goal: 1, stat: "noHitBoss", reward: 100 }
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
        showToast(`DESAFIO CONCLUÍDO: ${ch.name} (+${ch.reward} CRÉDITOS)`, 2800);
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
    { id: "glass-cannon", name: "ATAQUE ARRISCADO", description: "Causa 50% mais dano, mas reduz a vida máxima em 30%.", symbol: "◇", color: "#ff4fd8", bonusResonance: 15, apply(p) { p.trailDamage *= 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.7); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "vampiric", name: "CURA POR ELIMINAÇÃO", description: "Dobra a vida recuperada ao eliminar um inimigo.", symbol: "♦", color: "#ff557a", bonusResonance: 10, apply(p) { p.killRestoreHealBonus = (p.killRestoreHealBonus || 1) * 2; } },
    { id: "glass-boot", name: "PROJEÇÃO EFICIENTE", description: "Move 30% mais rápido na projeção e gasta 20% menos energia.", symbol: "△", color: "#45e6ff", bonusResonance: 10, apply(p) { p.phaseSpeed *= 1.3; p.phaseDrain *= 0.8; } },
    { id: "magnetic", name: "COLETA AMPLIADA", description: "Dobra a distância usada para atrair e coletar fragmentos.", symbol: "◎", color: "#78ffba", bonusResonance: 12, apply(p) { p.pickupRadius *= 2; } },
    { id: "fortified", name: "MAIS RESISTÊNCIA", description: "Aumenta a vida máxima em 40%, mas reduz o dano em 20%.", symbol: "□", color: "#a88cff", bonusResonance: 12, apply(p) { p.maxHealth = Math.floor(p.maxHealth * 1.4); p.health = p.maxHealth; p.trailDamage *= 0.8; } },
    { id: "overclocked", name: "RECARGA RÁPIDA", description: "Reduz o tempo de recarga em 40%, mas aumenta o gasto de energia em 30%.", symbol: "⚡", color: "#ffe066", bonusResonance: 15, apply(p) { p.cooldownScale *= 0.6; p.phaseDrain *= 1.3; } },
    { id: "risk-reward", name: "MAIS PONTOS", description: "Aumenta os pontos recebidos em 50%, mas reduz a vida máxima em 20%.", symbol: "⬡", color: "#5ce0d2", bonusResonance: 20, apply(p) { p.scoreMultiplier = 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.8); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "glass-trail", name: "RASTRO FORTE", description: "Dobra o dano do rastro, mas reduz sua duração em 40%.", symbol: "⟋", color: "#c8b8ff", bonusResonance: 18, apply(p) { p.trailDamage *= 2; p.ribbonLife *= 0.6; p.trailLinger *= 0.6; } },
    { id: "berserker", name: "ÚLTIMO ESFORÇO", description: "Causa 30% mais dano enquanto estiver abaixo de 50% de vida.", symbol: "☣", color: "#ff8c42", bonusResonance: 12, apply(p) { p.berserkerBonus = 1.3; } }
  ];

  function applyModifiers() {
    for (const mod of runModifiers) {
      mod.apply(player);
    }
  }

  let classProjectiles = [];
  let classTraps = [];
  let classFields = [];
  let classMinions = [];
  let classDamageNumbers = [];
  let selectedClassId = normalizeClassId(localStorage.getItem("echo.class") || "cutter");
  let classSpecialCooldown = 0;
  let lastClassLevel = 1;

  function applyEntityClass(entity, classId, preserveHealthRatio = false) {
    const definition = getClassDefinition(classId);
    const oldMaxHealth = entity.maxHealth || definition.attributes.health;
    const healthRatio = preserveHealthRatio ? clamp((entity.health || oldMaxHealth) / oldMaxHealth, 0, 1) : 1;
    const isPlayerEntity = entity.id === "player";
    const upgradeHealth = isPlayerEntity ? playerUpgrades.core * 5 : 0;
    const upgradeEnergy = isPlayerEntity ? playerUpgrades.charge * 10 : 0;
    entity.classId = definition.id;
    entity.className = definition.name;
    entity.classDefinition = definition;
    entity.roleLabel = entity.boss ? entity.roleLabel : definition.name;
    entity.maxHealth = definition.attributes.health + upgradeHealth;
    entity.health = entity.maxHealth * healthRatio;
    entity.maxEnergy = 100 + upgradeEnergy;
    entity.energy = clamp(entity.energy ?? entity.maxEnergy, 0, entity.maxEnergy);
    entity.moveSpeed = definition.attributes.speed;
    entity.damageTakenScale = definition.attributes.resistance;
    entity.preferredRange = definition.attributes.preferredRange;
    entity.classResource = definition.resource.max;
    entity.classResourceMax = definition.resource.max;
    entity.classResourceName = definition.resource.name;
    entity.classExperience = Math.max(0, entity.classExperience || 0);
    entity.classLevel = getClassLevel(entity.classExperience);
    entity.classCooldown = 0;
    entity.classActionTimer = 0;
    entity.classCharge = 0;
    entity.classCharging = false;
    entity.classShieldTimer = 0;
    entity.classShieldAngle = 0;
    entity.classCounterCharge = 0;
    entity.classStealthTimer = 0;
    entity.classAmbushReady = false;
    entity.classDashHitIds = new Set();
    entity.classOrbTimer = 0;
    return entity;
  }

  function resetClassCombat() {
    classProjectiles = [];
    classTraps = [];
    classFields = [];
    classMinions = [];
    classDamageNumbers = [];
    classSpecialCooldown = 0;
    lastClassLevel = 1;
    applyEntityClass(player, selectedClassId);
    lastClassLevel = player.classLevel;
  }

  function targetAngle(entity = player) {
    const target = entity === player ? worldTarget() : { x: entity.targetX, y: entity.targetY };
    const directAngle = Math.atan2(target.y - entity.y, target.x - entity.x);
    if (entity !== player || activeMode === "multiplayer") return directAngle;
    const assist = clamp(Number(preparation?.settings?.aimAssist || 0) / 100, 0, 1);
    if (assist <= 0) return directAngle;
    let best = null;
    let bestScore = Infinity;
    for (const bot of bots) {
      if (bot.dead) continue;
      const angle = Math.atan2(bot.y - player.y, bot.x - player.x);
      const delta = Math.abs(Math.atan2(Math.sin(angle - directAngle), Math.cos(angle - directAngle)));
      const distance = Math.hypot(bot.x - player.x, bot.y - player.y);
      const score = delta * 680 + distance * 0.12;
      if (delta < 0.3 && score < bestScore) { best = angle; bestScore = score; }
    }
    return best == null ? directAngle : directAngle + Math.atan2(Math.sin(best - directAngle), Math.cos(best - directAngle)) * assist * 0.7;
  }

  function classDamageTarget(target, amount, owner, sourceX, sourceY, knockback = 150) {
    if (!target || target.dead) return false;
    if (target === player) {
      const before = player.health;
      damagePlayer(amount, sourceX, sourceY);
      return player.health < before;
    }
    const before = target.health;
    damageBot(target, amount, owner, sourceX, sourceY);
    if (target.health < before && knockback > 0) {
      const dx = target.x - sourceX;
      const dy = target.y - sourceY;
      const distance = Math.hypot(dx, dy) || 1;
      target.vx += (dx / distance) * knockback;
      target.vy += (dy / distance) * knockback;
    }
    return target.health < before;
  }

  function spawnDamageNumber(x, y, amount, hue = 188) {
    if (!preparation?.settings?.showDamage) return;
    classDamageNumbers.push({ x, y, amount: Math.max(1, Math.round(amount)), hue, life: 0.72, maxLife: 0.72 });
    if (classDamageNumbers.length > 24) classDamageNumbers.shift();
  }

  function damageInRadius(owner, x, y, radius, damage, knockback = 220) {
    let hits = 0;
    const targets = owner === player ? bots : [player];
    for (const target of targets) {
      if (!target || target.dead || target.respawnTimer > 0) continue;
      const distance = Math.hypot(target.x - x, target.y - y);
      if (distance > radius + target.radius) continue;
      if (classDamageTarget(target, damage, owner, x, y, knockback)) hits += 1;
    }
    spawnWave(x, y, owner?.hue ?? 188, radius, 0.55);
    return hits;
  }

  function spawnClassProjectile(owner, angle, options = {}) {
    const speed = options.speed || 620;
    const projectile = {
      id: `${owner.id || "entity"}-${Math.random().toString(36).slice(2, 8)}`,
      owner,
      x: owner.x + Math.cos(angle) * (owner.radius + 8),
      y: owner.y + Math.sin(angle) * (owner.radius + 8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: options.radius || 6,
      damage: options.damage || 16,
      life: options.life || 1.2,
      hue: options.hue ?? owner.hue,
      pierce: options.pierce || 0,
      slow: options.slow || 0,
      explosive: options.explosive || 0,
      homing: options.homing || 0,
      hitIds: new Set()
    };
    classProjectiles.push(projectile);
    return projectile;
  }

  function meleeArc(owner, range, damage, arc = Math.PI * 0.72) {
    const angle = targetAngle(owner);
    let hits = 0;
    const targets = owner === player ? bots : [player];
    for (const target of targets) {
      if (!target || target.dead) continue;
      const dx = target.x - owner.x;
      const dy = target.y - owner.y;
      const distance = Math.hypot(dx, dy);
      const delta = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle)));
      if (distance <= range + target.radius && delta <= arc / 2 && classDamageTarget(target, damage, owner, owner.x, owner.y, 190)) hits += 1;
    }
    spawnWave(owner.x, owner.y, owner.hue, range, 0.3);
    return hits;
  }

  function beginMarksman(owner) {
    if (owner.classCooldown > 0 || owner.classResource < 8) return;
    owner.classCharging = true;
    owner.classCharge = 0;
  }

  function releaseMarksman(owner) {
    if (!owner.classCharging) return;
    owner.classCharging = false;
    const evolution = getClassEvolution("marksman", owner.classLevel);
    const charge = clamp(owner.classCharge, 0.12, 1);
    const angle = targetAngle(owner);
    const distanceBonus = 1 + Math.min(0.65, Math.hypot((owner.targetX || owner.x) - owner.x, (owner.targetY || owner.y) - owner.y) / 1000);
    spawnClassProjectile(owner, angle, {
      speed: (520 + charge * 520) * evolution.range,
      damage: (14 + charge * 42) * distanceBonus,
      radius: (4 + charge * 7) * evolution.projectileSize,
      life: 0.9 + charge * 0.9
    });
    owner.classResource = Math.max(0, owner.classResource - (8 + charge * 18));
    owner.classCooldown = 0.3;
    sound(410 + charge * 260, 0.18, "triangle", 0.04);
  }

  function performDash(owner, distanceScale = 1) {
    if (owner.classCooldown > 0 || owner.classResource < 18) return false;
    const evolution = getClassEvolution("charger", owner.classLevel);
    const angle = targetAngle(owner);
    owner.classActionTimer = 0.3 * distanceScale * evolution.dashRange;
    owner.classDashAngle = angle;
    owner.classDashHitIds = new Set();
    owner.classResource -= 18;
    owner.classCooldown = 0.75;
    owner.hitTimer = Math.max(owner.hitTimer, 0.25);
    spawnWave(owner.x, owner.y, owner.hue, 68, 0.35);
    return true;
  }

  function placeTrap(owner, slow = 0.48) {
    if (owner.classResource < 1) return false;
    const limit = Math.floor(getClassDefinition("trapper").resource.max * getClassEvolution("trapper", owner.classLevel).traps);
    const owned = classTraps.filter((trap) => trap.owner === owner);
    if (owned.length >= limit) owned[0].life = 0;
    classTraps.push({ owner, x: owner.x, y: owner.y, radius: 72, damage: 22, life: 12, armed: 0.55, slow, hue: owner.hue });
    owner.classResource -= 1;
    owner.classCooldown = 0.4;
    sound(245, 0.16, "square", 0.025);
    return true;
  }

  function activateShield(owner) {
    if (owner.classResource < 18 || owner.classCooldown > 0) return false;
    owner.classShieldTimer = 2.4 * getClassEvolution("defender", owner.classLevel).duration;
    owner.classShieldAngle = targetAngle(owner);
    owner.classResource -= 18;
    owner.classCooldown = 0.65;
    spawnWave(owner.x, owner.y, owner.hue, 96, 0.45);
    return true;
  }

  function activateStealth(owner) {
    if (owner.classResource < 24 || owner.classCooldown > 0) return false;
    const evolution = getClassEvolution("assassin", owner.classLevel);
    owner.classStealthTimer = 2.6 * evolution.stealth;
    owner.classAmbushReady = true;
    owner.classResource -= 24;
    owner.classCooldown = 1;
    const angle = targetAngle(owner);
    const distance = 145 * evolution.teleport;
    owner.x = clamp(owner.x + Math.cos(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    owner.y = clamp(owner.y + Math.sin(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    burst(owner.x, owner.y, owner.hue, 12);
    return true;
  }

  function createGravityField(owner) {
    if (owner.classResource < 30 || owner.classCooldown > 0) return false;
    const evolution = getClassEvolution("controller", owner.classLevel);
    const target = owner === player ? worldTarget() : { x: owner.targetX, y: owner.targetY };
    classFields.push({ owner, type: "gravity", x: target.x, y: target.y, radius: 150 * evolution.area, strength: 390 * evolution.pull, damage: 5, life: 3.2 * evolution.duration, hue: owner.hue, tick: 0 });
    owner.classResource -= 30;
    owner.classCooldown = 0.8;
    return true;
  }

  function summonUnit(owner, command = false) {
    const evolution = getClassEvolution("summoner", owner.classLevel);
    const limit = Math.max(2, Math.floor(2 * evolution.units));
    const owned = classMinions.filter((minion) => minion.owner === owner && minion.life > 0);
    if (!command && owned.length >= limit) return false;
    if (!command) {
      classMinions.push({ owner, x: owner.x, y: owner.y, vx: 0, vy: 0, radius: 6, life: 18, health: 28, attackTimer: 0, frenzy: 0, hue: owner.hue });
      owner.classResource = Math.min(owner.classResourceMax, owned.length + 1);
      return true;
    }
    for (const minion of owned) minion.frenzy = 3;
    return owned.length > 0;
  }

  function launchOrb(owner, all = false) {
    const count = Math.floor(owner.classResource);
    if (count < 1) return false;
    const shots = all ? count : 1;
    const base = targetAngle(owner);
    for (let index = 0; index < shots; index += 1) {
      const angle = all ? base + index * TAU / shots : base;
      spawnClassProjectile(owner, angle, { speed: 540, damage: 20, radius: 8, life: 1.4, explosive: all ? 42 : 0 });
    }
    owner.classResource -= shots;
    owner.classCooldown = all ? 1 : 0.35;
    return true;
  }

  function fireLoader(owner) {
    if (owner.classResource < 1 || owner.classCooldown > 0) return false;
    const violet = (owner.violetAmmo || 0) > 0;
    if (violet) owner.violetAmmo -= 1;
    else owner.blueAmmo = Math.max(0, (owner.blueAmmo || 0) - 1);
    owner.classResource = Math.max(0, (owner.blueAmmo || 0) + (owner.violetAmmo || 0));
    spawnClassProjectile(owner, targetAngle(owner), { speed: 650, damage: violet ? 31 : 18, radius: violet ? 8 : 5, life: 1.3, explosive: violet ? 68 : 0 });
    owner.lastAmmoType = violet ? "violet" : "blue";
    owner.classCooldown = 0.24;
    return true;
  }

  function reverseCutterPath(owner) {
    const points = owner.lastCutterPath;
    if (!points || points.length < 2 || owner.classResource < 28) return false;
    const reverse = [...points].reverse().map((point) => ({ ...point }));
    const hitIds = damageAlongPath(reverse, owner.trailDamage * 0.72, owner);
    ribbons.push({ points: reverse, hue: (owner.hue + 42) % 360, life: 0.48, maxLife: 0.48, width: 9, hitIds });
    owner.classResource -= 28;
    return true;
  }

  const classControllerRegistry = Object.freeze({
    cutter: {
      primaryStart: () => beginCutterPhase(), primaryEnd: (cancelled) => endCutterPhase(cancelled),
      special: () => reverseCutterPath(player)
    },
    marksman: {
      primaryStart: () => beginMarksman(player), primaryEnd: (cancelled) => cancelled ? (player.classCharging = false) : releaseMarksman(player),
      special: () => {
        if (player.classResource < 32) return false;
        spawnClassProjectile(player, targetAngle(), { speed: 980, damage: 38, radius: 7, life: 1.7, pierce: 5 });
        player.classResource -= 32;
        return true;
      }
    },
    charger: {
      primaryStart: () => performDash(player), primaryEnd: () => {},
      special: () => player.classResource >= 34 && (player.classResource -= 34, damageInRadius(player, player.x, player.y, 150, 30), true)
    },
    trapper: {
      primaryStart: () => player.classCooldown <= 0 && (spawnClassProjectile(player, targetAngle(), { speed: 560, damage: 13, radius: 5, life: 1 }), player.classCooldown = 0.3),
      primaryEnd: () => {}, special: () => placeTrap(player)
    },
    defender: {
      primaryStart: () => player.classCooldown <= 0 && (meleeArc(player, 108, 16 + player.classCounterCharge), player.classCounterCharge = 0, player.classCooldown = 0.48),
      primaryEnd: () => {}, special: () => activateShield(player)
    },
    assassin: {
      primaryStart: () => {
        if (player.classCooldown > 0) return;
        const multiplier = player.classAmbushReady ? 2.15 : 1;
        meleeArc(player, 92, 24 * multiplier, Math.PI * 0.55);
        player.classAmbushReady = false;
        player.classStealthTimer = 0;
        player.classCooldown = 0.32;
      },
      primaryEnd: () => {}, special: () => activateStealth(player)
    },
    controller: {
      primaryStart: () => player.classCooldown <= 0 && (meleeArc(player, 145, 12, TAU), player.classCooldown = 0.5),
      primaryEnd: () => {}, special: () => createGravityField(player)
    },
    summoner: {
      primaryStart: () => player.classCooldown <= 0 && (summonUnit(player), player.classCooldown = 0.7),
      primaryEnd: () => {}, special: () => summonUnit(player, true)
    },
    orbiter: {
      primaryStart: () => launchOrb(player), primaryEnd: () => {}, special: () => launchOrb(player, true)
    },
    loader: {
      primaryStart: () => fireLoader(player), primaryEnd: () => {},
      special: () => {
        const ammo = player.classResource;
        if (ammo < 2) return false;
        player.blueAmmo = 0; player.violetAmmo = 0; player.classResource = 0;
        damageInRadius(player, player.x, player.y, 105 + ammo * 7, 12 + ammo * 4);
        return true;
      }
    }
  });

  function beginClassPrimary() {
    if (state !== "playing") return;
    classControllerRegistry[player.classId]?.primaryStart?.();
  }

  function endClassPrimary(cancelled = false) {
    classControllerRegistry[player.classId]?.primaryEnd?.(cancelled);
  }

  function useClassSpecial() {
    if (state !== "playing" || classSpecialCooldown > 0) return;
    if (activeMode === "multiplayer") {
      if (multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "class_special" }));
      classSpecialCooldown = 0.35;
      return;
    }
    const used = classControllerRegistry[player.classId]?.special?.();
    if (used !== false) {
      classSpecialCooldown = 1.1 * player.cooldownScale;
      sound(player.classDefinition.sound, 0.22, "triangle", 0.04);
      if (preparation.settings.vibration && navigator.vibrate) navigator.vibrate(22);
      updateClassHud();
    }
  }

  function grantClassExperience(amount) {
    if (!player || activeMode === "multiplayer") return;
    player.classExperience += Math.max(0, amount || 0);
  }

  function updateClassProgression() {
    const nextLevel = getClassLevel(player.classExperience + player.score * 0.35);
    if (nextLevel === player.classLevel) return;
    player.classLevel = nextLevel;
    const definition = player.classDefinition;
    const evolution = getClassEvolution(player.classId, nextLevel);
    player.radius = 18 * (1 + (nextLevel - 1) * 0.025);
    player.moveSpeed = definition.attributes.speed * (1 + Math.min(0.12, (nextLevel - 1) * 0.01));
    if (player.classId === "cutter") {
      player.ribbonWidthBonus = evolution.trailWidth;
      player.trailDamage = 34 * evolution.damage;
      player.phaseDrain = 29 / evolution.resourceEfficiency;
    }
    if (nextLevel > lastClassLevel) {
      showToast(`${definition.name} // NÍVEL ${nextLevel}`, 1600);
      spawnWave(player.x, player.y, player.hue, 120, 0.7);
      sound(definition.sound * 1.25, 0.3, "triangle", 0.035);
    }
    lastClassLevel = nextLevel;
  }

  function updatePlayerClass(dt) {
    classSpecialCooldown = Math.max(0, classSpecialCooldown - dt);
    player.classCooldown = Math.max(0, (player.classCooldown || 0) - dt);
    player.classShieldTimer = Math.max(0, (player.classShieldTimer || 0) - dt);
    player.classStealthTimer = Math.max(0, (player.classStealthTimer || 0) - dt);
    if (player.classStealthTimer > 0) player.hitTimer = Math.max(player.hitTimer, 0.08);
    if (player.classCharging) {
      const evolution = getClassEvolution("marksman", player.classLevel);
      player.classCharge = Math.min(1, player.classCharge + dt * 0.72 * evolution.chargeSpeed);
      player.classResource = Math.max(0, player.classResource - dt * 2);
      if (player.classResource <= 0) releaseMarksman(player);
    }
    if (player.classActionTimer > 0) {
      player.classActionTimer -= dt;
      const speed = 840;
      player.vx = Math.cos(player.classDashAngle) * speed;
      player.vy = Math.sin(player.classDashAngle) * speed;
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      for (const bot of bots) {
        if (bot.dead || player.classDashHitIds.has(bot.id)) continue;
        if (Math.hypot(bot.x - player.x, bot.y - player.y) < bot.radius + player.radius + 9) {
          player.classDashHitIds.add(bot.id);
          classDamageTarget(bot, 27, player, player.x, player.y, 360);
        }
      }
      if (player.classActionTimer <= 0) damageInRadius(player, player.x, player.y, 88, 12);
    }
    const regen = { cutter: 15, marksman: 14, charger: 18, trapper: 0.16, defender: 16, assassin: 18, controller: 15, summoner: 0.08, orbiter: 0.32, loader: 0 }[player.classId] || 12;
    if (!player.classCharging && player.classId !== "loader") player.classResource = Math.min(player.classResourceMax, player.classResource + regen * dt);
    if (player.classId === "summoner") player.classResource = classMinions.filter((minion) => minion.owner === player && minion.life > 0).length;
    updateClassProgression();
  }
  function closestClassTarget(owner, x, y, maximum = Infinity) {
    const targets = owner === player ? bots.filter((bot) => !bot.dead) : [player];
    let closest = null;
    let closestDistance = maximum;
    for (const target of targets) {
      if (!target || target.dead || target.respawnTimer > 0) continue;
      const distance = Math.hypot(target.x - x, target.y - y);
      if (distance < closestDistance) {
        closest = target;
        closestDistance = distance;
      }
    }
    return closest;
  }

  function updateClassProjectiles(dt) {
    for (let index = classProjectiles.length - 1; index >= 0; index -= 1) {
      const projectile = classProjectiles[index];
      projectile.life -= dt;
      if (projectile.life <= 0) {
        classProjectiles.splice(index, 1);
        continue;
      }
      if (projectile.homing > 0) {
        const target = closestClassTarget(projectile.owner, projectile.x, projectile.y, 520);
        if (target) {
          const speed = Math.hypot(projectile.vx, projectile.vy);
          const desired = Math.atan2(target.y - projectile.y, target.x - projectile.x);
          const current = Math.atan2(projectile.vy, projectile.vx);
          const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
          const angle = current + clamp(delta, -projectile.homing * dt, projectile.homing * dt);
          projectile.vx = Math.cos(angle) * speed;
          projectile.vy = Math.sin(angle) * speed;
        }
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (projectile.x < WORLD_MARGIN || projectile.x > WORLD_SIZE - WORLD_MARGIN || projectile.y < WORLD_MARGIN || projectile.y > WORLD_SIZE - WORLD_MARGIN) {
        if (projectile.explosive) damageInRadius(projectile.owner, projectile.x, projectile.y, projectile.explosive, projectile.damage * 0.55);
        classProjectiles.splice(index, 1);
        continue;
      }
      const targets = projectile.owner === player ? bots : [player];
      for (const target of targets) {
        if (!target || target.dead || projectile.hitIds.has(target.id)) continue;
        if (Math.hypot(target.x - projectile.x, target.y - projectile.y) > target.radius + projectile.radius) continue;
        projectile.hitIds.add(target.id);
        classDamageTarget(target, projectile.damage, projectile.owner, projectile.x, projectile.y, 90);
        if (projectile.slow > 0 && target !== player) target.classSlowTimer = Math.max(target.classSlowTimer || 0, projectile.slow);
        if (projectile.explosive) damageInRadius(projectile.owner, projectile.x, projectile.y, projectile.explosive, projectile.damage * 0.55);
        burst(projectile.x, projectile.y, projectile.hue, 6);
        if (projectile.pierce > 0) projectile.pierce -= 1;
        else {
          projectile.life = 0;
          break;
        }
      }
      if (projectile.life <= 0) classProjectiles.splice(index, 1);
    }
  }

  function updateClassTraps(dt) {
    for (let index = classTraps.length - 1; index >= 0; index -= 1) {
      const trap = classTraps[index];
      trap.life -= dt;
      trap.armed -= dt;
      if (trap.life <= 0) {
        if (trap.owner?.classId === "trapper") trap.owner.classResource = Math.min(trap.owner.classResourceMax, trap.owner.classResource + 1);
        classTraps.splice(index, 1);
        continue;
      }
      if (trap.armed > 0) continue;
      const target = closestClassTarget(trap.owner, trap.x, trap.y, trap.radius + 28);
      if (!target) continue;
      classDamageTarget(target, trap.damage, trap.owner, trap.x, trap.y, 120);
      if (target !== player) {
        target.classSlowTimer = 2.8;
        target.speed *= trap.slow;
      } else {
        player.vx *= trap.slow;
        player.vy *= trap.slow;
      }
      spawnWave(trap.x, trap.y, trap.hue, trap.radius, 0.6);
      trap.life = 0;
    }
  }

  function updateClassFields(dt) {
    for (let index = classFields.length - 1; index >= 0; index -= 1) {
      const field = classFields[index];
      field.life -= dt;
      field.tick -= dt;
      if (field.life <= 0) {
        classFields.splice(index, 1);
        continue;
      }
      const targets = field.owner === player ? bots : [player];
      for (const target of targets) {
        if (!target || target.dead) continue;
        const dx = field.x - target.x;
        const dy = field.y - target.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance > field.radius + target.radius) continue;
        if (field.type === "gravity") {
          const pull = field.strength * (1 - Math.min(1, distance / field.radius)) * dt;
          target.vx += (dx / distance) * pull;
          target.vy += (dy / distance) * pull;
        }
        if (field.type === "slow" && target !== player) {
          target.classSlowTimer = Math.max(target.classSlowTimer || 0, 0.22);
          target.vx *= 0.62;
          target.vy *= 0.62;
        }
        if (field.tick <= 0 && field.damage > 0) classDamageTarget(target, field.damage, field.owner, field.x, field.y, 0);
      }
      if (field.owner === player && field.type === "gravity") {
        for (const mote of motes) {
          const dx = field.x - mote.x;
          const dy = field.y - mote.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < field.radius * 1.35) {
            mote.x += (dx / distance) * field.strength * 0.55 * dt;
            mote.y += (dy / distance) * field.strength * 0.55 * dt;
          }
        }
      }
      if (field.tick <= 0) field.tick = 0.42;
    }
  }

  function updateClassMinions(dt) {
    for (let index = classMinions.length - 1; index >= 0; index -= 1) {
      const minion = classMinions[index];
      minion.life -= dt;
      minion.attackTimer -= dt;
      minion.frenzy = Math.max(0, minion.frenzy - dt);
      if (minion.life <= 0 || minion.health <= 0 || minion.owner?.dead) {
        classMinions.splice(index, 1);
        continue;
      }
      const target = closestClassTarget(minion.owner, minion.x, minion.y, 850);
      if (target) {
        const speed = 235 * (minion.frenzy > 0 ? 1.55 : 1);
        const desired = { x: minion.x, y: minion.y, vx: minion.vx, vy: minion.vy };
        steerVelocity(desired, target.x, target.y, speed, dt, 7);
        minion.vx = desired.vx;
        minion.vy = desired.vy;
        minion.x += minion.vx * dt;
        minion.y += minion.vy * dt;
        if (Math.hypot(target.x - minion.x, target.y - minion.y) < target.radius + 16 && minion.attackTimer <= 0) {
          classDamageTarget(target, 8 * (minion.frenzy > 0 ? 1.65 : 1), minion.owner, minion.x, minion.y, 35);
          minion.attackTimer = minion.frenzy > 0 ? 0.42 : 0.75;
        }
      } else {
        const angle = runTime * 1.4 + index * 1.7;
        minion.x = lerp(minion.x, minion.owner.x + Math.cos(angle) * 48, dt * 3);
        minion.y = lerp(minion.y, minion.owner.y + Math.sin(angle) * 48, dt * 3);
      }
    }
  }

  function updateClassCombat(dt) {
    updatePlayerClass(dt);
    updateClassProjectiles(dt);
    updateClassTraps(dt);
    updateClassFields(dt);
    updateClassMinions(dt);
    for (let index = classDamageNumbers.length - 1; index >= 0; index -= 1) {
      const number = classDamageNumbers[index];
      number.life -= dt;
      number.y -= 24 * dt;
      if (number.life <= 0) classDamageNumbers.splice(index, 1);
    }
    for (const bot of bots) {
      if ((bot.classSlowTimer || 0) > 0) {
        bot.classSlowTimer -= dt;
        if (bot.classSlowTimer <= 0 && bot.classDefinition) bot.speed = bot.classDefinition.attributes.speed;
      }
    }
  }

  function drawClassCombat(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const field of classFields) {
      if (!visible(field.x, field.y, field.radius)) continue;
      const point = toScreen(field.x, field.y);
      const radius = field.radius * camera.zoom;
      const pulse = 0.85 + Math.sin(time * 0.006) * 0.08;
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      gradient.addColorStop(0, hsl(field.hue, 90, 60, 0.14));
      gradient.addColorStop(0.72, hsl(field.hue, 88, 48, 0.07));
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(point.x, point.y, radius * pulse, 0, TAU); ctx.fill();
      ctx.strokeStyle = hsl(field.hue, 94, 70, 0.42);
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(point.x, point.y, radius * pulse, 0, TAU); ctx.stroke();
    }
    for (const trap of classTraps) {
      if (!visible(trap.x, trap.y, trap.radius)) continue;
      const point = toScreen(trap.x, trap.y);
      const radius = trap.radius * camera.zoom;
      ctx.strokeStyle = hsl(trap.hue, 90, 68, trap.armed > 0 ? 0.22 : 0.62);
      ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      for (let marker = 0; marker < 3; marker += 1) {
        const angle = time * 0.001 + marker * TAU / 3;
        ctx.fillStyle = hsl(trap.hue, 95, 72, 0.8);
        ctx.beginPath(); ctx.arc(point.x + Math.cos(angle) * radius * 0.72, point.y + Math.sin(angle) * radius * 0.72, 2.5, 0, TAU); ctx.fill();
      }
    }
    for (const projectile of classProjectiles) {
      if (!visible(projectile.x, projectile.y, 30)) continue;
      const point = toScreen(projectile.x, projectile.y);
      ctx.shadowColor = hsl(projectile.hue, 96, 64, 0.9);
      ctx.shadowBlur = MOBILE_QUALITY ? 0 : 14;
      ctx.fillStyle = hsl(projectile.hue, 96, 72, 0.92);
      ctx.beginPath(); ctx.arc(point.x, point.y, projectile.radius * camera.zoom, 0, TAU); ctx.fill();
      ctx.strokeStyle = hsl(projectile.hue, 90, 60, 0.35);
      ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(point.x - projectile.vx * 0.028 * camera.zoom, point.y - projectile.vy * 0.028 * camera.zoom); ctx.stroke();
    }
    for (const minion of classMinions) {
      if (!visible(minion.x, minion.y, 30)) continue;
      const point = toScreen(minion.x, minion.y);
      ctx.fillStyle = hsl(minion.hue, 92, 70, 0.9);
      ctx.beginPath(); ctx.arc(point.x, point.y, minion.radius * camera.zoom, 0, TAU); ctx.fill();
      ctx.strokeStyle = hsl(minion.hue, 94, 64, 0.45);
      ctx.beginPath(); ctx.arc(point.x, point.y, (minion.radius + 5 + Math.sin(time * 0.008) * 2) * camera.zoom, 0, TAU); ctx.stroke();
    }
    ctx.restore();

    if (preparation.settings.showDamage) {
      ctx.save(); ctx.textAlign = "center"; ctx.font = "700 11px Inter, sans-serif";
      for (const number of classDamageNumbers) {
        const point = toScreen(number.x, number.y);
        ctx.fillStyle = hsl(number.hue, 95, 72, clamp(number.life / number.maxLife, 0, 1));
        ctx.fillText(`-${number.amount}`, point.x, point.y);
      }
      ctx.restore();
    }

    if (player.classCharging) {
      const origin = toScreen(player.x, player.y);
      ctx.save();
      ctx.strokeStyle = hsl(player.hue, 95, 72, 0.28 + player.classCharge * 0.5);
      ctx.lineWidth = 1 + player.classCharge * 2;
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    if (player.classShieldTimer > 0) {
      const point = toScreen(player.x, player.y);
      ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(player.classShieldAngle);
      ctx.strokeStyle = hsl(player.hue, 96, 76, 0.78); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, (player.radius + 14) * camera.zoom, -0.85, 0.85); ctx.stroke(); ctx.restore();
    }

    if (player.classId === "orbiter") {
      const count = Math.floor(player.classResource);
      const point = toScreen(player.x, player.y);
      ctx.save();
      for (let index = 0; index < count; index += 1) {
        const angle = time * 0.0024 + index * TAU / Math.max(1, count);
        const radius = (player.radius + 24) * camera.zoom;
        ctx.fillStyle = hsl(player.hue + index * 12, 94, 72, 0.88);
        ctx.beginPath(); ctx.arc(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius, 5 * camera.zoom, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }
  function initializeBotClass(bot, classId) {
    if (!bot || bot.boss) return bot;
    applyEntityClass(bot, classId || "cutter");
    bot.baseSpeed = bot.classDefinition.attributes.speed;
    bot.speed = bot.baseSpeed;
    bot.classThinkTimer = random(0.2, 0.7);
    bot.roleLabel = `${bot.classDefinition.name} · LV ${bot.classLevel}`;
    bot.classResource = bot.classResourceMax;
    if (bot.classId === "loader") {
      bot.blueAmmo = 8;
      bot.violetAmmo = 2;
      bot.classResource = 10;
    }
    return bot;
  }

  function nearestBotClassTarget(bot) {
    let target = player;
    let distance = Math.hypot(player.x - bot.x, player.y - bot.y);
    for (const candidate of bots) {
      if (candidate === bot || candidate.dead || candidate.faction === bot.faction || candidate.boss) continue;
      const candidateDistance = Math.hypot(candidate.x - bot.x, candidate.y - bot.y);
      if (candidateDistance < distance) {
        target = candidate;
        distance = candidateDistance;
      }
    }
    return { target, distance };
  }

  function botAlignment(bot, target) {
    const velocityLength = Math.hypot(bot.vx, bot.vy);
    if (velocityLength < 5) return 0.5;
    const targetLength = Math.hypot(target.x - bot.x, target.y - bot.y) || 1;
    return clamp((bot.vx * (target.x - bot.x) + bot.vy * (target.y - bot.y)) / (velocityLength * targetLength), -1, 1) * 0.5 + 0.5;
  }

  function performBotClassAction(bot, target, decision) {
    if (bot.classCooldown > 0 || bot.cooldown > 0 || bot.respawnTimer > 0) return false;
    bot.targetX = target.x;
    bot.targetY = target.y;
    if (bot.classId === "cutter") {
      if (!bot.phasing && bot.energy > 44) beginBotPhase(bot, target);
      return true;
    }
    if (bot.classId === "marksman") {
      if (decision.action === "charge") {
        spawnClassProjectile(bot, Math.atan2(target.y - bot.y, target.x - bot.x), { speed: 760, damage: 18, radius: 6, life: 1.5, pierce: bot.classLevel >= 7 ? 1 : 0 });
        bot.classCooldown = 1.8;
      }
      return true;
    }
    if (bot.classId === "charger") {
      if (decision.action === "charge") performDash(bot, 0.8);
      return true;
    }
    if (bot.classId === "trapper") {
      if (decision.action === "trap") placeTrap(bot, 0.55);
      else spawnClassProjectile(bot, Math.atan2(target.y - bot.y, target.x - bot.x), { speed: 470, damage: 9, radius: 5, life: 1.15, slow: 0.4 });
      bot.classCooldown = 1.25;
      return true;
    }
    if (bot.classId === "defender") {
      if (decision.action === "block") activateShield(bot);
      else meleeArc(bot, 105, 13 + bot.classCounterCharge);
      bot.classCooldown = 1.1;
      return true;
    }
    if (bot.classId === "assassin") {
      if (decision.action === "ambush" && bot.classStealthTimer <= 0) activateStealth(bot);
      else if (Math.hypot(target.x - bot.x, target.y - bot.y) < 125) {
        meleeArc(bot, 100, bot.classAmbushReady ? 28 : 15, Math.PI * 0.65);
        bot.classAmbushReady = false;
        bot.classStealthTimer = 0;
      }
      bot.classCooldown = 0.85;
      return true;
    }
    if (bot.classId === "controller") {
      if (decision.action === "pull") createGravityField(bot);
      else meleeArc(bot, 140, 9, TAU);
      bot.classCooldown = 1.4;
      return true;
    }
    if (bot.classId === "summoner") {
      summonUnit(bot, decision.action === "command");
      bot.classCooldown = 1.6;
      return true;
    }
    if (bot.classId === "orbiter") {
      if (decision.action === "launch") launchOrb(bot, false);
      bot.classCooldown = 1.15;
      return true;
    }
    if (bot.classId === "loader") {
      if (decision.action === "explode") {
        damageInRadius(bot, bot.x, bot.y, 125, 19);
        bot.classResource = Math.max(0, bot.classResource - 3);
      } else if (decision.action === "shoot") fireLoader(bot);
      bot.classCooldown = 1.1;
      return true;
    }
    return false;
  }

  function updateBotClassAi(bot, dt) {
    if (!bot.classId || bot.boss || bot.dead) return false;
    bot.classCooldown = Math.max(0, (bot.classCooldown || 0) - dt);
    bot.classShieldTimer = Math.max(0, (bot.classShieldTimer || 0) - dt);
    bot.classStealthTimer = Math.max(0, (bot.classStealthTimer || 0) - dt);
    if (bot.classId === "assassin") bot.stealthed = bot.classStealthTimer > 0;
    bot.classThinkTimer -= dt;
    bot.classExperience = Math.max(bot.classExperience || 0, bot.score || 0);
    bot.classLevel = getClassLevel(bot.classExperience);
    bot.radius = 17 * (1 + (bot.classLevel - 1) * 0.022);
    bot.roleLabel = `${bot.classDefinition.name} · LV ${bot.classLevel}`;
    if (bot.classActionTimer > 0) {
      bot.classActionTimer -= dt;
      bot.vx = Math.cos(bot.classDashAngle) * 710;
      bot.vy = Math.sin(bot.classDashAngle) * 710;
      const { target } = nearestBotClassTarget(bot);
      if (target && !bot.classDashHitIds.has(target.id) && Math.hypot(target.x - bot.x, target.y - bot.y) < target.radius + bot.radius + 10) {
        bot.classDashHitIds.add(target.id);
        classDamageTarget(target, 20, bot, bot.x, bot.y, 280);
      }
      if (bot.classActionTimer <= 0) damageInRadius(bot, bot.x, bot.y, 72, 8);
    }
    if (bot.classResource < bot.classResourceMax && !["loader", "summoner"].includes(bot.classId)) {
      const regen = bot.classId === "trapper" || bot.classId === "orbiter" ? 0.22 : 12;
      bot.classResource = Math.min(bot.classResourceMax, bot.classResource + regen * dt);
    }
    if (bot.classId === "loader" && bot.classResource < 3) {
      bot.blueAmmo = Math.min(8, (bot.blueAmmo || 0) + dt * 0.35);
      bot.classResource = (bot.blueAmmo || 0) + (bot.violetAmmo || 0);
    }
    if (bot.classThinkTimer > 0) return true;
    bot.classThinkTimer = random(0.28, 0.7);
    const { target, distance } = nearestBotClassTarget(bot);
    if (!target) return true;
    const nearbyEnemies = bots.filter((candidate) => candidate !== bot && !candidate.dead && candidate.faction !== bot.faction && Math.hypot(candidate.x - bot.x, candidate.y - bot.y) < 220).length;
    const decision = decideClassAi(bot.classId, {
      distance,
      danger: clamp((1 - bot.health / bot.maxHealth) + nearbyEnemies * 0.16, 0, 1),
      alignment: botAlignment(bot, target),
      contested: nearbyEnemies / 3,
      traps: classTraps.filter((trap) => trap.owner === bot).length,
      frontalThreat: distance < 280 ? 0.8 : 0.2,
      allyDanger: 0.3,
      targetHealth: target.health / target.maxHealth,
      isolated: nearbyEnemies <= 1 ? 0.9 : 0.3,
      clustered: nearbyEnemies / 3,
      units: classMinions.filter((minion) => minion.owner === bot).length,
      orbs: bot.classResource,
      ammo: bot.classResource,
      surrounded: nearbyEnemies / 3
    });
    const dx = bot.x - target.x;
    const dy = bot.y - target.y;
    const length = Math.hypot(dx, dy) || 1;
    if (["retreat", "kite", "preserve", "reposition", "collect", "stalk"].includes(decision.action)) {
      bot.targetX = clamp(bot.x + (dx / length) * 260, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.targetY = clamp(bot.y + (dy / length) * 260, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    } else if (distance > decision.idealRange * 1.12) {
      bot.targetX = target.x;
      bot.targetY = target.y;
    } else if (distance < decision.idealRange * 0.72 && bot.classId !== "charger") {
      bot.targetX = clamp(bot.x + (dx / length) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.targetY = clamp(bot.y + (dy / length) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    }
    performBotClassAction(bot, target, decision);
    return true;
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

  const MOTE_CELL_SIZE = 180;
  const moteCells = new Map();
  const moteQueryBuffer = [];

  function moteCellCoordinate(value) {
    return Math.floor(value / MOTE_CELL_SIZE);
  }

  function moteCellKey(cellX, cellY) {
    return cellY * 65536 + cellX;
  }

  function indexMote(mote) {
    if (!mote) return;
    const key = moteCellKey(moteCellCoordinate(mote.x), moteCellCoordinate(mote.y));
    let bucket = moteCells.get(key);
    if (!bucket) {
      bucket = [];
      moteCells.set(key, bucket);
    }
    bucket.push(mote);
    mote._spatialCell = key;
  }

  function unindexMote(mote) {
    const key = mote?._spatialCell;
    if (key == null) return;
    const bucket = moteCells.get(key);
    if (!bucket) return;
    const bucketIndex = bucket.indexOf(mote);
    if (bucketIndex >= 0) bucket.splice(bucketIndex, 1);
    if (bucket.length === 0) moteCells.delete(key);
    mote._spatialCell = null;
  }

  function rebuildMoteSpatialIndex() {
    moteCells.clear();
    for (const mote of motes) indexMote(mote);
  }

  function queryMotes(x, y, radius) {
    moteQueryBuffer.length = 0;
    const minX = moteCellCoordinate(x - radius);
    const maxX = moteCellCoordinate(x + radius);
    const minY = moteCellCoordinate(y - radius);
    const maxY = moteCellCoordinate(y + radius);
    const radiusSq = radius * radius;
    for (let cellY = minY; cellY <= maxY; cellY += 1) {
      for (let cellX = minX; cellX <= maxX; cellX += 1) {
        const bucket = moteCells.get(moteCellKey(cellX, cellY));
        if (!bucket) continue;
        for (const mote of bucket) {
          if (distanceSq(x, y, mote.x, mote.y) <= radiusSq) moteQueryBuffer.push(mote);
        }
      }
    }
    return moteQueryBuffer;
  }

  function replaceCollectedMote(mote) {
    const index = motes.indexOf(mote);
    if (index < 0) return null;
    unindexMote(mote);
    motes.splice(index, 1);
    const replacement = createMote();
    motes.push(replacement);
    indexMote(replacement);
    return replacement;
  }

  function appendIndexedMote(mote) {
    motes.push(mote);
    indexMote(mote);
    return mote;
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
    const migrations = { spectro: "azul-neon", neon: "verde-toxico", sangue: "vermelho", fenix: "vermelho", caotico: "arco-iris" };
    const storedSkinId = localStorage.getItem(SKIN_KEY);
    const savedSkinId = migrations[storedSkinId] || storedSkinId || "azul-neon";
    const selected = skins.find((skin) => skin.id === savedSkinId && skin.unlocked());
    if (selected) return selected;
    localStorage.setItem(SKIN_KEY, "azul-neon");
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
    showToast("BÔNUS RESTAURADOS", 1500);
    checkMutation();
  }

  function createPlayer() {
    const maxHealth = 100 + playerUpgrades.core * 5;
    const maxEnergy = 100 + playerUpgrades.charge * 10;
    const activeSkin = getSelectedSkin();
    const entity = {
      id: "player",
      name: "Jogador",
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
    return applyEntityClass(entity, selectedClassId);
  }

  function createBot(index, options = {}) {
    const archetype = botArchetypes[index % botArchetypes.length];
    const angle = Math.random() * TAU;
    const distance = random(620, 1450);
    const faction = Math.floor(Math.random() * 3);
    const factionHueBase = [15, 200, 280];
    const baseSpeed = archetype.speed * random(0.94, 1.06);
    const bot = {
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
    return applyDifficultyToBot(initializeBotClass(bot, options.classId || "cutter"));
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
    const botClasses = createBalancedBotClassComposition({ botCount: BOT_COUNT, playerClass: selectedClassId });
    bots = Array.from({ length: BOT_COUNT }, (_, index) => createBot(index, { classId: botClasses[index] }));
    motes = Array.from({ length: moteCount }, (_, index) => createMote(index < 90));
    rebuildMoteSpatialIndex();
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
    resetClassCombat();
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
    gain.gain.setValueAtTime(Math.max(0.0001, volume * masterVolume * sfxVolume), now);
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
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, masterVolume * musicVolume * 0.55), now + 0.8);

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
    const targetGain = muted ? 0.0001 : Math.max(0.0001, masterVolume * musicVolume * 0.55);
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
    ui.startSubmit.querySelector("span").textContent = multiplayer ? "ENTRAR NA SALA" : "JOGAR";
    setStartStatus();
    if (multiplayer) refreshRooms();
    if (typeof savePreparation === "function") savePreparation({ server: false });
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
      ui.profileSummary.innerHTML = `<strong>RECORDE SOLO: ${profile.solo.best_score}</strong> · ${profile.solo.runs} PARTIDAS SOLO · <strong>${profile.multiplayer.total_kills} ELIMINAÇÕES ONLINE</strong> · <strong style="color:#ffd86b">${profile.resonance} CRÉDITOS</strong> · <strong style="color:#45e6ff">${profile.skillPoints} PONTOS DE HABILIDADE</strong>`;
      playerSkillPoints = profile.skillPoints || 0;
      playerOwnedMutations = profile.ownedMutations || {};
      playerLoadout = profile.loadout || [null, null, null, null];
      applyServerPreparation(profile.preferences, profile.classProgress);
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
    core: { name: "VIDA", symbol: "♥", description: "+5 de vida máxima por nível", color: "#ff4fd8" },
    charge: { name: "ENERGIA", symbol: "⚡", description: "+10 de energia máxima por nível", color: "#45e6ff" },
    calibration: { name: "RECARGA", symbol: "◎", description: "Habilidades recarregam 8% mais rápido por nível", color: "#78ffba" },
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
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} CRÉDITOS`}</span>
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
        action = `MELHORAR PARA O NÍVEL ${["I", "II", "III"][level]}`;
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
        <span class="cost">${isMaxed ? "MÁXIMO" : `${cost} PONTOS`}</span>
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
      showToast("BÔNUS SALVOS", 1200);
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

  async function refreshRooms() {
    if (selectedMode !== "multiplayer") return;
    ui.roomList.replaceChildren();
    try {
      const payload = await requestJson("/api/rooms");
      if (!payload.rooms.length) {
        ui.roomList.textContent = "Nenhuma sala ativa. Crie a primeira sala.";
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
      socket.send(JSON.stringify({ type: "join", roomCode: code, name: sanitizeName(ui.name.value), classId: selectedClassId, skinId: getSelectedSkin().id, skillIds: selectedSkillIds }));
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
        multiplayerHasInitialSnapshot = false;
        multiplayerMoteRevision = 0;
        networkInputSequence = 0;
        networkPingTimer = 0;
        networkPingMs = 0;
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
      if (message.type === "pong") {
        const roundTrip = performance.now() - Number(message.clientTime);
        if (Number.isFinite(roundTrip) && roundTrip >= 0 && roundTrip < 10_000) networkPingMs = networkPingMs ? lerp(networkPingMs, roundTrip, 0.25) : roundTrip;
      }
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

  function applyNetworkSkin(entity) {
    const skin = skins.find((entry) => entry.id === entity.skinId);
    if (!skin) return entity;
    entity.hue = skin.hue;
    entity.skinGlow = skin.glowIntensity;
    entity.skinTrail = skin.trailWidth;
    return entity;
  }

  function mergeNetworkEntity(current, incoming, isLocal = false) {
    const entity = current || { ...incoming, x: incoming.x, y: incoming.y };
    const currentPose = current ? { x: entity.x, y: entity.y, vx: entity.vx, vy: entity.vy } : null;
    entity.networkX = incoming.x;
    entity.networkY = incoming.y;
    entity.networkVx = incoming.vx;
    entity.networkVy = incoming.vy;
    Object.assign(entity, incoming);
    if (currentPose && isLocal) Object.assign(entity, currentPose);
    else if (currentPose) Object.assign(entity, { x: currentPose.x, y: currentPose.y, vx: currentPose.vx || incoming.vx, vy: currentPose.vy || incoming.vy });
    entity.dead = incoming.respawnTimer > 0;
    entity.hitTimer = 0;
    return applyNetworkSkin(entity);
  }

  function applyMoteSnapshot(snapshot) {
    if (Array.isArray(snapshot.motes)) {
      motes = snapshot.motes;
    } else if (Array.isArray(snapshot.moteChanges) && snapshot.moteChanges.length) {
      const moteById = new Map(motes.map((mote) => [mote.id, mote]));
      for (const change of snapshot.moteChanges) {
        moteById.delete(change.removeId);
        if (change.add?.id) moteById.set(change.add.id, change.add);
      }
      motes = [...moteById.values()];
    }
    multiplayerMoteRevision = Number(snapshot.moteRevision) || multiplayerMoteRevision;
  }

  function applyMultiplayerSnapshot(snapshot) {
    multiplayerSnapshot = snapshot;
    multiplayerRemaining = snapshot.remaining;
    runTime = snapshot.elapsed;
    const incomingPlayer = snapshot.players.find((entry) => entry.id === multiplayerPlayerId);
    if (incomingPlayer) {
      player = mergeNetworkEntity(player, incomingPlayer, multiplayerHasInitialSnapshot);
      if (!multiplayerHasInitialSnapshot) {
        player.x = incomingPlayer.x;
        player.y = incomingPlayer.y;
        player.vx = incomingPlayer.vx;
        player.vy = incomingPlayer.vy;
        multiplayerHasInitialSnapshot = true;
      }
    }
    const existingBots = new Map(bots.map((bot) => [bot.id, bot]));
    bots = snapshot.players
      .filter((entry) => entry.id !== multiplayerPlayerId)
      .map((entry) => mergeNetworkEntity(existingBots.get(entry.id), entry));
    applyMoteSnapshot(snapshot);
    ribbons = snapshot.ribbons.map((ribbon) => ({ ...ribbon, points: ribbon.points.map((point) => ({ ...point })) }));
    classProjectiles = (snapshot.projectiles || []).map((projectile) => ({ ...projectile, hitIds: new Set() }));
    classTraps = (snapshot.traps || []).map((trap) => ({ ...trap }));
    classFields = (snapshot.fields || []).map((field) => ({ ...field }));
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
      applySelectedDifficulty();
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
      showToast("PARTIDA INICIADA — SEGURE ESPAÇO PARA ATACAR", 2600);
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
    pendingSkillPoints = Math.floor(player.score / 8) + Math.floor(player.kills * 1.5) + (bossDefeatedThisRun ? 15 : 0);
    if (randomClassBonus) {
      pendingResonance = Math.ceil(pendingResonance * 1.05);
      pendingSkillPoints = Math.ceil(pendingSkillPoints * 1.05);
    }
    ui.gameoverKicker.innerHTML = `<span></span> ${victory ? "VITÓRIA" : "PARTIDA ENCERRADA"}`;
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
    if (ui.skillPointsEarned) ui.skillPointsEarned.textContent = `+${pendingSkillPoints}`;
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
    ui.gameoverTitle.textContent = rank === 1 ? "VOCÊ VENCEU!" : `${rank}º LUGAR.`;
    ui.gameoverCopy.textContent = "O resultado foi persistido no banco local do servidor.";
    ui.finalTimeLabel.textContent = "POSIÇÃO";
    ui.finalScore.textContent = Math.floor(self.score || 0).toString();
    ui.finalKills.textContent = String(self.kills || 0);
    ui.finalTime.textContent = `${rank}º`;
    ui.restart.querySelector("span").textContent = "VOLTAR AO MENU";
    ui.gameover.classList.remove("is-hidden");
  }

  function saveRun({ mode, outcome, bossDefeated = false }) {
    if (lastRunSaved || mode !== "solo" || activeMode === "training") return;
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
        bossDefeated,
        classId: player.classId,
        difficulty: selectedDifficulty,
        rewardMultiplier: randomClassBonus ? 1.05 : 1
      })
    }).then(() => loadProfile()).catch(() => showToast("A PARTIDA NÃO FOI SALVA // INICIE PELO SERVIDOR LOCAL", 2600));
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
    ui.loadoutScreen?.classList.add("is-hidden");
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
    if (activeMode === "multiplayer") {
      if (multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "primary_begin" }));
      ui.mobilePhase.classList.add("is-active");
      return;
    }
    beginClassPrimary();
  }

  function beginCutterPhase() {
    if (state !== "playing" || mutationPending || player.phasing || player.cooldown > 0 || player.energy < 12) return;
    if (player.dualPhase && player.dualPhaseUsed >= player.dualPhaseCharges) return;
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
      if (!cancelled && multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "primary_end" }));
      return;
    }
    endClassPrimary(cancelled);
  }

  function endCutterPhase(cancelled = false) {
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
        const collisionRadius = bot.radius + 12;
        if (bot.x < Math.min(a.x, b.x) - collisionRadius || bot.x > Math.max(a.x, b.x) + collisionRadius
          || bot.y < Math.min(a.y, b.y) - collisionRadius || bot.y > Math.max(a.y, b.y) + collisionRadius) continue;
        const distance = pointToSegmentDistance(bot.x, bot.y, a.x, a.y, b.x, b.y);
        if (distance < collisionRadius) {
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
    if (!["solo", "training"].includes(activeMode) || state !== "playing" || player.hitTimer > 0) return;
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
    if (player.classId === "defender") {
      applied *= player.damageTakenScale || 1;
      if (player.classShieldTimer > 0) {
        const incoming = Math.atan2(y - player.y, x - player.x);
        const delta = Math.abs(Math.atan2(Math.sin(incoming - player.classShieldAngle), Math.cos(incoming - player.classShieldAngle)));
        if (delta < Math.PI * 0.55) {
          player.classCounterCharge = Math.min(24, (player.classCounterCharge || 0) + applied * 0.45);
          applied *= 0.22;
        }
      }
    }

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
      if (activeMode === "training") {
        player.health = player.maxHealth;
        player.hitTimer = 1.2;
        showToast("TREINO // JOGADOR REINICIADO", 1200);
        return;
      }
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
    spawnDamageNumber(bot.x, bot.y - bot.radius, finalDamage, bot.hue);
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

  const ACTIVE_SKILL_EXECUTORS = Object.freeze({
    shield(owner) {
      owner.barrierActive = true;
      owner.barrierTimer = 3;
      spawnWave(owner.x, owner.y, 270, 100, 0.7);
      burst(owner.x, owner.y, 270, 10);
      sound(330, 0.35, "triangle", 0.04);
      showToast("ESCUDO ATIVO POR 3 SEGUNDOS", 1500);
      return true;
    },
    explosion(owner) {
      const hits = damageInRadius(owner, owner.x, owner.y, 130, 18, 280);
      burst(owner.x, owner.y, owner.hue, 20);
      sound(hits ? 110 : 82, 0.3, "triangle", 0.06);
      return true;
    },
    heal(owner) {
      owner.health = Math.min(owner.maxHealth, owner.health + 34);
      spawnWave(owner.x, owner.y, 145, 92, 0.55);
      burst(owner.x, owner.y, 145, 10);
      sound(520, 0.22, "sine", 0.035);
      return true;
    },
    pull(owner) {
      const magnetRadius = 350;
      let pulled = 0;
      for (const mote of motes) {
        const dx = mote.x - owner.x;
        const dy = mote.y - owner.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= magnetRadius || distance <= 5) continue;
        const strength = Math.min(200, distance * 0.72);
        mote.x -= dx / distance * strength;
        mote.y -= dy / distance * strength;
        pulled += 1;
      }
      if (pulled > 0) rebuildMoteSpatialIndex();
      spawnWave(owner.x, owner.y, 268, magnetRadius * 0.6, 0.5);
      burst(owner.x, owner.y, 268, 8);
      sound(440, 0.2, "sine", 0.035);
      if (pulled > 0) showToast(`${pulled} FRAGMENTOS PUXADOS`, 1200);
      return true;
    },
    teleport(owner) {
      const angle = targetAngle(owner);
      const oldX = owner.x; const oldY = owner.y;
      owner.x = clamp(owner.x + Math.cos(angle) * 160, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      owner.y = clamp(owner.y + Math.sin(angle) * 160, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      burst(oldX, oldY, owner.hue, 12);
      burst(owner.x, owner.y, owner.hue, 14);
      spawnWave(owner.x, owner.y, owner.hue, 80, 0.45);
      sound(520, 0.18, "sine", 0.04);
      camera.x = owner.x; camera.y = owner.y;
      return true;
    },
    "triple-shot"(owner) {
      const angle = targetAngle(owner);
      [-0.18, 0, 0.18].forEach((offset) => spawnClassProjectile(owner, angle + offset, { damage: 15, speed: 620 }));
      sound(640, 0.16, "triangle", 0.035);
      return true;
    },
    "slow-trap"(owner) {
      classFields.push({ owner, type: "slow", x: owner.x, y: owner.y, radius: 115, strength: 0, damage: 3, life: 4, hue: owner.hue, tick: 0 });
      spawnWave(owner.x, owner.y, owner.hue, 115, 0.6);
      return true;
    },
    "damage-field"(owner) {
      classFields.push({ owner, type: "damage", x: owner.x, y: owner.y, radius: 125, strength: 0, damage: 5, life: 4, hue: owner.hue, tick: 0 });
      spawnWave(owner.x, owner.y, owner.hue, 125, 0.6);
      return true;
    },
    invisibility(owner) {
      owner.hitTimer = Math.max(owner.hitTimer, 2);
      spawnWave(owner.x, owner.y, 150, 110, 0.8);
      burst(owner.x, owner.y, 150, 14);
      sound(660, 0.3, "sine", 0.04);
      showToast("INVULNERÁVEL POR 2 SEGUNDOS", 1500);
      return true;
    },
    charge(owner) {
      const angle = targetAngle(owner);
      const start = { x: owner.x, y: owner.y };
      const end = {
        x: clamp(owner.x + Math.cos(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
        y: clamp(owner.y + Math.sin(angle) * 180, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN)
      };
      damageAlongPath([start, end], 24, owner);
      owner.x = end.x; owner.y = end.y;
      owner.vx = Math.cos(angle) * 220; owner.vy = Math.sin(angle) * 220;
      ribbons.push({ points: [start, end], hue: owner.hue, life: 0.35, maxLife: 0.35, width: 8, hitIds: new Set() });
      burst(owner.x, owner.y, owner.hue, 14);
      sound(126, 0.22, "sawtooth", 0.04);
      return true;
    }
  });

  function resolveEquippedSkill(skillId) {
    const meta = EQUIPPABLE_SKILLS.find((skill) => skill.id === skillId);
    const execute = ACTIVE_SKILL_EXECUTORS[skillId];
    if (!meta || !execute) return null;
    return { ...meta, energyCost: meta.cost, description: meta.effect, execute };
  }

  let activeSkills = [];
  let skillCooldowns = [];
  let skillSlots = 4;
  let skillHudLayoutKey = "";
  const skillHudBaseCache = new Map();

  function initSkills() {
    activeSkills = selectedSkillIds.slice(0, skillSlots).map(resolveEquippedSkill).filter(Boolean);
    skillCooldowns = activeSkills.map(() => 0);
    skillHudLayoutKey = activeSkills.map((skill) => skill?.id || "empty").join(":");
    skillHudBaseCache.clear();
  }

  function useSkill(index) {
    if (index < 0 || index >= activeSkills.length) return;
    if (state !== "playing" || !["solo", "training"].includes(activeMode)) return;
    const skill = activeSkills[index];
    if (!skill || skillCooldowns[index] > 0) return;
    if (player.energy < skill.energyCost) {
      showToast("ENERGIA INSUFICIENTE", 1000);
      return;
    }
    player.energy -= skill.energyCost;
    skillCooldowns[index] = skill.cooldown;
    skill.execute(player);
  }

  function updateSkills(dt) {
    for (let index = 0; index < skillCooldowns.length; index += 1) {
      if (skillCooldowns[index] > 0) skillCooldowns[index] = Math.max(0, skillCooldowns[index] - dt);
    }
    if (player.barrierActive && player.barrierTimer > 0) {
      player.barrierTimer -= dt;
      if (player.barrierTimer <= 0) player.barrierActive = false;
    }
  }

  function drawSkillHud() {
    if (state !== "playing" || !["solo", "training"].includes(activeMode)) return;
    if (MOBILE_QUALITY) return;
    const slotW = 50;
    const gap = 6;
    const panelPad = 10;
    const totalW = activeSkills.length * slotW + (activeSkills.length - 1) * gap;
    const startX = width / 2 - totalW / 2;
    const y = height - 82;
    let readyMask = 0;
    for (let index = 0; index < activeSkills.length; index += 1) {
      const skill = activeSkills[index];
      if (skill && skillCooldowns[index] <= 0 && player.energy >= skill.energyCost) readyMask |= 1 << index;
    }

    const cacheKey = `${skillHudLayoutKey}:${readyMask}`;
    let base = skillHudBaseCache.get(cacheKey);
    const panelWidth = totalW + panelPad * 2;
    const panelHeight = slotW + 36 + panelPad * 2;
    if (!base) {
      const scale = Math.max(2, Math.ceil(dpr));
      base = document.createElement("canvas");
      base.width = panelWidth * scale; base.height = panelHeight * scale;
      const baseContext = base.getContext("2d");
      baseContext.scale(scale, scale); baseContext.textAlign = "center";
      baseContext.fillStyle = "rgba(11,9,24,0.45)";
      baseContext.beginPath(); baseContext.roundRect(0, 0, panelWidth, panelHeight, 10); baseContext.fill();
      for (let index = 0; index < activeSkills.length; index += 1) {
        const skill = activeSkills[index];
        if (!skill) continue;
        const localX = panelPad + index * (slotW + gap); const localY = panelPad;
        const ready = Boolean(readyMask & (1 << index));
        baseContext.fillStyle = ready ? "rgba(11,9,24,0.85)" : "rgba(11,9,24,0.65)";
        baseContext.beginPath(); baseContext.roundRect(localX, localY, slotW, slotW, 6); baseContext.fill();
        baseContext.strokeStyle = ready ? skill.color : "rgba(132,105,202,0.25)"; baseContext.lineWidth = ready ? 2 : 1;
        baseContext.beginPath(); baseContext.roundRect(localX, localY, slotW, slotW, 6); baseContext.stroke();
        baseContext.fillStyle = ready ? skill.color : "rgba(205,197,220,0.25)"; baseContext.font = "600 17px Inter, sans-serif";
        baseContext.fillText(skill.symbol, localX + slotW / 2, localY + slotW / 2 + 1);
        baseContext.fillStyle = "rgba(255,255,255,0.5)"; baseContext.font = "700 9px Inter, sans-serif";
        baseContext.fillText(`[${index + 1}]`, localX + slotW / 2, localY + slotW - 4);
        baseContext.fillStyle = ready ? "rgba(255,255,255,0.65)" : "rgba(205,197,220,0.25)"; baseContext.font = "500 8px Inter, sans-serif";
        baseContext.fillText(skill.name, localX + slotW / 2, localY + slotW + 12);
        baseContext.fillStyle = ready ? "rgba(255,255,255,0.35)" : "rgba(205,197,220,0.15)"; baseContext.font = "400 7px Inter, sans-serif";
        baseContext.fillText(`${skill.energyCost} EN`, localX + slotW / 2, localY + slotW + 22);
      }
      skillHudBaseCache.set(cacheKey, base);
    }

    ctx.drawImage(base, startX - panelPad, y - panelPad, panelWidth, panelHeight);
    ctx.save(); ctx.textAlign = "center";
    for (let index = 0; index < activeSkills.length; index += 1) {
      const skill = activeSkills[index];
      if (!skill) continue;
      const x = startX + index * (slotW + gap); const cooldown = skillCooldowns[index];
      if (cooldown > 0) {
        const ratio = cooldown / skill.cooldown;
        ctx.fillStyle = `rgba(255,79,216,${0.2 * ratio})`;
        ctx.beginPath(); ctx.roundRect(x, y + slotW * (1 - ratio), slotW, slotW * ratio, [0, 0, 6, 6]); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "600 11px Inter, sans-serif";
        ctx.fillText(`${cooldown.toFixed(1)}`, x + slotW / 2, y + slotW / 2 + 12);
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
        appendIndexedMote(mote);
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
      showToast(`INIMIGO ELIMINADO // ${bot.name}`, 1200);
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
        "tremor-deep": { motes: 24, bonusScore: 200, toast: "TREMOR DERROTADO // RECOMPENSA COLETADA" },
        "necrostro": { motes: 18, bonusScore: 160, toast: "O NECRÓSTRO RETORNA AO SILÊNCIO // RECOMPENSA COLETADA" },
        "vortice": { motes: 20, bonusScore: 190, toast: "VÓRTICE DERROTADO // RECOMPENSA COLETADA" },
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
          appendIndexedMote(mote);
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
    showToast("DESTRUA A ÂNCORA PARA RECUPERAR SEUS BÔNUS", 2800);
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
        showToast(permanent ? "BÔNUS BLOQUEADOS — DESTRUA A ÂNCORA" : "BÔNUS DESATIVADOS TEMPORARIAMENTE", 2200);
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
    const fresh = createBot(Math.floor(Math.random() * names.length), { classId: bot.classId });
    Object.assign(bot, fresh, { id: bot.id });
  }

  function spawnWave(x, y, hue, maxRadius = 70, life = 0.5) {
    waves.push({ x, y, radius: 10, maxRadius, life, maxLife: life, hue, width: 2 });
  }

  function spawnParticle(x, y, hue, speed = 100, life = 0.5) {
    const density = clamp(Number(preparation?.settings?.particles ?? 100) / 100, 0.2, 1);
    const maxParticles = Math.round((MOBILE_QUALITY ? 35 : 200) * density);
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
    const density = clamp(Number(preparation?.settings?.particles ?? 100) / 100, 0.2, 1);
    const limit = Math.ceil((MOBILE_QUALITY ? count * 0.3 : count) * density);
    for (let i = 0; i < limit; i += 1) spawnParticle(x, y, hue, random(80, 260), random(0.28, 0.8));
  }

  function worldTarget() {
    const sensitivity = clamp(Number(preparation?.settings?.sensitivity ?? 100) / 100, 0.5, 1.5);
    let tx = camera.x + (pointer.x - width / 2) * sensitivity / camera.zoom;
    let ty = camera.y + (pointer.y - height / 2) * sensitivity / camera.zoom;
    if (joystick && joystick.active && (joystick.dx !== 0 || joystick.dy !== 0)) {
      const joyScale = 180;
      tx = player.x + joystick.dx * joyScale;
      ty = player.y + joystick.dy * joyScale;
    }
    return { x: tx, y: ty };
  }

  function updatePlayer(dt) {
    updateLevelProgression(player, dt);
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.hitTimer = Math.max(0, player.hitTimer - dt);
    if (!player.phasing && player.hitTimer <= 0 && player.health < player.maxHealth) {
      const baseRegen = 1.15;
      const upgradeRegen = playerUpgrades.regeneration * 0.3;
      player.health = Math.min(player.maxHealth, player.health + (baseRegen + upgradeRegen) * dt);
    }
    player.comboTimer -= dt;
    if (player.comboTimer <= 0) player.combo = 0;

    if (player.skinId === "arco-iris") player.hue = (runTime * 52) % 360;

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
      const growthSpeed = (player.levelSpeedScale || 1) * (player.rareBoostTimer > 0 ? 1.06 : 1);
      const classSpeed = player.moveSpeed || 205;
      const aimingScale = player.classId === "marksman" && player.classCharging ? 0.58 : 1;
      steerVelocity(player, target.x, target.y, classSpeed * growthSpeed * aimingScale, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.energy = Math.min(player.maxEnergy, player.energy + 13 * dt);
      collectMotes(player, false);
    }

    resolveEntityOverlap();
  }

  function collectMotes(entity, spectral) {
    const maximumRange = (spectral ? 16 : player.radius) + 10 + player.pickupRadius * (spectral ? (player.phasePickupBonus || 1) : 1);
    const nearbyMotes = [...queryMotes(entity.x, entity.y, maximumRange)];
    for (const mote of nearbyMotes) {
      const range = (spectral ? 16 : player.radius) + mote.radius + 5 + player.pickupRadius * (spectral ? (player.phasePickupBonus || 1) : 1);
      if (distanceSq(entity.x, entity.y, mote.x, mote.y) > range * range) continue;
      const baseValue = mote.type === "gold" ? 7 : mote.type === "red" ? 10 : mote.type === "violet" ? 3 : 1;
      const spectralMultiplier = spectral ? 0.72 : 1;
      player.score += baseValue * spectralMultiplier * (player.scoreMultiplier || 1);
      grantClassExperience(baseValue * (spectral ? 0.65 : 1));
      if (player.classId === "loader") {
        if (mote.type === "violet") player.violetAmmo = Math.min(4, (player.violetAmmo || 0) + 1);
        else player.blueAmmo = Math.min(8, (player.blueAmmo || 0) + 1);
        player.classResource = (player.blueAmmo || 0) + (player.violetAmmo || 0);
      }
      player.energy = clamp(player.energy + baseValue * (spectral ? 1.5 : 0.8), 0, player.maxEnergy);
      if (mote.type === "violet") {
        player.rareBoostTimer = LEVEL_CONFIG.rareBoostDuration;
        player.rareBoostMultiplier = LEVEL_CONFIG.rareBoostMultiplier;
      }
      gainExperience(player, experienceValueForMote(mote.type, spectral), `mote:${mote.type}`);
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
      replaceCollectedMote(mote);
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
          bot.speed = bot.baseSpeed * 1.4 * (bot.levelSpeedScale || 1);
          bot.attackDamage = Math.ceil((bot.baseAttackDamage || definition.attackDamage) * 1.5);
        } else {
          bot.speed = bot.baseSpeed * (bot.levelSpeedScale || 1);
          bot.attackDamage = bot.baseAttackDamage || definition.attackDamage;
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
        bot.speed = bot.baseSpeed * (bot.levelSpeedScale || 1) * (1 + Math.min(0.3, nearbyPack * 0.1));
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
      const classHandled = updateBotClassAi(bot, dt);
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

      if (!classHandled && behavior.phaseAttack !== false && !bot.stealthed && !(bot.boss && bot.bossPhaseTransitioning)) {
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
    const nearbyMotes = queryMotes(bot.x, bot.y, bot.radius + 8);
    for (const mote of nearbyMotes) {
      const range = bot.radius + mote.radius + 3;
      if (distanceSq(bot.x, bot.y, mote.x, mote.y) < range * range) {
        const scoreValue = mote.type === "gold" ? 5 : mote.type === "red" ? 4 : mote.type === "violet" ? 2 : 1;
        bot.score += scoreValue;
        bot.energy = Math.min(100, bot.energy + (mote.type === "violet" ? 7 : 2));
        if (mote.type === "violet") {
          bot.rareBoostTimer = LEVEL_CONFIG.rareBoostDuration;
          bot.rareBoostMultiplier = LEVEL_CONFIG.rareBoostMultiplier;
        }
        gainExperience(bot, experienceValueForMote(mote.type), `mote:${mote.type}`);
        replaceCollectedMote(mote);
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

  function setTextIfChanged(node, value) {
    const text = String(value);
    if (node && node.textContent !== text) node.textContent = text;
  }

  function setStyleIfChanged(node, property, value) {
    if (node && node.style[property] !== value) node.style[property] = value;
  }

  function setCustomPropertyIfChanged(node, property, value) {
    if (node && node.style.getPropertyValue(property) !== value) node.style.setProperty(property, value);
  }

  function toggleClassIfChanged(node, className, enabled) {
    if (node && node.classList.contains(className) !== enabled) node.classList.toggle(className, enabled);
  }

  function updateHud() {
    const energy = Math.round(player.energy || 0);
    const health = Math.max(0, Math.round(player.health || 0));
    const healthPercent = `${Math.round(clamp(player.health, 0, player.maxHealth || 100) / (player.maxHealth || 100) * 1000) / 10}%`;
    const energyPercent = `${Math.round(clamp(player.energy, 0, player.maxEnergy || 100) / (player.maxEnergy || 100) * 1000) / 10}%`;
    setTextIfChanged(ui.score, Math.floor(player.score || 0).toString().padStart(3, "0"));
    setTextIfChanged(ui.kills, player.kills || 0);
    setTextIfChanged(ui.time, formatTime(activeMode === "multiplayer" ? multiplayerRemaining : runTime));
    setTextIfChanged(ui.integrity, health);
    setStyleIfChanged(ui.integrityFill, "width", healthPercent);
    setTextIfChanged(ui.charge, `${energy}%`);
    setStyleIfChanged(ui.chargeFill, "width", energyPercent);
    setCustomPropertyIfChanged(ui.abilityRing, "--charge", energyPercent);
    updateClassHud();

    if (activeMode === "multiplayer") {
      const pingLabel = networkPingMs > 0 ? ` // PING ${Math.round(networkPingMs)} ms` : "";
      setTextIfChanged(ui.sector, `SALA ${multiplayerRoomCode} // ${formatTime(multiplayerRemaining)}${pingLabel}`);
    } else {
      const sectorX = clamp(Math.floor(player.x / (WORLD_SIZE / 3)), 0, 2);
      const sectorY = clamp(Math.floor(player.y / (WORLD_SIZE / 3)), 0, 2);
      setTextIfChanged(ui.sector, sectorNames[sectorY * 3 + sectorX]);
    }
    const combo = player.combo || 0;
    setTextIfChanged(ui.comboValue, Math.max(2, combo));
    toggleClassIfChanged(ui.combo, "is-visible", activeMode === "solo" && combo >= 5 && player.comboTimer > 0);

    if (MOBILE_QUALITY) {
      setTextIfChanged(ui.mobileScoreValue, Math.floor(player.score || 0));
      setTextIfChanged(ui.mobileKillsValue, player.kills || 0);
      setTextIfChanged(ui.mobileTimeValue, formatTime(runTime));
      if (ui.mobileSkillButtons) {
        const btns = ui.mobileSkillButtons.querySelectorAll(".mobile-skill-btn");
        btns.forEach((btn, i) => {
          const skill = activeSkills[i];
          const cd = skillCooldowns[i];
          const ready = skill && cd <= 0 && player.energy >= skill.energyCost;
          btn.classList.toggle("is-ready", ready);
          btn.classList.toggle("is-cooldown", cd > 0);
          if (skill) {
            btn.style.setProperty("--skill-color", skill.color);
            const icon = btn.querySelector(".ms-skill-icon");
            if (icon && icon.textContent !== skill.symbol) icon.textContent = skill.symbol;
          }
        });
      }
    }

    if (leaderboardTimer <= 0) updateChallengePanel();

    if (activeBoss && !activeBoss.dead) {
      toggleClassIfChanged(ui.bossBar, "is-hidden", false);
      const activePhase = activeBoss.bossTemplate?.phases?.[activeBoss.bossPhaseIndex];
      const mechanic = activePhase?.description?.replace(/^Fase \d+\s*—\s*/, "").toUpperCase();
      setTextIfChanged(ui.bossRole, mechanic ? `${activeBoss.roleLabel} // ${mechanic}` : activeBoss.roleLabel);
      setTextIfChanged(ui.bossName, activeBoss.name);
      const bossHpRatio = clamp(activeBoss.health, 0, activeBoss.maxHealth) / activeBoss.maxHealth;
      setStyleIfChanged(ui.bossHpFill, "width", `${Math.round(bossHpRatio * 1000) / 10}%`);
      if (activeBoss.bossPhaseTransitioning) {
        setStyleIfChanged(ui.bossHpFill, "background", `linear-gradient(90deg, ${hsl(activeBoss.hue, 90, 64, 1)}, white)`);
      } else {
        setStyleIfChanged(ui.bossHpFill, "background", "");
      }
    } else {
      toggleClassIfChanged(ui.bossBar, "is-hidden", true);
    }
  }

  function updateClassHud() {
    if (!player?.classDefinition) return;
    const resourceMax = Math.max(1, player.classResourceMax || 1);
    const resource = clamp(player.classResource || 0, 0, resourceMax);
    setTextIfChanged(ui.hudClassName, player.className);
    setTextIfChanged(ui.hudClassLevel, preparation?.settings?.showLevel === false ? "" : `LV ${player.classLevel || 1}`);
    setTextIfChanged(ui.hudResourceName, player.classResourceName);
    setTextIfChanged(ui.hudResourceValue, `${Math.round(resource)}/${Math.round(resourceMax)}`);
    setStyleIfChanged(ui.hudResourceFill, "width", `${resource / resourceMax * 100}%`);
    setTextIfChanged(ui.hudClassSpecial, player.classDefinition.activeAbility);
    if (ui.classSpecialButton) {
      ui.classSpecialButton.disabled = classSpecialCooldown > 0;
      ui.classSpecialButton.style.setProperty("--class-color", player.classDefinition.resource.color);
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
    const target = worldTarget();
    if (player.respawnTimer <= 0 && !player.phasing) {
      steerVelocity(player, target.x, target.y, player.moveSpeed || 205, dt, 6.1);
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    }
    const localError = Math.hypot((player.networkX || player.x) - player.x, (player.networkY || player.y) - player.y);
    const localBlend = localError > 180 ? 1 : 1 - Math.exp(-9 * dt);
    if (Number.isFinite(player.networkX)) player.x = lerp(player.x, player.networkX, localBlend);
    if (Number.isFinite(player.networkY)) player.y = lerp(player.y, player.networkY, localBlend);
    const remoteBlend = 1 - Math.exp(-22 * dt);
    for (const entity of bots) {
      if (Number.isFinite(entity.networkX)) entity.x = lerp(entity.x, entity.networkX, remoteBlend);
      if (Number.isFinite(entity.networkY)) entity.y = lerp(entity.y, entity.networkY, remoteBlend);
      if (Number.isFinite(entity.networkVx)) entity.vx = lerp(entity.vx || 0, entity.networkVx, remoteBlend);
      if (Number.isFinite(entity.networkVy)) entity.vy = lerp(entity.vy || 0, entity.networkVy, remoteBlend);
    }
    networkInputTimer -= dt;
    if (networkInputTimer <= 0 && multiplayerSocket?.readyState === WebSocket.OPEN) {
      networkInputTimer = 1 / 30;
      if (multiplayerSocket.bufferedAmount < 16_384) {
        networkInputSequence += 1;
        multiplayerSocket.send(JSON.stringify({ type: "input", sequence: networkInputSequence, targetX: target.x, targetY: target.y, moteRevision: multiplayerMoteRevision }));
      }
    }
    networkPingTimer -= dt;
    if (networkPingTimer <= 0 && multiplayerSocket?.readyState === WebSocket.OPEN) {
      networkPingTimer = 1;
      multiplayerSocket.send(JSON.stringify({ type: "ping", clientTime: performance.now() }));
    }
    updateEffects(dt);
    updateCamera(dt);
    updateHud();
  }

  function update(dt) {
    if (state !== "playing") return;
    if (activeMode === "multiplayer") {
      classSpecialCooldown = Math.max(0, classSpecialCooldown - dt);
      updateMultiplayer(dt);
      return;
    }
    runTime += dt;
    runStats.runTime = runTime;
    updatePlayer(dt);
    updateClassCombat(dt);
    updateBotProgression(dt);
    updateBots(dt);
    updateSkills(dt);
    if (activeMode !== "training") updateSoloDirector();
    updateEffects(dt);
    updateCamera(dt);
    musicUpdateTimer -= dt;
    if (musicUpdateTimer <= 0) {
      musicUpdateTimer = 0.08;
      updateMusic();
    }
    hudUpdateTimer -= dt;
    if (hudUpdateTimer <= 0) {
      hudUpdateTimer = PERFORMANCE_PROFILE.hudInterval;
      updateHud();
      updateLevelHud();
    }
    leaderboardTimer -= dt;
    if (leaderboardTimer <= 0) {
      leaderboardTimer = 0.7;
      updateLeaderboard();
    }
  }

  let backgroundGradient = null;

  function toScreen(x, y) {
    return {
      x: (x - camera.x) * camera.zoom + width / 2,
      y: (y - camera.y) * camera.zoom + height / 2
    };
  }

  function visible(x, y, padding = 80) {
    const pointX = (x - camera.x) * camera.zoom + width / 2;
    const pointY = (y - camera.y) * camera.zoom + height / 2;
    return pointX > -padding && pointX < width + padding && pointY > -padding && pointY < height + padding;
  }

  function drawBackground(time) {
    if (!backgroundGradient) {
      backgroundGradient = ctx.createRadialGradient(width * 0.52, height * 0.48, 0, width * 0.52, height * 0.48, Math.max(width, height) * 0.72);
      backgroundGradient.addColorStop(0, "#0d0920");
      backgroundGradient.addColorStop(0.52, "#080612");
      backgroundGradient.addColorStop(1, "#03030a");
    }
    ctx.fillStyle = backgroundGradient;
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
      const pointX = (seed.x - camera.x) * camera.zoom + width / 2;
      const pointY = (seed.y - camera.y) * camera.zoom + height / 2;
      const pulse = 0.65 + Math.sin(time * 0.0007 + seed.x) * 0.25;
      ctx.fillStyle = hsl(seed.hue, 75, 70, seed.alpha * pulse);
      ctx.beginPath();
      ctx.arc(pointX, pointY, seed.radius * camera.zoom, 0, TAU);
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
      const leftEdgeVisible = topLeft.x < width && topLeft.x + 130 > 0
        && bottomRight.y > 0 && topLeft.y < height;
      if (leftEdgeVisible) {
        const edgeGradient = ctx.createLinearGradient(topLeft.x, 0, topLeft.x + 130, 0);
        edgeGradient.addColorStop(0, "rgba(255, 50, 130, 0.08)");
        edgeGradient.addColorStop(1, "rgba(255, 50, 130, 0)");
        ctx.fillStyle = edgeGradient;
        ctx.fillRect(topLeft.x, Math.max(0, topLeft.y), 130, Math.min(height, bottomRight.y) - Math.max(0, topLeft.y));
      }
    }
    ctx.restore();
  }

  const scarSpriteCache = new Map();

  function scarSprite(scar) {
    const radius = Math.max(1, Math.round(scar.radius));
    const hue = Math.round(scar.hue);
    const key = `${hue}:${radius}`;
    const cached = scarSpriteCache.get(key);
    if (cached) return cached;
    const padding = 4;
    const extent = radius + padding;
    const sprite = document.createElement("canvas");
    sprite.width = extent * 4;
    sprite.height = extent * 4;
    const spriteContext = sprite.getContext("2d");
    spriteContext.setTransform(2, 0, 0, 2, extent * 2, extent * 2);
    const gradient = spriteContext.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, hsl(hue, 85, 55, 1));
    gradient.addColorStop(0.35, hsl(hue, 80, 40, 0.45));
    gradient.addColorStop(1, hsl(hue, 80, 35, 0));
    spriteContext.fillStyle = gradient;
    spriteContext.beginPath();
    spriteContext.arc(0, 0, radius, 0, TAU);
    spriteContext.fill();
    spriteContext.strokeStyle = hsl(hue, 85, 65, 0.75);
    spriteContext.lineWidth = 1;
    spriteContext.beginPath();
    for (let index = 0; index < 5; index += 1) {
      const angle = index * TAU / 5;
      spriteContext.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
      spriteContext.lineTo(Math.cos(angle + 0.18) * radius, Math.sin(angle + 0.18) * radius);
    }
    spriteContext.stroke();
    const result = { canvas: sprite, extent };
    scarSpriteCache.set(key, result);
    return result;
  }

  function drawScars() {
    if (scars.length === 0) return;
    if (!MOBILE_QUALITY) {
      ctx.save();
      ctx.strokeStyle = hsl(350, 88, 58, 0.14);
      ctx.lineWidth = 1;
      ctx.beginPath();
      let previousWoundX = null;
      let previousWoundY = null;
      for (const wound of scars) {
        if (!wound.wound || wound.life <= 0 || !visible(wound.x, wound.y, wound.radius)) continue;
        const woundX = (wound.x - camera.x) * camera.zoom + width / 2;
        const woundY = (wound.y - camera.y) * camera.zoom + height / 2;
        if (previousWoundX != null) {
          ctx.moveTo(previousWoundX, previousWoundY);
          ctx.lineTo(woundX, woundY);
        }
        previousWoundX = woundX;
        previousWoundY = woundY;
      }
      ctx.stroke();
      ctx.restore();
    }
    for (const scar of scars) {
      if (!visible(scar.x, scar.y, scar.radius)) continue;
      const alpha = clamp(scar.life / scar.maxLife, 0, 1) * 0.24;
      const pointX = (scar.x - camera.x) * camera.zoom + width / 2;
      const pointY = (scar.y - camera.y) * camera.zoom + height / 2;
      const sprite = scarSprite(scar);
      const displayExtent = sprite.extent * camera.zoom;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(pointX, pointY);
      ctx.rotate(scar.x);
      ctx.drawImage(sprite.canvas, -displayExtent, -displayExtent, displayExtent * 2, displayExtent * 2);
      ctx.restore();
    }
  }

  const moteVisuals = Object.freeze({
    cyan: Object.freeze({ hue: 188, fill: hsl(188, 95, 68, 0.88), shadow: hsl(188, 90, 65, 0.9), blur: 9 }),
    violet: Object.freeze({ hue: 268, fill: hsl(268, 95, 68, 0.88), shadow: hsl(268, 90, 65, 0.9), blur: 9 }),
    gold: Object.freeze({ hue: 42, fill: hsl(42, 95, 68, 0.88), shadow: hsl(42, 90, 65, 0.9), blur: 15 }),
    red: Object.freeze({ hue: 0, fill: hsl(0, 95, 55, 0.88), shadow: hsl(0, 90, 50, 0.9), blur: 18 })
  });

  function drawMotes(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    let previousMoteType = null;
    for (const mote of motes) {
      if (!visible(mote.x, mote.y, 20)) continue;
      const pointX = (mote.x - camera.x) * camera.zoom + width / 2;
      const pointY = (mote.y - camera.y) * camera.zoom + height / 2;
      const pulse = 0.78 + Math.sin(time * 0.002 * mote.drift + mote.phase) * 0.22;
      const visual = moteVisuals[mote.type] || moteVisuals.cyan;
      const hue = visual.hue;
      const radius = mote.radius * pulse * camera.zoom;
      if (previousMoteType !== mote.type) {
        if (!MOBILE_QUALITY) {
          ctx.shadowColor = visual.shadow;
          ctx.shadowBlur = visual.blur;
        } else {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = visual.fill;
        previousMoteType = mote.type;
      }
      ctx.beginPath();
      ctx.arc(pointX, pointY, radius, 0, TAU);
      ctx.fill();
      if (!MOBILE_QUALITY && mote.type === "gold") {
        ctx.strokeStyle = hsl(hue, 90, 72, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointX, pointY, radius + 5 + pulse * 2, 0, TAU);
        ctx.stroke();
      }
      if (mote.type === "red" && !MOBILE_QUALITY) {
        const warnPulse = 0.5 + Math.sin(time * 0.006 + mote.phase) * 0.5;
        ctx.strokeStyle = hsl(0, 95, 55, 0.55 * warnPulse);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pointX, pointY, radius + 6 + pulse * 3, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = hsl(30, 90, 60, 0.3 * warnPulse);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointX, pointY, radius + 12 + pulse * 5, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawRibbon(ribbon, active = false, hueOverride = null, widthOverride = null) {
    if (ribbon.points.length < 2) return;
    const ribbonHue = hueOverride ?? ribbon.hue;
    const ribbonWidth = widthOverride ?? ribbon.width;
    const alpha = active ? 0.75 : clamp(ribbon.life / ribbon.maxLife, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(ribbonHue, 90, 60, 0.8);
      ctx.shadowBlur = active ? 18 : 12;
    }
    const lifeRatio = active ? 1 : clamp(ribbon.life / ribbon.maxLife, 0, 1);
    const taperWidth = ribbonWidth * (0.35 + lifeRatio * 0.65);
    ctx.beginPath();
    ribbon.points.forEach((point, index) => {
      const screen = toScreen(point.x, point.y);
      if (index === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    });
    if (MOBILE_QUALITY) {
      ctx.strokeStyle = hsl(ribbonHue, 94, 64, alpha * 0.8);
      ctx.lineWidth = taperWidth * 1.4 * camera.zoom;
      ctx.stroke();
    } else {
      ctx.strokeStyle = hsl(ribbonHue, 94, 64, alpha * 0.22);
      ctx.lineWidth = taperWidth * 2.8 * camera.zoom;
      ctx.stroke();
      ctx.strokeStyle = hsl(ribbonHue, 95, 74, alpha * 0.78);
      ctx.lineWidth = taperWidth * 0.7 * camera.zoom;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.65})`;
      ctx.lineWidth = 1.2 * camera.zoom;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayerSkin(entity, radius, renderHue, time) {
    const skin = skins.find((entry) => entry.id === entity.skinId) || skins[0];
    const style = skin?.style || "electric";
    const motion = time * 0.001;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.rotate(motion * 0.72);
    if (style === "electric") {
      ctx.strokeStyle = hsl(renderHue, 98, 76, 0.82); ctx.lineWidth = 1.8;
      for (let side = 0; side < 2; side += 1) {
        ctx.beginPath();
        for (let step = 0; step <= 5; step += 1) {
          const angle = side * Math.PI + step * 0.24 - 0.62;
          const reach = radius * (1.3 + (step % 2) * 0.18);
          const x = Math.cos(angle) * reach; const y = Math.sin(angle) * reach;
          if (step === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (style === "violet") {
      for (let band = 0; band < 3; band += 1) {
        ctx.rotate(TAU / 3); ctx.strokeStyle = hsl(renderHue + band * 8, 92, 74, 0.6); ctx.lineWidth = 1.4 + band * 0.35;
        ctx.beginPath(); ctx.arc(0, 0, radius * (1.25 + band * 0.14), -0.85, 0.88); ctx.stroke();
      }
    } else if (style === "ember") {
      ctx.strokeStyle = hsl(renderHue, 98, 68, 0.78); ctx.lineWidth = 2;
      for (let flame = 0; flame < 5; flame += 1) {
        const angle = flame * TAU / 5;
        ctx.save(); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(radius * 0.85, 0);
        ctx.quadraticCurveTo(radius * 1.35, -radius * 0.5, radius * (1.65 + Math.sin(motion * 5 + flame) * 0.12), 0);
        ctx.quadraticCurveTo(radius * 1.28, radius * 0.18, radius * 0.85, 0); ctx.stroke(); ctx.restore();
      }
    } else if (style === "champion") {
      ctx.strokeStyle = hsl(renderHue, 98, 75, 0.84); ctx.fillStyle = hsl(renderHue, 98, 72, 0.9); ctx.lineWidth = 1.7;
      ctx.beginPath(); ctx.moveTo(-radius * 0.72, -radius * 1.12); ctx.lineTo(-radius * 0.38, -radius * 1.62);
      ctx.lineTo(0, -radius * 1.18); ctx.lineTo(radius * 0.38, -radius * 1.62); ctx.lineTo(radius * 0.72, -radius * 1.12); ctx.stroke();
      for (let spark = 0; spark < 3; spark += 1) { ctx.beginPath(); ctx.arc((spark - 1) * radius * 0.55, -radius * (1.45 + (spark % 2) * 0.22), 1.8, 0, TAU); ctx.fill(); }
    } else if (style === "ice") {
      ctx.strokeStyle = hsl(renderHue, 96, 84, 0.8); ctx.lineWidth = 1.35;
      for (let shard = 0; shard < 6; shard += 1) {
        ctx.rotate(TAU / 6); ctx.beginPath(); ctx.moveTo(radius * 0.82, 0); ctx.lineTo(radius * 1.62, -radius * 0.2); ctx.lineTo(radius * 1.42, radius * 0.22); ctx.closePath(); ctx.stroke();
      }
    } else if (style === "shadow") {
      ctx.strokeStyle = hsl(renderHue, 88, 66, 0.5); ctx.lineWidth = 2;
      for (let wisp = 0; wisp < 4; wisp += 1) {
        ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(radius * 0.72, 0);
        ctx.bezierCurveTo(radius * 1.1, -radius * 0.7, radius * 1.7, radius * 0.35, radius * 1.9, -radius * 0.18); ctx.stroke();
      }
    } else if (style === "prism") {
      for (let color = 0; color < 7; color += 1) {
        const angle = color * TAU / 7; const orbit = radius * (1.35 + 0.12 * Math.sin(motion * 4 + color));
        ctx.fillStyle = hsl((time * 0.05 + color * 51) % 360, 96, 70, 0.9);
        ctx.beginPath(); ctx.arc(Math.cos(angle) * orbit, Math.sin(angle) * orbit, 2.2 + color % 2, 0, TAU); ctx.fill();
      }
    } else if (style === "pearl") {
      ctx.strokeStyle = "rgba(232,244,255,.78)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, radius * 1.45, -2.6, -0.2); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let bead = 0; bead < 4; bead += 1) { const angle = bead * TAU / 4; ctx.beginPath(); ctx.arc(Math.cos(angle) * radius * 1.34, Math.sin(angle) * radius * 1.34, 1.8, 0, TAU); ctx.fill(); }
    } else if (style === "eclipse") {
      ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = "rgba(165,132,255,.58)"; ctx.lineWidth = 2.2; ctx.setLineDash([radius * 0.65, radius * 0.25]);
      ctx.beginPath(); ctx.arc(0, 0, radius * 1.48, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(3,2,8,.55)"; ctx.beginPath(); ctx.arc(radius * 0.18, -radius * 0.08, radius * 0.78, 0, TAU); ctx.fill();
    } else if (style === "toxic") {
      ctx.strokeStyle = hsl(renderHue, 94, 70, 0.72); ctx.fillStyle = hsl(renderHue, 92, 64, 0.46); ctx.lineWidth = 1.2;
      for (let bubble = 0; bubble < 6; bubble += 1) {
        const angle = bubble * TAU / 6; const orbit = radius * (1.22 + (bubble % 3) * 0.2); const size = 2 + (bubble % 3);
        ctx.beginPath(); ctx.arc(Math.cos(angle) * orbit, Math.sin(angle) * orbit, size, 0, TAU); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  const entityGradientSprites = new Map();

  function cacheEntityGradientSprite(key, create) {
    const cached = entityGradientSprites.get(key);
    if (cached) return cached;
    const sprite = create();
    if (entityGradientSprites.size >= 96) entityGradientSprites.delete(entityGradientSprites.keys().next().value);
    entityGradientSprites.set(key, sprite);
    return sprite;
  }

  function entityAuraSprite(hue, spectral) {
    const key = `aura:${Number(hue).toFixed(2)}:${spectral ? 1 : 0}`;
    return cacheEntityGradientSprite(key, () => {
      const logicalSize = 144;
      const sprite = document.createElement("canvas");
      sprite.width = logicalSize * 2;
      sprite.height = logicalSize * 2;
      const spriteContext = sprite.getContext("2d");
      spriteContext.scale(2, 2);
      const center = logicalSize / 2;
      const radius = logicalSize / 2;
      const gradient = spriteContext.createRadialGradient(center, center, radius * 0.048, center, center, radius);
      gradient.addColorStop(0, hsl(hue, 95, 72, spectral ? 0.42 : 0.34));
      gradient.addColorStop(0.35, hsl(hue, 85, 55, spectral ? 0.14 : 0.1));
      gradient.addColorStop(1, hsl(hue, 80, 40, 0));
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, logicalSize, logicalSize);
      return sprite;
    });
  }

  function entityLowHealthAuraSprite(hue) {
    const key = `aura-low:${Number(hue).toFixed(2)}`;
    return cacheEntityGradientSprite(key, () => {
      const logicalSize = 144;
      const sprite = document.createElement("canvas");
      sprite.width = logicalSize * 2;
      sprite.height = logicalSize * 2;
      const spriteContext = sprite.getContext("2d");
      spriteContext.scale(2, 2);
      const center = logicalSize / 2;
      const radius = logicalSize / 2;
      const gradient = spriteContext.createRadialGradient(center, center, radius * 0.048, center, center, radius);
      gradient.addColorStop(0, hsl(0, 95, 55, 0.42));
      gradient.addColorStop(0.35, hsl(0, 85, 55, 0.1));
      gradient.addColorStop(1, hsl(0, 80, 40, 0));
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, logicalSize, logicalSize);
      return sprite;
    });
  }

  function entityCoreSprite(hue, spectral) {
    const key = `core:${Number(hue).toFixed(2)}:${spectral ? 1 : 0}`;
    return cacheEntityGradientSprite(key, () => {
      const logicalSize = 144;
      const sprite = document.createElement("canvas");
      sprite.width = logicalSize * 2;
      sprite.height = logicalSize * 2;
      const spriteContext = sprite.getContext("2d");
      spriteContext.scale(2, 2);
      const center = logicalSize / 2;
      const radius = 64;
      const gradient = spriteContext.createRadialGradient(center - radius * 0.25, center - radius * 0.3, 0, center, center, radius);
      gradient.addColorStop(0, spectral ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.92)");
      gradient.addColorStop(0.2, hsl(hue, 95, 75, spectral ? 0.75 : 0.95));
      gradient.addColorStop(0.72, hsl(hue, 85, 45, spectral ? 0.23 : 0.68));
      gradient.addColorStop(1, hsl(hue, 85, 35, 0.08));
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, logicalSize, logicalSize);
      return sprite;
    });
  }

  function drawEntity(entity, isPlayer = false, spectral = false, time = 0, override = null) {
    const renderX = override?.x ?? entity.x;
    const renderY = override?.y ?? entity.y;
    if (!visible(renderX, renderY, 70)) return;
    const point = toScreen(renderX, renderY);
    const radius = (entity.radius || 16) * camera.zoom * (spectral ? 0.85 : 1);
    const healthRatio = clamp(entity.health / (entity.maxHealth || 100), 0, 1);
    const pulse = 1 + Math.sin(time * 0.004 + entity.x) * 0.035;
    const isLowHealth = !isPlayer && !spectral && healthRatio < 0.3 && healthRatio > 0;
    const renderHue = isPlayer && entity.skinId === "arco-iris" ? (time * 0.05) % 360 : entity.hue;
    const glow = isPlayer ? entity.skinGlow || 1 : 1;
    const cacheGradient = !(isPlayer && entity.skinId === "arco-iris");

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
    const entityAlpha = override?.alpha ?? entity.alpha;
    if (entityAlpha != null) ctx.globalAlpha = entityAlpha;
    ctx.translate(point.x, point.y);
    ctx.globalCompositeOperation = "lighter";
    if (!MOBILE_QUALITY) {
      ctx.shadowColor = hsl(renderHue, 90, 62, spectral ? 0.9 : 0.65);
      ctx.shadowBlur = (spectral ? 24 : 16) * glow;
    }

    if (!MOBILE_QUALITY) {
      const auraRadius = (isLowHealth ? radius * 2.8 : radius * 2.1) * glow;
      if (cacheGradient) {
        const auraSprite = isLowHealth ? entityLowHealthAuraSprite(renderHue) : entityAuraSprite(renderHue, spectral);
        ctx.drawImage(auraSprite, -auraRadius, -auraRadius, auraRadius * 2, auraRadius * 2);
      } else {
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
      ctx.beginPath();
      for (let index = 0; index <= 18; index += 1) {
        const angle = index / 18 * TAU;
        const distortion = 1 + Math.sin(angle * 3 + time * 0.003 + entity.x) * 0.07;
        const x = Math.cos(angle) * radius * distortion;
        const y = Math.sin(angle) * radius * distortion;
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (cacheGradient) {
        ctx.save();
        ctx.clip();
        const coreExtent = radius * 1.125;
        ctx.drawImage(entityCoreSprite(renderHue, spectral), -coreExtent, -coreExtent, coreExtent * 2, coreExtent * 2);
        ctx.restore();
      } else {
        const coreGradient = ctx.createRadialGradient(-radius * 0.25, -radius * 0.3, 0, 0, 0, radius);
        coreGradient.addColorStop(0, spectral ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.92)");
        coreGradient.addColorStop(0.2, hsl(renderHue, 95, 75, spectral ? 0.75 : 0.95));
        coreGradient.addColorStop(0.72, hsl(renderHue, 85, 45, spectral ? 0.23 : 0.68));
        coreGradient.addColorStop(1, hsl(renderHue, 85, 35, 0.08));
        ctx.fillStyle = coreGradient;
        ctx.fill();
      }
    } else {
      ctx.fillStyle = hsl(renderHue, 85, 50, spectral ? 0.5 : 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.fill();
    }

    if (!MOBILE_QUALITY && isPlayer && !spectral) drawPlayerSkin(entity, radius, renderHue, time);

    if (!isPlayer && !spectral && entity.faction != null && !entity.boss && !entity.bossClone) {
      const factionHues = [15, 200, 280];
      ctx.strokeStyle = hsl(factionHues[entity.faction] || renderHue, 88, 62, 0.34);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, -Math.PI * 0.75, Math.PI * 0.15);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    if (!MOBILE_QUALITY) {
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(-radius * 0.18, -radius * 0.2, Math.max(1.4, radius * 0.12), 0, TAU);
      ctx.fill();
    }
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
      if (!MOBILE_QUALITY && !isPlayer && (healthRatio < 0.99 || entity.boss)) {
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

  const mutationRenderById = new Map(mutations.map((mutation) => [mutation.id, mutation]));

  function drawEfficientArchetypeSignature(bot, time) {
    const hasBossSignature = bot.boss && (bot.archetype === "necrostro" || bot.archetype === "vortice"
      || bot.archetype === "cicatriz" || bot.archetype === "prisma");
    const hasRegularSignature = bot.archetype === "silenciador" || bot.archetype === "bulwark"
      || (bot.archetype === "berserker" && bot.health < bot.maxHealth * 0.4);
    if (!hasBossSignature && !hasRegularSignature) return;
    const pointX = (bot.x - camera.x) * camera.zoom + width / 2;
    const pointY = (bot.y - camera.y) * camera.zoom + height / 2;
    const radius = bot.radius * camera.zoom;
    ctx.save();
    ctx.translate(pointX, pointY);
    ctx.lineWidth = 1.5;
    if (bot.archetype === "necrostro" && bot.boss) {
      ctx.strokeStyle = hsl(120, 80, 55, 0.35 + Math.sin(time * 0.003) * 0.12);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 14, 0, TAU);
      ctx.stroke();
    } else if (bot.archetype === "vortice" && bot.boss) {
      ctx.fillStyle = hsl(240, 85, 65, 0.62);
      for (let index = 0; index < 2; index += 1) {
        const angle = time * 0.002 + index * Math.PI;
        const orbit = radius + 14 + index * 8;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * orbit, Math.sin(angle) * orbit, 2.5, 0, TAU);
        ctx.fill();
      }
    } else if (bot.archetype === "cicatriz" && bot.boss) {
      ctx.strokeStyle = hsl(350, 90, 58, 0.45);
      ctx.beginPath();
      for (let index = 0; index < 3; index += 1) {
        const angle = index * TAU / 3 + time * 0.0004;
        ctx.moveTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6);
        ctx.lineTo(Math.cos(angle + 0.14) * radius * 1.75, Math.sin(angle + 0.14) * radius * 1.75);
      }
      ctx.stroke();
    } else if (bot.archetype === "prisma" && bot.boss) {
      for (let index = 0; index < 3; index += 1) {
        const angle = index * TAU / 3 + time * 0.001;
        ctx.fillStyle = hsl((time * 0.05 + index * 120) % 360, 85, 67, 0.7);
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * (radius + 10), Math.sin(angle) * (radius + 10), 2.5, 0, TAU);
        ctx.fill();
      }
    } else if (bot.archetype === "silenciador") {
      const wave = (time * 0.04) % 42;
      ctx.strokeStyle = hsl(280, 80, 65, 0.4 * (1 - wave / 42));
      ctx.beginPath();
      ctx.arc(0, 0, radius + wave, 0, TAU);
      ctx.stroke();
    } else if (bot.archetype === "berserker" && bot.health < bot.maxHealth * 0.4) {
      ctx.strokeStyle = hsl(0, 92, 62, 0.48 + Math.sin(time * 0.01) * 0.18);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 7, 0, TAU);
      ctx.stroke();
    } else if (bot.archetype === "bulwark") {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = hsl(bot.hue, 65, 62, 0.42);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 6, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawBots(time) {
    for (const bot of bots) {
      if (bot.dead) continue;
      const renderPadding = bot.boss ? Math.max(460, bot.telegraphRadius || 0) : 120;
      if (!visible(bot.x, bot.y, renderPadding)) continue;
      drawBossTelegraph(bot);
      if (MOBILE_QUALITY) drawEfficientArchetypeSignature(bot, time);
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
          const mutation = mutationRenderById.get(id);
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
        drawEntity(bot, bot.isBot === false, false, time, { alpha: 0.22 });
        continue;
      }
      if (bot.archetype === "phantom" && bot.stealthed) {
        if (bot.phasing && bot.phase) {
          drawRibbon(bot.phase, true, bot.hue, 4);
          drawEntity(bot, bot.isBot === false, true, time, { x: bot.phase.x, y: bot.phase.y, alpha: 0.3 });
        } else {
          drawEntity(bot, bot.isBot === false, false, time, { alpha: 0.25 });
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
        drawRibbon(bot.phase, true, bot.hue, 6);
        drawShell(bot, time);
        drawEntity(bot, bot.isBot === false, true, time, { x: bot.phase.x, y: bot.phase.y });
      } else {
        drawEntity(bot, bot.isBot === false, false, time);
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
      drawRibbon(player.phase, true, player.hue, 8 * (player.skinTrail || 1));
      drawShell(player, time);
      drawEntity(player, true, true, time, { x: player.phase.x, y: player.phase.y });

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
      const pointX = (wave.x - camera.x) * camera.zoom + width / 2;
      const pointY = (wave.y - camera.y) * camera.zoom + height / 2;
      const alpha = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.strokeStyle = hsl(wave.hue, 92, 68, alpha * 0.65);
      ctx.lineWidth = wave.width * alpha;
      ctx.beginPath();
      ctx.arc(pointX, pointY, wave.radius * camera.zoom, 0, TAU);
      ctx.stroke();
    }
    if (particles.length > 0) {
      for (const particle of particles) {
        if (!visible(particle.x, particle.y, 10)) continue;
        const pointX = (particle.x - camera.x) * camera.zoom + width / 2;
        const pointY = (particle.y - camera.y) * camera.zoom + height / 2;
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.fillStyle = hsl(particle.hue, 95, 70, alpha * 0.8);
        ctx.beginPath();
        ctx.arc(pointX, pointY, particle.radius * alpha * camera.zoom, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  let minimapFrame = 0;
  const MINIMAP_SIZE = MOBILE_QUALITY ? 100 : 140;
  const minimapContext = ui.minimap?.getContext("2d") || null;

  if (MOBILE_QUALITY && ui.minimap) {
    ui.minimap.width = 100;
    ui.minimap.height = 100;
  }

  function drawMinimap(time) {
    if (state !== "playing" || activeMode !== "solo") {
      toggleClassIfChanged(ui.minimap, "is-hidden", true);
      return;
    }
    toggleClassIfChanged(ui.minimap, "is-hidden", false);

    minimapFrame += 1;
    if (minimapFrame % 6 !== 0 && ui.minimap.dataset.drawn === "1") return;
    ui.minimap.dataset.drawn = "1";

    const mctx = minimapContext;
    if (!mctx) return;
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
    drawClassCombat(time);
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
    if (document.hidden) {
      previousTime = now;
      requestAnimationFrame(frame);
      return;
    }
    const elapsed = now - previousTime;
    const profileMinimum = state === "playing"
      ? PERFORMANCE_PROFILE.activeMinimumFrameMs
      : PERFORMANCE_PROFILE.idleMinimumFrameMs;
    const fpsLimit = clamp(Number(preparation?.settings?.fps || 60), 30, 120);
    const minimumFrameMs = Math.max(profileMinimum, 1000 / fpsLimit - 0.35);
    if (elapsed < minimumFrameMs) {
      requestAnimationFrame(frame);
      return;
    }
    const workStartedAt = performance.now();
    const dt = Math.min(elapsed / 1000, 0.034);
    previousTime = now;
    update(dt);
    render(now);
    updateAdaptiveResolution(elapsed, performance.now() - workStartedAt, now);
    requestAnimationFrame(frame);
  }

  function resize(force = false) {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;
    const nextDpr = targetRenderDpr();
    const pixelWidth = Math.round(nextWidth * nextDpr);
    const pixelHeight = Math.round(nextHeight * nextDpr);
    if (!force && width === nextWidth && height === nextHeight && dpr === nextDpr
      && canvas.width === pixelWidth && canvas.height === pixelHeight) return;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    backgroundGradient = null;
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
    else if (selectedMode === "training") startTrainingGame();
    else startSoloGame();
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
  if (ui.mutationLoadoutButton) ui.mutationLoadoutButton.addEventListener("click", showLoadoutScreen);
  if (ui.skillShopClose) ui.skillShopClose.addEventListener("click", closeSkillShop);
  if (ui.loadoutConfirm) ui.loadoutConfirm.addEventListener("click", () => {
    ui.loadoutScreen.classList.add("is-hidden");
    saveLoadoutToServer();
    state = "intro";
    ui.start.classList.remove("is-hidden");
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

  const joystick = {
    active: false,
    pointerId: null,
    originX: 0,
    originY: 0,
    dx: 0,
    dy: 0
  };

  if (ui.joystickZone) {
    const JOY_RADIUS = 44;
    const JOY_BASE_X = 90;
    const JOY_BASE_Y_DEFAULT = 100;

    ui.joystickZone.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      ui.joystickZone.setPointerCapture?.(event.pointerId);
      joystick.active = true;
      joystick.pointerId = event.pointerId;
      const baseRect = ui.joystickBase.getBoundingClientRect();
      joystick.originX = baseRect.left + baseRect.width / 2;
      joystick.originY = baseRect.top + baseRect.height / 2;
      ui.joystickBase.classList.add("is-active");
      ui.joystickKnob.style.left = `${event.clientX}px`;
      ui.joystickKnob.style.top = `${event.clientY}px`;
      let ddx = event.clientX - joystick.originX;
      let ddy = event.clientY - joystick.originY;
      const dist = Math.hypot(ddx, ddy);
      if (dist > JOY_RADIUS) { ddx = ddx / dist * JOY_RADIUS; ddy = ddy / dist * JOY_RADIUS; }
      joystick.dx = ddx / JOY_RADIUS;
      joystick.dy = ddy / JOY_RADIUS;
    });

    ui.joystickZone.addEventListener("pointermove", (event) => {
      if (!joystick.active || event.pointerId !== joystick.pointerId) return;
      event.preventDefault();
      let ddx = event.clientX - joystick.originX;
      let ddy = event.clientY - joystick.originY;
      const dist = Math.hypot(ddx, ddy);
      if (dist > JOY_RADIUS) { ddx = ddx / dist * JOY_RADIUS; ddy = ddy / dist * JOY_RADIUS; }
      joystick.dx = ddx / JOY_RADIUS;
      joystick.dy = ddy / JOY_RADIUS;
      ui.joystickKnob.style.left = `${joystick.originX + ddx}px`;
      ui.joystickKnob.style.top = `${joystick.originY + ddy}px`;
    });

    const endJoystick = (event) => {
      if (event.pointerId !== joystick.pointerId) return;
      joystick.active = false;
      joystick.pointerId = null;
      joystick.dx = 0;
      joystick.dy = 0;
      ui.joystickBase.classList.remove("is-active");
      ui.joystickKnob.style.left = `${ui.joystickBase.getBoundingClientRect().left + 55}px`;
      ui.joystickKnob.style.top = `${ui.joystickBase.getBoundingClientRect().top + 55}px`;
    };
    ui.joystickZone.addEventListener("pointerup", endJoystick);
    ui.joystickZone.addEventListener("pointercancel", endJoystick);
  }

  if (ui.mobileSkillButtons) {
    ui.mobileSkillButtons.querySelectorAll(".mobile-skill-btn").forEach((btn) => {
      btn.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const index = Number(btn.dataset.skill);
        if (!Number.isNaN(index)) useSkill(index);
      });
    });
  }

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
    if (event.code === "KeyQ") useClassSpecial();
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

  const PREPARATION_KEY = "echo.preparation";
  const DEFAULT_PREP_SETTINGS = Object.freeze({
    resolution: "auto", fps: 60, renderScale: 100, autoQuality: isMobile,
    brightness: 100, particles: isMobile ? 65 : 100, showDamage: true, showLevel: true,
    masterVolume: 70, musicVolume: 70, sfxVolume: 80, uiVolume: 70, muteUnfocused: true,
    sensitivity: 100, aimAssist: 20, controlSize: 100, controlPosition: "right", hudScale: 100,
    reduceFlashes: false, reduceShake: false, highContrast: false, colorMode: "default",
    textSize: 100, uiOpacity: 100, extraIndicators: false, vibration: true
  });

  function loadPreparationState() {
    try {
      const saved = JSON.parse(localStorage.getItem(PREPARATION_KEY) || "{}");
      return {
        classId: normalizeClassId(saved.classId || selectedClassId),
        skinId: String(saved.skinId || localStorage.getItem(SKIN_KEY) || "azul-neon"),
        skillIds: sanitizeSkillLoadout(saved.classId || selectedClassId, saved.skillIds),
        mode: ["solo", "multiplayer", "training"].includes(saved.mode) ? saved.mode : "solo",
        difficulty: ["easy", "normal", "hard"].includes(saved.difficulty) ? saved.difficulty : "normal",
        modifierId: modifierPool.some((modifier) => modifier.id === saved.modifierId) ? saved.modifierId : "",
        randomClass: Boolean(saved.randomClass),
        settings: { ...DEFAULT_PREP_SETTINGS, ...(saved.settings || {}) }
      };
    } catch (_error) {
      return { classId: "cutter", skinId: "azul-neon", skillIds: sanitizeSkillLoadout("cutter", []), mode: "solo", difficulty: "normal", modifierId: "", randomClass: false, settings: { ...DEFAULT_PREP_SETTINGS } };
    }
  }

  let preparation = loadPreparationState();
  let selectedSkillIds = [...preparation.skillIds];
  let selectedDifficulty = preparation.difficulty;
  let selectedModifierId = preparation.modifierId;
  let randomClassBonus = preparation.randomClass;
  let classProgress = {};
  let preparationSaveTimer = 0;
  let previewAnimationFrame = 0;
  let mutedBeforeFocusLoss = false;
  selectedClassId = preparation.classId;
  selectedMode = preparation.mode;
  localStorage.setItem(SKIN_KEY, preparation.skinId);

  function preparationPayload() {
    return {
      classId: selectedClassId,
      skinId: getSelectedSkin().id,
      skillIds: selectedSkillIds,
      mode: selectedMode,
      difficulty: selectedDifficulty,
      modifierId: selectedModifierId,
      randomClass: randomClassBonus,
      settings: preparation.settings
    };
  }

  function savePreparation({ server = true } = {}) {
    const payload = preparationPayload();
    localStorage.setItem(PREPARATION_KEY, JSON.stringify(payload));
    localStorage.setItem("echo.class", selectedClassId);
    localStorage.setItem(SKIN_KEY, payload.skinId);
    updatePreparationSummary();
    if (!server) return;
    window.clearTimeout(preparationSaveTimer);
    preparationSaveTimer = window.setTimeout(() => {
      requestJson("/api/preferences", { method: "POST", body: JSON.stringify({ name: sanitizeName(ui.name.value), preferences: payload }) }).catch(() => {});
    }, 240);
  }

  function applyServerPreparation(saved, progress = {}) {
    classProgress = progress || {};
    if (saved && typeof saved === "object") {
      preparation = { ...preparation, ...saved, settings: { ...DEFAULT_PREP_SETTINGS, ...(saved.settings || preparation.settings) } };
      selectedClassId = normalizeClassId(preparation.classId);
      selectedSkillIds = sanitizeSkillLoadout(selectedClassId, preparation.skillIds);
      selectedDifficulty = ["easy", "normal", "hard"].includes(preparation.difficulty) ? preparation.difficulty : "normal";
      selectedModifierId = modifierPool.some((modifier) => modifier.id === preparation.modifierId) ? preparation.modifierId : "";
      selectedMode = ["solo", "multiplayer", "training"].includes(preparation.mode) ? preparation.mode : "solo";
      randomClassBonus = Boolean(preparation.randomClass);
      if (skins.some((skin) => skin.id === preparation.skinId && skin.unlocked())) localStorage.setItem(SKIN_KEY, preparation.skinId);
    }
    applyPreparationSettings();
    renderPreparationMenu();
    setSelectedMode(selectedMode);
  }

  function selectPrepTab(tabId) {
    document.querySelectorAll("[data-prep-tab]").forEach((button) => {
      const selected = button.dataset.prepTab === tabId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-current", selected ? "page" : "false");
    });
    document.querySelectorAll("[data-prep-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.prepPanel === tabId));
  }

  function selectPlayerClass(classId, randomSelection = false) {
    selectedClassId = normalizeClassId(classId);
    randomClassBonus = randomSelection;
    selectedSkillIds = sanitizeSkillLoadout(selectedClassId, selectedSkillIds);
    renderClassMenu();
    renderAbilityMenu();
    savePreparation();
    sound(getClassDefinition(selectedClassId).sound, 0.15, "triangle", 0.025);
  }

  function renderClassMenu() {
    if (!ui.classGrid || !ui.classDetail) return;
    const roleLabels = { melee: "CORPO A CORPO", "long-range": "LONGO ALCANCE", control: "CONTROLE", defense: "DEFESA" };
    ui.classGrid.replaceChildren();
    for (const definition of Object.values(classRegistry)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `class-card${definition.id === selectedClassId ? " is-selected" : ""}`;
      button.style.setProperty("--class-color", definition.resource.color);
      button.innerHTML = `<span>${definition.icon}</span><div><strong>${definition.name}</strong><small>${roleLabels[definition.role]} · DIFICULDADE ${definition.difficulty}/5</small></div>`;
      button.addEventListener("click", () => selectPlayerClass(definition.id));
      ui.classGrid.append(button);
    }
    const definition = getClassDefinition(selectedClassId);
    const stat = (label, value, max) => `<div><span>${label}</span><i><b style="width:${clamp(value / max, 0, 1) * 100}%"></b></i></div>`;
    ui.classDetail.style.setProperty("--class-color", definition.resource.color);
    ui.classDetail.innerHTML = `<header><span>${definition.icon}</span><div><small>${roleLabels[definition.role]}</small><h3>${definition.name}</h3><p>${definition.summary}</p></div></header><div class="class-kit"><div><small>ATAQUE PRINCIPAL</small><strong>${definition.primaryAttack}</strong></div><div><small>ESPECIAL</small><strong>${definition.activeAbility}</strong></div><div><small>PASSIVA</small><strong>${definition.passiveAbility}</strong></div><div><small>RECURSO</small><strong>${definition.resource.name}</strong></div></div><div class="class-stats">${stat("ALCANCE", definition.attributes.preferredRange, 650)}${stat("VELOCIDADE", definition.attributes.speed, 240)}${stat("RESISTÊNCIA", 150 / definition.attributes.resistance, 180)}${stat("MOBILIDADE", definition.attributes.mobility, 5)}</div><footer><span><b>VANTAGENS</b>${definition.strengths.join(" · ")}</span><span><b>FRAQUEZAS</b>${definition.weaknesses.join(" · ")}</span></footer>`;
  }

  function renderSkinMenu() {
    if (!ui.prepSkinGrid) return;
    const selected = getSelectedSkin().id;
    ui.prepSkinGrid.replaceChildren();
    for (const skin of skins) {
      const unlocked = skin.unlocked();
      const card = document.createElement("button");
      card.type = "button";
      card.disabled = !unlocked;
      card.className = `prep-option-card skin-option${skin.id === selected ? " is-selected" : ""}`;
      card.style.setProperty("--option-color", skin.colors?.[0] || hsl(skin.hue));
      card.innerHTML = `<span class="skin-showcase skin-${skin.style}" style="--skin-primary:${skin.colors[0]};--skin-secondary:${skin.colors[1]};--skin-highlight:${skin.colors[2]}"><i class="skin-aura"></i><i class="skin-trail"></i><i class="skin-body"></i><i class="skin-detail detail-a"></i><i class="skin-detail detail-b"></i></span><small>${skin.rarity || "COMUM"}</small><strong>${skin.name}</strong><p>${skin.description}</p><em>${unlocked ? skin.id === selected ? "SELECIONADA" : "DISPONÍVEL" : "BLOQUEADA"}</em>`;
      if (unlocked) card.addEventListener("click", () => {
        localStorage.setItem(SKIN_KEY, skin.id);
        renderSkinMenu();
        savePreparation();
      });
      ui.prepSkinGrid.append(card);
    }
  }

  function renderAbilityMenu() {
    if (!ui.prepAbilityGrid) return;
    const compatible = compatibleSkills(selectedClassId);
    selectedSkillIds = sanitizeSkillLoadout(selectedClassId, selectedSkillIds);
    ui.prepAbilityGrid.replaceChildren();
    for (const skill of compatible) {
      const selected = selectedSkillIds.includes(skill.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className = `prep-option-card ability-option${selected ? " is-selected" : ""}`;
      card.style.setProperty("--option-color", skill.color);
      card.innerHTML = `<span class="ability-symbol">${skill.symbol}</span><small class="ability-stats"><b>${skill.cost} ENERGIA</b><b>${skill.cooldown} s RECARGA</b></small><strong>${skill.name}</strong><p>${skill.effect}</p><em>${selected ? `EQUIPADA NO SLOT ${selectedSkillIds.indexOf(skill.id) + 1}` : "CLIQUE PARA EQUIPAR"}</em>`;
      card.addEventListener("click", () => {
        if (selected) selectedSkillIds = selectedSkillIds.filter((id) => id !== skill.id);
        else if (selectedSkillIds.length < 4) selectedSkillIds.push(skill.id);
        else showToast("REMOVA UMA HABILIDADE ANTES DE EQUIPAR OUTRA", 1600);
        renderAbilityMenu();
        savePreparation();
      });
      ui.prepAbilityGrid.append(card);
    }
    if (ui.abilityCount) ui.abilityCount.textContent = `${selectedSkillIds.length}/4`;
  }

  function renderClassProgress() {
    if (!ui.classProgressGrid) return;
    ui.classProgressGrid.replaceChildren();
    ui.challengeProgressGrid?.replaceChildren();
    for (const definition of Object.values(classRegistry)) {
      const progress = classProgress[definition.id] || { experience: 0, runs: 0, kills: 0, victories: 0 };
      const challenge = CLASS_CHALLENGES[definition.id];
      const level = getClassLevel(progress.experience);
      const current = progress.experience - classExperienceForLevel(level);
      const needed = Math.max(1, classExperienceForLevel(level + 1) - classExperienceForLevel(level));
      const article = document.createElement("article");
      article.style.setProperty("--class-color", definition.resource.color);
      const challengeValue = Math.min(challenge.target, progress[challenge.metric] || 0);
      article.innerHTML = `<span>${definition.icon}</span><div><strong>${definition.name} · NÍVEL ${level}</strong><small>${progress.runs} PARTIDAS · ${progress.kills} ELIMINAÇÕES · ${progress.victories} VITÓRIAS</small><i aria-label="Progresso para o próximo nível"><b style="width:${clamp(current / needed, 0, 1) * 100}%"></b></i><em>${Math.floor(current)}/${needed} XP PARA O PRÓXIMO NÍVEL</em></div>`;
      ui.classProgressGrid.append(article);
      if (ui.challengeProgressGrid) {
        const challengeCard = document.createElement("article");
        challengeCard.className = progress.challengeClaimed ? "is-complete" : "";
        challengeCard.style.setProperty("--class-color", definition.resource.color);
        challengeCard.innerHTML = `<header><span>${definition.icon}</span><strong>${definition.name}</strong></header><p>${challenge.label}</p><i aria-label="Progresso da conquista"><b style="width:${challengeValue / challenge.target * 100}%"></b></i><footer><span>${challengeValue}/${challenge.target}</span><em>${progress.challengeClaimed ? "RECOMPENSA RECEBIDA" : `RECOMPENSA: ${challenge.resonance} CRÉDITOS + ${challenge.skillPoints} PONTOS`}</em></footer>`;
        ui.challengeProgressGrid.append(challengeCard);
      }
    }
  }

  function updatePreparationSummary() {
    const definition = getClassDefinition(selectedClassId);
    const skin = getSelectedSkin();
    const skillNames = selectedSkillIds.map((id) => EQUIPPABLE_SKILLS.find((skill) => skill.id === id)?.name).filter(Boolean);
    if (ui.summaryClass) ui.summaryClass.textContent = `${definition.name}${randomClassBonus ? " · ALEATÓRIA +5%" : ""}`;
    if (ui.summarySkin) ui.summarySkin.textContent = skin.name;
    if (ui.summaryAbilities) ui.summaryAbilities.textContent = skillNames.length ? skillNames.join(", ") : "NENHUMA";
    if (ui.summaryMode) ui.summaryMode.textContent = selectedMode === "training" ? "TREINO" : selectedMode.toUpperCase();
    if (ui.summaryDifficulty) ui.summaryDifficulty.textContent = selectedDifficulty === "easy" ? "ACESSÍVEL" : selectedDifficulty === "hard" ? "INTENSA" : "NORMAL";
    const modifier = modifierPool.find((entry) => entry.id === selectedModifierId);
    if (modifier && ui.summaryDifficulty) ui.summaryDifficulty.textContent += ` · ${modifier.name}`;
  }

  function bindSettingInputs() {
    document.querySelectorAll("[data-setting]").forEach((input) => {
      const key = input.dataset.setting;
      const current = preparation.settings[key];
      if (input.type === "checkbox") input.checked = Boolean(current);
      else input.value = String(current);
      input.addEventListener("input", () => {
        preparation.settings[key] = input.type === "checkbox" ? input.checked : input.type === "range" || key === "fps" ? Number(input.value) : input.value;
        applyPreparationSettings();
        savePreparation();
      });
    });
  }

  function applyPreparationSettings() {
    const settings = preparation.settings;
    masterVolume = clamp(Number(settings.masterVolume) / 100, 0, 1);
    musicVolume = clamp(Number(settings.musicVolume) / 100, 0, 1);
    sfxVolume = clamp(Number(settings.sfxVolume) / 100, 0, 1);
    interfaceVolume = clamp(Number(settings.uiVolume) / 100, 0, 1);
    screenShakeEnabled = !settings.reduceShake;
    flashEnabled = !settings.reduceFlashes;
    document.documentElement.style.setProperty("--ui-scale", String(Number(settings.hudScale) / 100));
    document.documentElement.style.setProperty("--ui-opacity", String(Number(settings.uiOpacity) / 100));
    document.documentElement.style.setProperty("--text-scale", String(Number(settings.textSize) / 100));
    document.documentElement.style.setProperty("--brightness", String(Number(settings.brightness) / 100));
    document.documentElement.style.setProperty("--control-scale", String(Number(settings.controlSize) / 100));
    document.body.classList.toggle("high-contrast", Boolean(settings.highContrast));
    document.body.dataset.colorMode = settings.colorMode || "default";
    document.body.dataset.controlPosition = settings.controlPosition || "right";
    document.body.classList.toggle("extra-indicators", Boolean(settings.extraIndicators));
    if (ui.shakeSetting) ui.shakeSetting.checked = screenShakeEnabled;
    if (ui.flashSetting) ui.flashSetting.checked = flashEnabled;
    if (ui.volume) ui.volume.value = String(settings.masterVolume);
    if (ui.volumeValue) ui.volumeValue.textContent = `${settings.masterVolume}%`;
    resize();
  }

  function renderPreparationMenu() {
    renderClassMenu();
    renderSkinMenu();
    renderAbilityMenu();
    renderClassProgress();
    if (ui.difficulty) ui.difficulty.value = selectedDifficulty;
    if (ui.modifier) ui.modifier.value = selectedModifierId;
    runModifiers = selectedModifierId ? modifierPool.filter((modifier) => modifier.id === selectedModifierId) : [];
    updatePreparationSummary();
  }

  function applyDifficultyToBot(bot) {
    if (!bot || bot.difficultyApplied === selectedDifficulty) return bot;
    const multipliers = selectedDifficulty === "easy" ? { health: 0.78, damage: 0.72, speed: 0.9 } : selectedDifficulty === "hard" ? { health: 1.28, damage: 1.22, speed: 1.08 } : { health: 1, damage: 1, speed: 1 };
    bot.maxHealth *= multipliers.health;
    bot.health = bot.maxHealth;
    bot.attackDamage *= multipliers.damage;
    bot.speed *= multipliers.speed;
    bot.baseSpeed *= multipliers.speed;
    bot.difficultyApplied = selectedDifficulty;
    return bot;
  }

  function applySelectedDifficulty() {
    for (const bot of bots) {
      applyDifficultyToBot(bot);
    }
  }

  function startTrainingGame() {
    if (multiplayerSocket) multiplayerSocket.close();
    activeMode = "training";
    loadUpgrades().then(() => {
      resetWorld();
      bots = bots.slice(0, 6);
      applySelectedDifficulty();
      initSkills();
      initAudio();
      runStats = { kills: 0, score: 0, maxCombo: 0, bossDefeated: 0, bossSpeedKill: 0, runTime: 0, redMotes: 0, noHitBoss: 0 };
      state = "playing";
      document.body.classList.add("is-playing");
      ui.start.classList.add("is-hidden");
      showToast("TREINO // SEM RECOMPENSAS · Q USA O ESPECIAL", 2400);
    });
  }

  function drawCharacterPreview(now) {
    if (!ui.preview) return;
    const context = ui.preview.getContext("2d");
    const { width: previewWidth, height: previewHeight } = ui.preview;
    context.clearRect(0, 0, previewWidth, previewHeight);
    const definition = getClassDefinition(selectedClassId);
    const skin = getSelectedSkin();
    const hue = skin.hue < 0 ? (now * 0.04) % 360 : skin.hue;
    const centerX = previewWidth / 2;
    const centerY = previewHeight / 2 + 8;
    const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 105);
    glow.addColorStop(0, `hsla(${hue} 95% 65% / .18)`); glow.addColorStop(1, "transparent");
    context.fillStyle = glow; context.fillRect(0, 0, previewWidth, previewHeight);
    const orbitCount = selectedClassId === "orbiter" ? 5 : selectedClassId === "summoner" ? 3 : selectedClassId === "trapper" ? 3 : 2;
    for (let index = 0; index < orbitCount; index += 1) {
      const angle = now * 0.0012 + index * TAU / orbitCount;
      const orbit = 48 + (index % 2) * 19;
      context.fillStyle = `hsla(${(hue + index * 18) % 360} 95% 70% / .82)`;
      context.beginPath(); context.arc(centerX + Math.cos(angle) * orbit, centerY + Math.sin(angle) * orbit * 0.58, selectedClassId === "trapper" ? 4 : 6, 0, TAU); context.fill();
    }
    if (selectedClassId === "marksman") {
      context.strokeStyle = `hsla(${hue} 95% 72% / .5)`; context.setLineDash([8, 7]); context.beginPath(); context.moveTo(centerX + 22, centerY); context.lineTo(previewWidth - 28, centerY - 28); context.stroke(); context.setLineDash([]);
    }
    if (selectedClassId === "cutter") {
      context.strokeStyle = `hsla(${hue} 95% 72% / .55)`; context.lineWidth = 5; context.beginPath(); context.moveTo(45, centerY + 45); context.quadraticCurveTo(centerX - 35, centerY - 80, centerX, centerY); context.stroke();
    }
    context.shadowColor = `hsl(${hue} 95% 62%)`; context.shadowBlur = 24 * skin.glowIntensity;
    context.fillStyle = `hsl(${hue} 90% 62%)`; context.beginPath(); context.arc(centerX, centerY, 25, 0, TAU); context.fill();
    context.shadowBlur = 0; context.fillStyle = "rgba(5,4,12,.86)"; context.beginPath(); context.arc(centerX, centerY, 14, 0, TAU); context.fill();
    context.save(); context.translate(centerX, centerY); context.rotate(now * 0.0007); context.lineWidth = 2;
    context.strokeStyle = skin.colors[2]; context.fillStyle = skin.colors[0];
    for (let detail = 0; detail < 6; detail += 1) {
      const angle = detail * TAU / 6; const orbit = 34 + (detail % 2) * 8;
      if (skin.style === "ice") {
        context.save(); context.rotate(angle); context.beginPath(); context.moveTo(25, 0); context.lineTo(43, -5); context.lineTo(38, 6); context.closePath(); context.stroke(); context.restore();
      } else if (skin.style === "ember" || skin.style === "shadow") {
        context.save(); context.rotate(angle); context.beginPath(); context.moveTo(21, 0); context.quadraticCurveTo(37, -14, 48, detail % 2 ? 5 : -5); context.stroke(); context.restore();
      } else {
        context.fillStyle = skin.style === "prism" ? `hsl(${detail * 60} 95% 68%)` : skin.colors[detail % skin.colors.length];
        context.beginPath(); context.arc(Math.cos(angle) * orbit, Math.sin(angle) * orbit * 0.74, 2.5 + detail % 2, 0, TAU); context.fill();
      }
    }
    context.restore();
    context.fillStyle = "white"; context.font = "700 18px Inter, sans-serif"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(definition.icon, centerX, centerY + 1);
    previewAnimationFrame = requestAnimationFrame(drawCharacterPreview);
  }

  document.querySelectorAll("[data-prep-tab]").forEach((button) => button.addEventListener("click", () => selectPrepTab(button.dataset.prepTab)));
  ui.randomClass?.addEventListener("click", () => selectPlayerClass(chooseRandomClass(), true));
  ui.trainingMode?.addEventListener("click", () => setSelectedMode("training"));
  ui.difficulty?.addEventListener("change", () => { selectedDifficulty = ui.difficulty.value; savePreparation(); });
  ui.modifier?.addEventListener("change", () => { selectedModifierId = ui.modifier.value; runModifiers = selectedModifierId ? modifierPool.filter((modifier) => modifier.id === selectedModifierId) : []; savePreparation(); });
  ui.classSpecialButton?.addEventListener("click", useClassSpecial);
  ui.fullscreenButton?.addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.());
  bindSettingInputs();
  applyPreparationSettings();
  renderPreparationMenu();
  setSelectedMode(selectedMode);
  if (!previewAnimationFrame) previewAnimationFrame = requestAnimationFrame(drawCharacterPreview);
  document.addEventListener("visibilitychange", () => {
    if (!preparation.settings.muteUnfocused) return;
    if (document.hidden) { mutedBeforeFocusLoss = muted; muted = true; }
    else muted = mutedBeforeFocusLoss;
    if (typeof updateMusic === "function") updateMusic();
  });
  loadSettings();
  resize();
  resetWorld();
  loadProfile();
  loadChallenges();
  requestAnimationFrame((now) => {
    previousTime = now;
    requestAnimationFrame(frame);
  });

  const LEVEL_CONFIG = Object.freeze({
    maxLevel: 25,
    baseExperience: 28,
    experienceGrowth: 1.24,
    player: Object.freeze({
      radiusPerLevel: 0.042,
      maxRadiusScale: 1.82,
      healthPerLevel: 0.055,
      damagePerLevel: 0.062,
      reachPerLevel: 0.018,
      speedLossPerLevel: 0.006,
      minimumSpeedScale: 0.84
    }),
    bot: Object.freeze({
      radiusPerLevel: 0.038,
      maxRadiusScale: 1.7,
      healthPerLevel: 0.047,
      damagePerLevel: 0.055,
      speedLossPerLevel: 0.0045,
      minimumSpeedScale: 0.87
    }),
    moteExperience: Object.freeze({ cyan: 4, violet: 13, gold: 20, red: 8 }),
    rareBoostDuration: 6,
    rareBoostMultiplier: 1.12,
    dropFraction: 0.34,
    maxDropMotes: 18,
    botThinkInterval: 0.34,
    botDangerRadius: 310,
    botHuntRadius: 390
  });

  const BOSS_SIZE_SCALES = Object.freeze({
    "coroa-vazia": 1.85,
    "espectro-decisivo": 1.72,
    "tremor-deep": 2.05,
    necrostro: 1.76,
    vortice: 1.82,
    cicatriz: 1.68,
    mimico: 1.62,
    prisma: 1.7,
    silenciador: 1.76
  });

  let levelHud = null;

  function experienceForLevel(level) {
    return Math.max(1, Math.round(LEVEL_CONFIG.baseExperience * LEVEL_CONFIG.experienceGrowth ** Math.max(0, level - 1)));
  }

  function experienceValueForMote(type, spectral = false) {
    const base = LEVEL_CONFIG.moteExperience[type] || LEVEL_CONFIG.moteExperience.cyan;
    return Math.max(1, Math.round(base * (spectral ? 0.78 : 1)));
  }

  function initializeLevelProgression(entity, kind = "bot") {
    if (!entity || entity.levelInitialized) return entity;
    const baseDamage = kind === "player"
      ? Number(entity.trailDamage || 1)
      : Number(entity.baseAttackDamage || entity.attackDamage || 1);
    Object.assign(entity, {
      levelInitialized: true,
      levelKind: kind,
      level: 1,
      experience: 0,
      experienceToNext: experienceForLevel(1),
      levelBaseRadius: Number(entity.radius || 16),
      levelBaseMaxHealth: Number(entity.maxHealth || entity.health || 1),
      levelBaseDamage: Math.max(1, baseDamage),
      levelBasePhaseSpeed: Number(entity.phaseSpeed || 0),
      levelScale: 1,
      levelSpeedScale: 1,
      rareBoostTimer: 0,
      rareBoostMultiplier: 1,
      levelPulseTimer: 0,
      resourceThinkTimer: 0,
      resourceMode: null
    });
    applyLevelGrowth(entity, false);
    return entity;
  }

  function applyLevelGrowth(entity, healDifference = true) {
    if (!entity?.levelInitialized || entity.boss) return entity;
    const config = entity.levelKind === "player" ? LEVEL_CONFIG.player : LEVEL_CONFIG.bot;
    const steps = Math.max(0, entity.level - 1);
    const oldMaxHealth = Math.max(1, Number(entity.maxHealth) || entity.levelBaseMaxHealth);
    const scale = Math.min(config.maxRadiusScale, 1 + steps * config.radiusPerLevel);
    const healthScale = 1 + steps * config.healthPerLevel;
    const damageScale = 1 + steps * config.damagePerLevel;
    const speedScale = Math.max(config.minimumSpeedScale, 1 - steps * config.speedLossPerLevel);
    const nextMaxHealth = Math.max(1, Math.round(entity.levelBaseMaxHealth * healthScale));

    entity.levelScale = scale;
    entity.levelSpeedScale = speedScale;
    entity.radius = entity.levelBaseRadius * scale;
    entity.maxHealth = nextMaxHealth;
    if (healDifference && nextMaxHealth > oldMaxHealth) entity.health += nextMaxHealth - oldMaxHealth;
    entity.health = clamp(entity.health, 0, nextMaxHealth);

    if (entity.levelKind === "player") {
      entity.trailDamage = entity.levelBaseDamage * damageScale;
      entity.phaseSpeed = entity.levelBasePhaseSpeed * (1 + steps * config.reachPerLevel);
      entity.pickupRadius = Math.max(entity.pickupRadius || 0, steps * 1.2 + playerUpgrades.collection * 5);
    } else {
      entity.baseAttackDamage = Math.max(1, entity.levelBaseDamage * damageScale);
      entity.attackDamage = entity.baseAttackDamage;
    }
    return entity;
  }

  function emitLevelEvent(name, entity, extra = {}) {
    try {
      window.EchoCore?.events?.emit(name, {
        id: entity.id,
        level: entity.level,
        experience: entity.experience,
        ...extra
      });
    } catch (_error) {}
  }

  function gainExperience(entity, amount, source = "mote") {
    if (!entity || entity.boss || entity.dead) return 0;
    initializeLevelProgression(entity, entity === player ? "player" : "bot");
    if (entity.level >= LEVEL_CONFIG.maxLevel) {
      entity.experience = 0;
      return 0;
    }
    const boost = entity.rareBoostTimer > 0 ? entity.rareBoostMultiplier : 1;
    const granted = Math.max(0, Math.round(Number(amount || 0) * boost));
    entity.experience += granted;
    emitLevelEvent("progression:experience", entity, { amount: granted, source });

    let levelsGained = 0;
    while (entity.level < LEVEL_CONFIG.maxLevel && entity.experience >= entity.experienceToNext) {
      entity.experience -= entity.experienceToNext;
      entity.level += 1;
      entity.experienceToNext = experienceForLevel(entity.level);
      levelsGained += 1;
    }
    if (entity.level >= LEVEL_CONFIG.maxLevel) entity.experience = 0;

    if (levelsGained > 0) {
      applyLevelGrowth(entity, true);
      entity.levelPulseTimer = 1.1;
      emitLevelEvent("progression:level-up", entity, { levelsGained, source });
      if (entity === player) {
        showToast(`NÍVEL ${entity.level} ALCANÇADO`, 1700);
        spawnWave(entity.x, entity.y, entity.hue, 105 + entity.radius, 0.7);
        burst(entity.x, entity.y, entity.hue, 18);
        sound(330 + Math.min(220, entity.level * 8), 0.3, "triangle", 0.05);
      } else {
        spawnWave(entity.x, entity.y, entity.hue, 55 + entity.radius, 0.4);
        burst(entity.x, entity.y, entity.hue, 7);
      }
    }
    return granted;
  }

  function updateLevelProgression(entity, dt) {
    if (!entity || entity.boss || entity.dead) return;
    initializeLevelProgression(entity, entity === player ? "player" : "bot");
    entity.rareBoostTimer = Math.max(0, entity.rareBoostTimer - dt);
    entity.rareBoostMultiplier = entity.rareBoostTimer > 0 ? LEVEL_CONFIG.rareBoostMultiplier : 1;
    entity.levelPulseTimer = Math.max(0, entity.levelPulseTimer - dt);
  }

  function entityPower(entity) {
    const level = Number(entity?.level || 1);
    const healthRatio = clamp(Number(entity?.health || 0) / Math.max(1, Number(entity?.maxHealth || 1)), 0, 1);
    const damage = Number(entity?.attackDamage || entity?.trailDamage || 1);
    return level * 16 + damage * 0.7 + healthRatio * 24 + (entity?.boss ? 300 : 0);
  }

  function hostileEntitiesFor(bot) {
    return [player, ...bots].filter((entity) => (
      entity
      && entity !== bot
      && !entity.dead
      && (entity === player || entity.boss || entity.faction !== bot.faction)
    ));
  }

  function nearestDanger(bot, hostiles = hostileEntitiesFor(bot)) {
    let danger = null;
    let bestDistance = Infinity;
    const ownPower = entityPower(bot);
    const dangerRadiusSq = LEVEL_CONFIG.botDangerRadius * LEVEL_CONFIG.botDangerRadius;
    for (const entity of hostiles) {
      const distanceSquared = distanceSq(entity.x, entity.y, bot.x, bot.y);
      if (distanceSquared > dangerRadiusSq || entityPower(entity) < ownPower * 1.22) continue;
      if (distanceSquared < bestDistance) {
        bestDistance = distanceSquared;
        danger = entity;
      }
    }
    return danger ? { entity: danger, distance: Math.sqrt(bestDistance) } : null;
  }

  function weakestHuntTarget(bot, hostiles = hostileEntitiesFor(bot)) {
    if (bot.health < bot.maxHealth * 0.48) return null;
    const ownPower = entityPower(bot);
    let target = null;
    let bestUtility = -Infinity;
    const huntRadiusSq = LEVEL_CONFIG.botHuntRadius * LEVEL_CONFIG.botHuntRadius;
    for (const entity of hostiles) {
      if (entity.boss) continue;
      const distanceSquared = distanceSq(entity.x, entity.y, bot.x, bot.y);
      if (distanceSquared > huntRadiusSq) continue;
      const targetPower = entityPower(entity);
      if (targetPower > ownPower * 0.78) continue;
      const distance = Math.sqrt(distanceSquared);
      const utility = (ownPower - targetPower) * 2.2 - distance * 0.14;
      if (utility > bestUtility) {
        bestUtility = utility;
        target = entity;
      }
    }
    return target ? { target, utility: bestUtility } : null;
  }

  function chooseBotResourceTarget(bot) {
    if (!bot || bot.dead || bot.boss || bot.phasing) return null;
    const healthRatio = bot.health / Math.max(1, bot.maxHealth);
    const hostiles = hostileEntitiesFor(bot);
    const danger = nearestDanger(bot, hostiles);
    if ((healthRatio < 0.28 || danger?.distance < 175) && danger) {
      const dx = bot.x - danger.entity.x;
      const dy = bot.y - danger.entity.y;
      const distance = Math.hypot(dx, dy) || 1;
      return {
        mode: "flee",
        x: clamp(bot.x + dx / distance * 420, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
        y: clamp(bot.y + dy / distance * 420, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN),
        utility: 1000
      };
    }

    const hunt = weakestHuntTarget(bot, hostiles);
    if (hunt && bot.aggression > 0.52) {
      return {
        mode: "hunt",
        x: hunt.target.x + (hunt.target.vx || 0) * 0.55,
        y: hunt.target.y + (hunt.target.vy || 0) * 0.55,
        target: hunt.target,
        utility: hunt.utility
      };
    }

    if (motes.length === 0) return null;
    let best = null;
    let bestUtility = -Infinity;
    const ownPower = entityPower(bot);
    for (const mote of queryMotes(bot.x, bot.y, 900)) {
      const distance = Math.hypot(mote.x - bot.x, mote.y - bot.y);
      const value = experienceValueForMote(mote.type);
      let utility = value * 24 - distance * 0.12;
      if (mote.type === "violet") utility += 125;
      if (mote.type === "gold") utility += 82;
      if (mote.type === "red" && healthRatio < 0.55) utility -= 160;
      if (danger) {
        const moteDangerDistance = Math.hypot(mote.x - danger.entity.x, mote.y - danger.entity.y);
        if (moteDangerDistance < 230 && entityPower(danger.entity) > ownPower) utility -= 220;
      }
      if (utility > bestUtility) {
        bestUtility = utility;
        best = mote;
      }
    }
    return best ? { mode: "forage", x: best.x, y: best.y, mote: best, utility: bestUtility } : null;
  }

  function updateBotProgression(dt) {
    for (const bot of bots) {
      if (bot.dead || bot.boss || bot.bossClone || bot.noRespawn) continue;
      updateLevelProgression(bot, dt);
      const speedBoost = bot.rareBoostTimer > 0 ? 1.06 : 1;
      if (!bot.swarmer && bot.archetype !== "berserker") {
        bot.speed = (bot.baseSpeed || bot.speed) * (bot.levelSpeedScale || 1) * speedBoost;
      }
      bot.resourceThinkTimer = Math.max(0, (bot.resourceThinkTimer || 0) - dt);
      if (bot.resourceThinkTimer > 0 || bot.phasing) continue;
      bot.resourceThinkTimer = LEVEL_CONFIG.botThinkInterval + Math.random() * 0.18;
      const decision = chooseBotResourceTarget(bot);
      if (!decision) continue;
      bot.resourceMode = decision.mode;
      bot.targetX = clamp(decision.x, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.targetY = clamp(decision.y, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      bot.factionTarget = decision.mode === "hunt" && decision.target !== player ? decision.target : null;
      bot.thinkTimer = Math.max(bot.thinkTimer, decision.mode === "flee" ? 0.48 : 0.28);
      if (decision.mode === "flee") bot.cooldown = Math.max(bot.cooldown, 0.35);
    }
  }

  function dropExperienceMotes(entity, multiplier = 1) {
    if (!entity || entity.prismaIllusion) return 0;
    const stored = Number(entity.experience || 0) + Math.max(0, Number(entity.level || 1) - 1) * 18;
    const budget = Math.max(0, Math.round(stored * LEVEL_CONFIG.dropFraction * multiplier));
    const minimum = entity.boss ? 10 : 2;
    const count = Math.round(clamp(Math.ceil(budget / 7), minimum, LEVEL_CONFIG.maxDropMotes));
    for (let index = 0; index < count; index += 1) {
      const mote = createMote();
      mote.x = clamp(entity.x + random(-58, 58), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      mote.y = clamp(entity.y + random(-58, 58), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      const ratio = index / Math.max(1, count - 1);
      mote.type = ratio < 0.18 ? "gold" : ratio < 0.52 ? "violet" : "cyan";
      mote.droppedExperience = true;
      appendIndexedMote(mote);
    }
    return count;
  }

  function averageCombatLevel() {
    const living = bots.filter((bot) => !bot.dead && !bot.boss && !bot.bossClone);
    const levels = [Number(player.level || 1), ...living.map((bot) => Number(bot.level || 1))];
    return levels.reduce((sum, level) => sum + level, 0) / Math.max(1, levels.length);
  }

  function scaleBossForRun(boss) {
    const averageLevel = averageCombatLevel();
    const livingLevels = bots.filter((bot) => !bot.dead).map((bot) => Number(bot.level || 1));
    const highestLevel = Math.max(Number(player.level || 1), ...livingLevels);
    const levelPressure = Math.max(0, averageLevel - 1) * 0.045 + Math.max(0, highestLevel - averageLevel) * 0.018;
    const stagePressure = Math.max(0, Number(soloStage || 0)) * 0.08;
    const healthScale = 1 + levelPressure + stagePressure;
    const damageScale = 1 + levelPressure * 0.62 + stagePressure * 0.7;
    boss.health = Math.round(boss.health * healthScale);
    boss.maxHealth = boss.health;
    boss.attackDamage = Math.max(1, Math.round(boss.attackDamage * damageScale));
    boss.baseAttackDamage = boss.attackDamage;
    boss.encounterLevel = Math.max(1, Math.round(averageLevel + Number(soloStage || 0)));
    return boss;
  }

  function ensureLevelHud() {
    if (levelHud?.root?.isConnected) return levelHud;
    const vitals = document.querySelector(".vitals");
    if (!vitals) return null;
    const root = document.createElement("div");
    root.className = "level-progress";
    root.innerHTML = '<div class="metric-row"><span>NÍVEL</span><strong data-level>1</strong></div><div class="meter level-meter"><i data-level-fill></i></div><small data-level-copy>0 / 28 XP</small>';
    const style = document.createElement("style");
    style.textContent = ".level-progress{margin-top:10px}.level-progress small{display:block;margin-top:5px;font-size:10px;letter-spacing:.12em;color:rgba(222,250,255,.7)}.level-meter i{background:linear-gradient(90deg,#45e6ff,#8b5cf6,#ff4fd8)}";
    document.head.append(style);
    const chargeMeter = vitals.querySelector(".charge-meter");
    if (chargeMeter) chargeMeter.insertAdjacentElement("afterend", root);
    else vitals.prepend(root);
    levelHud = {
      root,
      level: root.querySelector("[data-level]"),
      fill: root.querySelector("[data-level-fill]"),
      copy: root.querySelector("[data-level-copy]")
    };
    return levelHud;
  }

  function updateLevelHud() {
    const hud = ensureLevelHud();
    if (!hud || !player?.levelInitialized) return;
    const ratio = player.level >= LEVEL_CONFIG.maxLevel ? 1 : clamp(player.experience / Math.max(1, player.experienceToNext), 0, 1);
    setTextIfChanged(hud.level, player.level);
    setStyleIfChanged(hud.fill, "width", `${Math.round(ratio * 1000) / 10}%`);
    setTextIfChanged(hud.copy, player.level >= LEVEL_CONFIG.maxLevel
      ? "NÍVEL MÁXIMO"
      : `${Math.floor(player.experience)} / ${player.experienceToNext} XP${player.rareBoostTimer > 0 ? " // IMPULSO ROXO" : ""}`);
  }

  for (const template of bossTemplates) {
    if (template.levelSizeApplied) continue;
    const scale = BOSS_SIZE_SCALES[template.id] || 1.7;
    template.levelSizeApplied = true;
    template.sizeScale = scale;
    template.radius = Math.round((template.radius || template.phases[0].radius) * scale);
    for (const phase of template.phases) phase.radius = Math.round(phase.radius * scale);
  }

  const spawnSoloBossWithoutLevelScaling = spawnSoloBoss;
  spawnSoloBoss = function spawnSoloBossWithLevelScaling(templateId = null) {
    const previousBoss = activeBoss;
    const result = spawnSoloBossWithoutLevelScaling(templateId);
    if (activeBoss && activeBoss !== previousBoss) scaleBossForRun(activeBoss);
    return result;
  };

  const killBotWithoutExperienceDrops = killBot;
  killBot = function killBotWithExperienceDrops(bot, owner = null) {
    const wasDead = Boolean(bot?.dead);
    const prismaShellSplit = Boolean(bot?.archetype === "prisma" && bot?.boss && !bot?.prismaFragment && !bot?.prismaSplit);
    const result = killBotWithoutExperienceDrops(bot, owner);
    if (!wasDead && bot?.dead && !bot.prismaIllusion && !prismaShellSplit) {
      dropExperienceMotes(bot, bot.boss ? 1.45 : 1);
      if (owner && owner !== bot && !owner.dead && !owner.boss) {
        const killExperience = bot.boss ? 80 : Math.max(8, 8 + Number(bot.level || 1) * 3);
        gainExperience(owner, killExperience, bot.boss ? "boss:defeated" : "enemy:defeated");
      }
    }
    return result;
  };

  const SOUNDTRACK_LIBRARY = Object.freeze({
    "signal-drift": Object.freeze({
      title: "SIGNAL DRIFT",
      context: "normal",
      tempo: 84,
      progressions: Object.freeze([
        Object.freeze({ chord: [50, 53, 57], bass: 38 }),
        Object.freeze({ chord: [46, 50, 53], bass: 34 }),
        Object.freeze({ chord: [53, 57, 60], bass: 41 }),
        Object.freeze({ chord: [48, 52, 55], bass: 36 })
      ]),
      melody: Object.freeze([69, null, 72, null, 74, null, 72, null, 67, null, 69, null, 65, null, null, null]),
      wave: "sine",
      brightness: 1,
      density: 0.48
    }),
    "glass-current": Object.freeze({
      title: "GLASS CURRENT",
      context: "normal",
      tempo: 92,
      progressions: Object.freeze([
        Object.freeze({ chord: [52, 55, 59], bass: 40 }),
        Object.freeze({ chord: [48, 52, 55], bass: 36 }),
        Object.freeze({ chord: [55, 59, 62], bass: 43 }),
        Object.freeze({ chord: [50, 54, 57], bass: 38 })
      ]),
      melody: Object.freeze([71, null, 74, 76, null, 74, 71, null, 67, null, 69, 71, null, 67, null, null]),
      wave: "triangle",
      brightness: 1.18,
      density: 0.58
    }),
    "violet-engine": Object.freeze({
      title: "VIOLET ENGINE",
      context: "normal",
      tempo: 98,
      progressions: Object.freeze([
        Object.freeze({ chord: [45, 50, 52], bass: 33 }),
        Object.freeze({ chord: [48, 52, 57], bass: 36 }),
        Object.freeze({ chord: [43, 47, 50], bass: 31 }),
        Object.freeze({ chord: [50, 53, 57], bass: 38 })
      ]),
      melody: Object.freeze([64, 67, null, 69, 72, null, 69, null, 62, 64, null, 67, 69, null, null, null]),
      wave: "triangle",
      brightness: 0.9,
      density: 0.7
    }),
    "fracture-run": Object.freeze({
      title: "FRACTURE RUN",
      context: "danger",
      tempo: 112,
      progressions: Object.freeze([
        Object.freeze({ chord: [43, 46, 50], bass: 31 }),
        Object.freeze({ chord: [41, 45, 48], bass: 29 }),
        Object.freeze({ chord: [46, 50, 53], bass: 34 }),
        Object.freeze({ chord: [39, 43, 46], bass: 27 })
      ]),
      melody: Object.freeze([67, 70, 72, null, 67, 65, 63, null, 70, 72, 75, null, 72, 70, null, null]),
      wave: "sawtooth",
      brightness: 1.3,
      density: 0.88
    }),
    crownfall: Object.freeze({
      title: "CROWNFALL",
      context: "boss",
      tempo: 106,
      progressions: Object.freeze([
        Object.freeze({ chord: [42, 46, 49], bass: 30 }),
        Object.freeze({ chord: [39, 42, 46], bass: 27 }),
        Object.freeze({ chord: [44, 47, 51], bass: 32 }),
        Object.freeze({ chord: [37, 42, 44], bass: 25 })
      ]),
      melody: Object.freeze([66, null, 70, 73, 70, null, 66, 63, 61, null, 66, 68, 70, null, null, null]),
      wave: "square",
      brightness: 0.78,
      density: 0.82
    }),
    "deep-quake": Object.freeze({
      title: "DEEP QUAKE",
      context: "boss",
      tempo: 94,
      progressions: Object.freeze([
        Object.freeze({ chord: [38, 43, 45], bass: 26 }),
        Object.freeze({ chord: [36, 41, 43], bass: 24 }),
        Object.freeze({ chord: [41, 45, 48], bass: 29 }),
        Object.freeze({ chord: [34, 38, 41], bass: 22 })
      ]),
      melody: Object.freeze([57, null, 60, null, 62, 60, 57, null, 55, null, 57, 53, null, null, null, null]),
      wave: "sawtooth",
      brightness: 0.62,
      density: 0.74
    }),
    "terminal-light": Object.freeze({
      title: "TERMINAL LIGHT",
      context: "boss-final",
      tempo: 122,
      progressions: Object.freeze([
        Object.freeze({ chord: [47, 50, 54], bass: 35 }),
        Object.freeze({ chord: [45, 49, 52], bass: 33 }),
        Object.freeze({ chord: [50, 54, 57], bass: 38 }),
        Object.freeze({ chord: [43, 47, 50], bass: 31 })
      ]),
      melody: Object.freeze([71, 74, 78, 76, 74, 71, 69, 71, 76, 78, 81, 78, 76, 74, 71, null]),
      wave: "triangle",
      brightness: 1.35,
      density: 1
    })
  });

  const NORMAL_SOUNDTRACK_IDS = Object.freeze(["signal-drift", "glass-current", "violet-engine"]);

  function soundtrackProfile(id) {
    return SOUNDTRACK_LIBRARY[id] || SOUNDTRACK_LIBRARY["signal-drift"];
  }

  function chooseNextSoundtrack(ids, currentId, randomValue = Math.random()) {
    const options = ids.filter((id) => id !== currentId);
    const pool = options.length > 0 ? options : ids;
    return pool[Math.min(pool.length - 1, Math.floor(clamp(randomValue, 0, 0.999999) * pool.length))];
  }

  function bossSoundtrackId(boss) {
    if (!boss) return null;
    if (boss.bossPhaseIndex >= Math.max(1, (boss.bossTemplate?.phases?.length || 2) - 1)) return "terminal-light";
    if (boss.archetype === "tremor-deep") return "deep-quake";
    if (boss.archetype === "coroa-vazia") return "crownfall";
    return "terminal-light";
  }

  function requestSoundtrack(id) {
    if (!musicActive || !musicLayers.input || !SOUNDTRACK_LIBRARY[id]) return false;
    if (musicLayers.trackId === id || musicLayers.pendingTrackId === id) return false;
    musicLayers.pendingTrackId = id;
    return true;
  }

  function activatePendingSoundtrack() {
    if (!musicLayers.pendingTrackId) return;
    musicLayers.previousTrackId = musicLayers.trackId || null;
    musicLayers.trackId = musicLayers.pendingTrackId;
    musicLayers.pendingTrackId = null;
    musicLayers.trackStartedAt = runTime;
    try {
      window.EchoCore?.events?.emit("audio:soundtrack-changed", {
        id: musicLayers.trackId,
        title: soundtrackProfile(musicLayers.trackId).title,
        previousId: musicLayers.previousTrackId
      });
    } catch (_error) {}
  }

  function scheduleSoundtrackStep(start, step) {
    if (!musicActive || !musicLayers.input) return;
    if (step % 64 === 0) activatePendingSoundtrack();
    const track = soundtrackProfile(musicLayers.trackId);
    const intensity = musicLayers.intensity || 0.3;
    const barIndex = Math.floor(step / 16) % track.progressions.length;
    const localStep = step % 16;
    const progression = track.progressions[barIndex];
    const density = track.density;

    if (localStep === 0) schedulePadChord(progression.chord, start, intensity * track.brightness);

    if (localStep % 4 === 0) {
      scheduleMusicKick(start, (localStep === 0 ? 1.08 : 0.84) * (0.82 + density * 0.25));
      const bassNote = localStep === 8 ? progression.bass + (track.context === "boss" ? 5 : 7) : progression.bass;
      scheduleMusicTone({
        note: bassNote,
        start,
        duration: musicLayers.trackId === "deep-quake" ? 0.3 : 0.22,
        type: track.context.startsWith("boss") ? "sawtooth" : "triangle",
        volume: 0.036 + intensity * 0.018,
        attack: 0.008,
        release: 0.24,
        cutoff: (650 + intensity * 520) * track.brightness
      });
    }

    if (localStep === 4 || localStep === 12 || (density > 0.9 && localStep === 8)) {
      scheduleMusicSnare(start, 0.72 + density * 0.45);
    }

    if (intensity > 0.36 && localStep % (density > 0.76 ? 2 : 4) === 0) {
      scheduleMusicNoise(start, 0.045, 0.004 + intensity * 0.004 * density, 5000 * track.brightness, "highpass");
    }

    if (localStep % 2 === 0) {
      const arpeggioIndex = (localStep / 2 + barIndex) % progression.chord.length;
      const arpeggioNote = progression.chord[arpeggioIndex] + 12;
      scheduleMusicTone({
        note: arpeggioNote,
        start,
        duration: 0.065 + (1 - density) * 0.03,
        type: track.wave,
        volume: 0.008 + intensity * 0.013,
        attack: 0.004,
        release: 0.16 + density * 0.08,
        cutoff: (1900 + intensity * 2800) * track.brightness,
        echo: true
      });
    }

    const melodyNote = track.melody[step % track.melody.length];
    if (melodyNote && intensity > 0.43) {
      scheduleMusicTone({
        note: melodyNote,
        start: start + 0.012,
        duration: track.context.startsWith("boss") ? 0.18 : 0.12,
        type: track.wave,
        volume: 0.009 + intensity * 0.011,
        attack: 0.018,
        release: 0.26,
        cutoff: (2800 + intensity * 2500) * track.brightness,
        echo: true
      });
    }

    if (track.context.startsWith("boss") && localStep % 4 === 2) {
      const accentNote = progression.chord[Math.floor(localStep / 4) % progression.chord.length] + 24;
      scheduleMusicTone({
        note: accentNote,
        start,
        duration: 0.05,
        type: "square",
        volume: 0.006 + density * 0.003,
        attack: 0.003,
        release: 0.11,
        cutoff: 2300 * track.brightness
      });
    }
  }

  scheduleMusicStep = scheduleSoundtrackStep;

  const startMusicWithoutSoundtrack = startMusic;
  startMusic = function startMusicWithSoundtrack() {
    const result = startMusicWithoutSoundtrack();
    if (musicActive && musicLayers.input) {
      const initialId = chooseNextSoundtrack(NORMAL_SOUNDTRACK_IDS, null);
      Object.assign(musicLayers, {
        trackId: initialId,
        previousTrackId: null,
        pendingTrackId: null,
        trackStartedAt: runTime,
        rotateAt: runTime + 34 + Math.random() * 14
      });
      musicLayers.tempo = soundtrackProfile(initialId).tempo;
    }
    return result;
  };

  const updateMusicWithoutSoundtrack = updateMusic;
  updateMusic = function updateMusicWithSoundtrack() {
    updateMusicWithoutSoundtrack();
    if (!musicActive || !musicLayers.master) return;
    const bossTrack = bossSoundtrackId(activeBoss && !activeBoss.dead ? activeBoss : null);
    let desiredTrack = bossTrack;
    if (!desiredTrack && Number(soloStage || 0) >= 3) desiredTrack = "fracture-run";
    if (!desiredTrack && runTime >= Number(musicLayers.rotateAt || 0)) {
      desiredTrack = chooseNextSoundtrack(NORMAL_SOUNDTRACK_IDS, musicLayers.trackId);
      musicLayers.rotateAt = runTime + 34 + Math.random() * 14;
    }
    if (!desiredTrack && !NORMAL_SOUNDTRACK_IDS.includes(musicLayers.trackId)) {
      desiredTrack = chooseNextSoundtrack(NORMAL_SOUNDTRACK_IDS, musicLayers.trackId);
    }
    if (desiredTrack) requestSoundtrack(desiredTrack);

    const targetTrack = soundtrackProfile(musicLayers.pendingTrackId || musicLayers.trackId);
    const pressureTempo = targetTrack.tempo + Math.min(8, Number(soloStage || 0) * 1.5);
    musicLayers.tempo += (pressureTempo - musicLayers.tempo) * 0.035;
  };

  const drawEntityWithoutLevelPresentation = drawEntity;
  drawEntity = function drawEntityWithLevelPresentation(entity, isPlayer = false, spectral = false, time = 0, override = null) {
    const result = drawEntityWithoutLevelPresentation(entity, isPlayer, spectral, time, override);
    const renderX = override?.x ?? entity?.x;
    const renderY = override?.y ?? entity?.y;
    if (spectral || !entity?.levelInitialized || entity.boss || !visible(renderX, renderY, 80)) return result;
    const point = toScreen(renderX, renderY);
    const radius = (entity.radius || 16) * camera.zoom;
    const pulse = entity.levelPulseTimer > 0 ? 0.72 + Math.sin(time * 0.018) * 0.22 : 0.68;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `700 ${isPlayer ? 11 : 9}px Inter, sans-serif`;
    ctx.fillStyle = hsl(entity.hue, 92, 76, pulse);
    ctx.fillText(`LV ${entity.level}`, point.x, point.y + radius + (isPlayer ? 25 : 21));
    ctx.restore();
    return result;
  };

  updateLeaderboard = function updateLeaderboardWithLevels() {
    const visibleBots = activeMode === "multiplayer" ? bots : bots.filter((bot) => !bot.dead);
    const entries = visibleBots.map((bot) => ({
      name: bot.name,
      score: Math.floor(bot.score || 0),
      level: Number(bot.level || 1),
      player: false
    }));
    entries.push({
      name: player.name,
      score: Math.floor(player.score),
      level: Number(player.level || 1),
      player: true
    });
    entries.sort((a, b) => b.score - a.score || b.level - a.level);
    ui.leaderboard.replaceChildren();
    for (const [index, entry] of entries.slice(0, 6).entries()) {
      const item = document.createElement("li");
      if (entry.player) item.className = "is-player";
      item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(entry.name)} <small>LV ${entry.level}</small></strong><em>${entry.score}</em>`;
      ui.leaderboard.append(item);
    }
  };

  window.EchoRunProgression = Object.freeze({
    config: LEVEL_CONFIG,
    bossSizeScales: BOSS_SIZE_SCALES,
    experienceForLevel,
    experienceValueForMote,
    entityPower,
    averageCombatLevel
  });

  window.EchoSoundtrack = Object.freeze({
    library: SOUNDTRACK_LIBRARY,
    normalTrackIds: NORMAL_SOUNDTRACK_IDS,
    chooseNextSoundtrack,
    current() {
      const id = musicLayers.trackId || null;
      return id ? { id, ...soundtrackProfile(id) } : null;
    }
  });

  const STATE_SOUNDTRACK_LIBRARY = Object.freeze({
    "menu-echo": Object.freeze({
      title: "MENU ECHO",
      context: "menu",
      tempo: 72,
      progressions: Object.freeze([
        Object.freeze({ chord: [48, 52, 55], bass: 36 }),
        Object.freeze({ chord: [46, 50, 53], bass: 34 }),
        Object.freeze({ chord: [43, 48, 50], bass: 31 }),
        Object.freeze({ chord: [45, 48, 52], bass: 33 })
      ]),
      melody: Object.freeze([67, null, null, 71, null, null, 69, null, 64, null, null, 67, null, null, null, null]),
      wave: "sine",
      brightness: 0.72,
      density: 0.28
    }),
    "victory-rise": Object.freeze({
      title: "VICTORY RISE",
      context: "victory",
      tempo: 98,
      progressions: Object.freeze([
        Object.freeze({ chord: [53, 57, 60], bass: 41 }),
        Object.freeze({ chord: [55, 59, 62], bass: 43 }),
        Object.freeze({ chord: [57, 60, 64], bass: 45 }),
        Object.freeze({ chord: [60, 64, 67], bass: 48 })
      ]),
      melody: Object.freeze([72, 76, 79, null, 76, 79, 84, null, 81, 79, 76, 79, 84, null, null, null]),
      wave: "triangle",
      brightness: 1.32,
      density: 0.66
    }),
    "defeat-fall": Object.freeze({
      title: "DEFEAT FALL",
      context: "defeat",
      tempo: 66,
      progressions: Object.freeze([
        Object.freeze({ chord: [45, 48, 52], bass: 33 }),
        Object.freeze({ chord: [43, 46, 50], bass: 31 }),
        Object.freeze({ chord: [41, 45, 48], bass: 29 }),
        Object.freeze({ chord: [38, 43, 45], bass: 26 })
      ]),
      melody: Object.freeze([64, null, 62, null, 60, null, 57, null, 55, null, 52, null, 50, null, null, null]),
      wave: "sine",
      brightness: 0.58,
      density: 0.32
    })
  });

  const soundtrackProfileWithoutStateTracks = soundtrackProfile;
  soundtrackProfile = function soundtrackProfileWithStateTracks(id) {
    return STATE_SOUNDTRACK_LIBRARY[id] || soundtrackProfileWithoutStateTracks(id);
  };

  let stateSoundtrackToken = 0;

  function activateStateSoundtrack(id, expectedState = null) {
    if (expectedState && state !== expectedState) return false;
    initAudio();
    if (!audioContext) return false;
    if (!musicActive) startMusic();
    if (!musicLayers.input) return false;
    const profile = soundtrackProfile(id);
    musicLayers.previousTrackId = musicLayers.trackId || null;
    musicLayers.trackId = id;
    musicLayers.pendingTrackId = null;
    musicLayers.trackStartedAt = runTime;
    musicLayers.rotateAt = Number.POSITIVE_INFINITY;
    musicLayers.step = 0;
    musicLayers.nextNoteTime = audioContext.currentTime + 0.06;
    musicLayers.tempo = profile.tempo;
    musicLayers.intensity = id === "victory-rise" ? 0.7 : id === "defeat-fall" ? 0.42 : 0.3;
    try {
      window.EchoCore?.events?.emit("audio:soundtrack-changed", {
        id,
        title: profile.title,
        previousId: musicLayers.previousTrackId,
        state: expectedState || state
      });
    } catch (_error) {}
    return true;
  }

  function scheduleStateSoundtrack(id, expectedState, delay = 420) {
    const token = ++stateSoundtrackToken;
    window.setTimeout(() => {
      if (token !== stateSoundtrackToken) return;
      activateStateSoundtrack(id, expectedState);
    }, delay);
  }

  const finishSoloWithoutStateSoundtrack = finishSolo;
  finishSolo = function finishSoloWithStateSoundtrack(outcome = "defeat") {
    const result = finishSoloWithoutStateSoundtrack(outcome);
    scheduleStateSoundtrack(outcome === "victory" ? "victory-rise" : "defeat-fall", "gameover");
    return result;
  };

  const finishMultiplayerWithoutStateSoundtrack = finishMultiplayer;
  finishMultiplayer = function finishMultiplayerWithStateSoundtrack(standings = []) {
    const rank = Math.max(1, standings.findIndex((entry) => entry.id === multiplayerPlayerId) + 1);
    const result = finishMultiplayerWithoutStateSoundtrack(standings);
    stopMusic();
    scheduleStateSoundtrack(rank === 1 ? "victory-rise" : "defeat-fall", "gameover");
    return result;
  };

  const returnToMenuWithoutStateSoundtrack = returnToMenu;
  returnToMenu = function returnToMenuWithStateSoundtrack(message = "", isError = false) {
    const result = returnToMenuWithoutStateSoundtrack(message, isError);
    scheduleStateSoundtrack("menu-echo", "intro");
    return result;
  };

  const startSoloGameWithoutStateSoundtrack = startSoloGame;
  startSoloGame = function startSoloGameWithoutMenuTrack() {
    stateSoundtrackToken += 1;
    if (musicActive) stopMusic();
    return startSoloGameWithoutStateSoundtrack();
  };

  const connectMultiplayerWithoutStateSoundtrack = connectMultiplayer;
  connectMultiplayer = function connectMultiplayerWithoutMenuTrack(roomCode = "") {
    stateSoundtrackToken += 1;
    if (musicActive) stopMusic();
    return connectMultiplayerWithoutStateSoundtrack(roomCode);
  };

  const applyMultiplayerSnapshotWithoutSoundtrack = applyMultiplayerSnapshot;
  applyMultiplayerSnapshot = function applyMultiplayerSnapshotWithSoundtrack(snapshot) {
    const result = applyMultiplayerSnapshotWithoutSoundtrack(snapshot);
    if (activeMode === "multiplayer" && state === "playing" && !musicActive) {
      initAudio();
      startMusic();
    }
    return result;
  };

  const updateMultiplayerWithoutSoundtrack = updateMultiplayer;
  updateMultiplayer = function updateMultiplayerWithSoundtrack(dt) {
    const result = updateMultiplayerWithoutSoundtrack(dt);
    if (activeMode === "multiplayer" && state === "playing") updateMusic();
    return result;
  };

  function enableInitialMenuSoundtrack() {
    if (state !== "intro" || musicActive) return;
    activateStateSoundtrack("menu-echo", "intro");
  }

  document.addEventListener("pointerdown", enableInitialMenuSoundtrack, { once: true, capture: true });
  document.addEventListener("keydown", enableInitialMenuSoundtrack, { once: true, capture: true });

  window.EchoSoundtrack = Object.freeze({
    library: Object.freeze({ ...SOUNDTRACK_LIBRARY, ...STATE_SOUNDTRACK_LIBRARY }),
    normalTrackIds: NORMAL_SOUNDTRACK_IDS,
    chooseNextSoundtrack,
    activateStateSoundtrack,
    current() {
      const id = musicLayers.trackId || null;
      return id ? { id, ...soundtrackProfile(id) } : null;
    }
  });

  function progressionFromScore(score) {
    const total = Math.max(0, Math.floor(Number(score || 0)));
    let level = 1;
    let experience = total;
    let required = experienceForLevel(level);
    while (level < LEVEL_CONFIG.maxLevel && experience >= required) {
      experience -= required;
      level += 1;
      required = experienceForLevel(level);
    }
    if (level >= LEVEL_CONFIG.maxLevel) experience = 0;
    return {
      level,
      experience,
      experienceToNext: required
    };
  }

  function applyMultiplayerLevelPresentation(entity, kind = "bot") {
    if (!entity) return entity;
    const progression = progressionFromScore(entity.score);
    const config = kind === "player" ? LEVEL_CONFIG.player : LEVEL_CONFIG.bot;
    if (!Number.isFinite(entity.multiplayerBaseRadius)) {
      entity.multiplayerBaseRadius = Math.max(1, Number(entity.radius || (kind === "player" ? 18 : 16)));
    }
    const steps = Math.max(0, progression.level - 1);
    entity.levelInitialized = true;
    entity.levelKind = kind;
    entity.level = progression.level;
    entity.experience = progression.experience;
    entity.experienceToNext = progression.experienceToNext;
    entity.levelScale = Math.min(config.maxRadiusScale, 1 + steps * config.radiusPerLevel);
    entity.levelSpeedScale = Math.max(config.minimumSpeedScale, 1 - steps * config.speedLossPerLevel);
    entity.radius = entity.multiplayerBaseRadius * entity.levelScale;
    entity.levelPulseTimer = Math.max(0, Number(entity.levelPulseTimer || 0));
    return entity;
  }

  function applyMultiplayerLevelsToSnapshot() {
    if (activeMode !== "multiplayer") return;
    applyMultiplayerLevelPresentation(player, "player");
    for (const entity of bots) applyMultiplayerLevelPresentation(entity, "bot");
    updateLevelHud();
    updateLeaderboard();
  }

  const applyMultiplayerSnapshotWithoutLevels = applyMultiplayerSnapshot;
  applyMultiplayerSnapshot = function applyMultiplayerSnapshotWithLevels(snapshot) {
    const result = applyMultiplayerSnapshotWithoutLevels(snapshot);
    applyMultiplayerLevelsToSnapshot();
    return result;
  };

  const updateMultiplayerWithoutLevelPresentation = updateMultiplayer;
  updateMultiplayer = function updateMultiplayerWithLevelPresentation(dt) {
    const result = updateMultiplayerWithoutLevelPresentation(dt);
    if (activeMode === "multiplayer" && multiplayerSnapshot) {
      applyMultiplayerLevelPresentation(player, "player");
      for (const entity of bots) applyMultiplayerLevelPresentation(entity, "bot");
      updateLevelHud();
    }
    return result;
  };

  window.EchoMultiplayerLevels = Object.freeze({
    progressionFromScore,
    applyMultiplayerLevelPresentation
  });

  window.__echoDebug = {
    startSoloGame,
    beginPhase,
    endPhase,
    useClassSpecial,
    setClass(classId) {
      selectedClassId = normalizeClassId(classId);
      classSpecialCooldown = 0;
      if (player) applyEntityClass(player, selectedClassId);
    },
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
          mutations: [...(player.mutations || [])],
          classId: player.classId,
          classLevel: player.classLevel,
          classResource: player.classResource,
          classEffects: { projectiles: classProjectiles.length, traps: classTraps.length, fields: classFields.length, minions: classMinions.length }
        },
        mode: activeMode,
        roomCode: multiplayerRoomCode,
        counts: { bots: bots.filter((bot) => !bot.dead).length, motes: motes.length, particles: particles.length },
        performance: {
          frameMs: Math.round(renderPerformance.averageFrameMs * 10) / 10,
          workMs: Math.round(renderPerformance.averageWorkMs * 10) / 10,
          dpr: Math.round(dpr * 100) / 100,
          nativeDpr: renderPerformance.maximumDpr,
          scaleChanges: renderPerformance.scaleChanges
        }
      };
    }
  };
}());
