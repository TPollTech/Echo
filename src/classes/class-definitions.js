/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0125__*/
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
/*__ECHO_SECTION_END:0125__*/
