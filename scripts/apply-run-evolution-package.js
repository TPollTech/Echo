"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(ROOT, relativePath), content, "utf8");
}

function replaceOnce(content, search, replacement, label) {
  const index = content.indexOf(search);
  if (index < 0) throw new Error(`Trecho não encontrado: ${label}`);
  if (content.indexOf(search, index + search.length) >= 0) throw new Error(`Trecho duplicado: ${label}`);
  return content.slice(0, index) + replacement + content.slice(index + search.length);
}

function replaceBetween(content, startMarker, endMarker, replacement, label) {
  const start = content.indexOf(startMarker);
  if (start < 0) throw new Error(`Início não encontrado: ${label}`);
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`Fim não encontrado: ${label}`);
  return content.slice(0, start) + replacement + content.slice(end);
}

function edit(relativePath, transform) {
  const before = read(relativePath);
  const after = transform(before);
  if (after === before) throw new Error(`Nenhuma alteração aplicada em ${relativePath}`);
  write(relativePath, after);
}

edit("src/enemies/enemy-ai.js", (source) => {
  source = replaceOnce(source,
`        if (bot.health < bot.maxHealth * 0.4) {
          bot.speed = bot.baseSpeed * 1.4;
          bot.attackDamage = Math.ceil(definition.attackDamage * 1.5);
        } else {
          bot.speed = bot.baseSpeed;
          bot.attackDamage = definition.attackDamage;
        }`,
`        const speedScale = bot.runSpeedScale || 1;
        const powerScale = bot.powerScale || 1;
        if (bot.health < bot.maxHealth * 0.4) {
          bot.speed = bot.baseSpeed * speedScale * 1.4;
          bot.attackDamage = Math.ceil(definition.attackDamage * powerScale * 1.5);
        } else {
          bot.speed = bot.baseSpeed * speedScale;
          bot.attackDamage = definition.attackDamage * powerScale;
        }`, "berserker escalável");

  source = replaceOnce(source,
`        bot.speed = bot.baseSpeed * (1 + Math.min(0.3, nearbyPack * 0.1));`,
`        bot.speed = bot.baseSpeed * (bot.runSpeedScale || 1) * (1 + Math.min(0.3, nearbyPack * 0.1));`, "swarmer escalável");

  source = replaceOnce(source,
`      bot.hitTimer = Math.max(0, bot.hitTimer - dt);
      bot.thinkTimer -= dt;`,
`      bot.hitTimer = Math.max(0, bot.hitTimer - dt);
      bot.levelPulse = Math.max(0, (bot.levelPulse || 0) - dt * 1.8);
      bot.thinkTimer -= dt;`, "pulso de nível dos bots");

  source = replaceBetween(source,
`      if (bot.thinkTimer <= 0) {`,
`      behavior.updateTarget?.(bot, dt);`,
`      if (bot.thinkTimer <= 0) {
        bot.thinkTimer = random(0.45, 1.1);
        bot.factionTarget = null;
        const intent = chooseBotTacticalIntent(bot);
        bot.currentIntent = intent?.type || "roam";
        if (intent) {
          bot.targetX = intent.x;
          bot.targetY = intent.y;
          if (intent.type === "attack" && intent.target && intent.target !== player) bot.factionTarget = intent.target;
        } else {
          bot.targetX = clamp(bot.x + random(-360, 360), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
          bot.targetY = clamp(bot.y + random(-360, 360), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        }
      }

      if (bot.currentIntent !== "resource" && bot.currentIntent !== "flee") {
        behavior.updateTarget?.(bot, dt);
      }`, "decisão tática dos bots");

  source = replaceOnce(source,
`      if (behavior.phaseAttack !== false && !bot.stealthed && !(bot.boss && bot.bossPhaseTransitioning)) {`,
`      if (behavior.phaseAttack !== false && bot.currentIntent !== "resource" && bot.currentIntent !== "flee" && !bot.stealthed && !(bot.boss && bot.bossPhaseTransitioning)) {`, "bloqueio de ataque durante coleta ou fuga");

  source = replaceOnce(source,
`    if (bot.heavyHit) maxTravel = 350;
    const travel = clamp(distance + 70, 150, maxTravel);`,
`    if (bot.heavyHit) maxTravel = 350;
    maxTravel *= bot.rangeScale || 1;
    const travel = clamp(distance + 70, 150, maxTravel);`, "alcance de fase por nível");

  source = replaceOnce(source,
`    if (bot.heavyHit) phaseVelocity = 350;
    bot.phasing = true;`,
`    if (bot.heavyHit) phaseVelocity = 350;
    phaseVelocity *= Math.max(0.88, bot.runSpeedScale || 1);
    bot.phasing = true;`, "velocidade de fase por nível");
  return source;
});

edit("src/bosses/boss-definitions.js", (source) => {
  const scales = [
    ["coroa-vazia", 34, 2.1],
    ["espectro-decisivo", 30, 2.05],
    ["tremor-deep", 42, 2.45],
    ["necrostro", 32, 2.1],
    ["vortice", 36, 2.2],
    ["cicatriz", 28, 2.15],
    ["mimico", 26, 1.95],
    ["prisma", 24, 2.0],
    ["silenciador", 30, 2.1]
  ];
  for (const [id, radius, scale] of scales) {
    const marker = `      id: "${id}",`;
    const start = source.indexOf(marker);
    if (start < 0) throw new Error(`Boss ausente: ${id}`);
    const radiusMarker = `      radius: ${radius},`;
    const radiusIndex = source.indexOf(radiusMarker, start);
    if (radiusIndex < 0) throw new Error(`Raio do boss ausente: ${id}`);
    source = source.slice(0, radiusIndex) + `${radiusMarker}\n      scale: ${scale},` + source.slice(radiusIndex + radiusMarker.length);
  }
  return source;
});

edit("src/bosses/boss-controller.js", (source) => {
  source = replaceBetween(source,
`  function createBoss(templateId = null) {`,
`\n\n/*__ECHO_SECTION_END:0032__*/`,
`  function createBoss(templateId = null) {
    const template = bossTemplates.find((entry) => entry.id === templateId)
      || bossTemplates[Math.floor(Math.random() * bossTemplates.length)];
    const phase0 = template.phases[0];
    const scaling = calculateBossRunScaling(template, [player, ...bots], soloStage, runTime);
    const maxHealth = Math.round(480 * scaling.healthScale);
    const speed = phase0.speed * scaling.speedScale;
    const attackDamage = phase0.attackDamage * scaling.damageScale;
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
      bossScale: scaling.sizeScale,
      bossDamageScale: scaling.damageScale,
      bossSpeedScale: scaling.speedScale,
      level: scaling.level,
      radius: phase0.radius * scaling.sizeScale,
      hue: template.hue,
      health: maxHealth,
      maxHealth,
      energy: phase0.energy,
      score: template.score,
      aggression: phase0.aggression,
      speed,
      baseSpeed: speed,
      attackDamage,
      baseAttackDamage: attackDamage,
      cooldown: 1.2,
      respawnTimer: 0,
      telegraphType: null,
      telegraphTimer: 0,
      telegraphMaxTimer: 0,
      telegraphRadius: 0,
      telegraphProjectiles: 0
    });
  }`, "criação adaptativa de boss");

  source = replaceOnce(source, `          radius: 17,`, `          radius: 17 * Math.max(1.25, (bot.bossScale || 2) * 0.55),`, "tamanho dos fragmentos do Prisma");

  source = replaceBetween(source,
`    if (!bot.prismaIllusion) {`,
`\n\n    if (bot.silenceAnchor)`,
`    if (!bot.prismaIllusion) {
      const moteCount = bot.boss ? 14 : bot.bossClone ? 5 : 2;
      for (let i = 0; i < moteCount; i += 1) {
        const mote = createMote();
        mote.x = clamp(bot.x + random(-55, 55), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        mote.y = clamp(bot.y + random(-55, 55), WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
        mote.type = i < 2 ? "gold" : i === 2 ? "red" : Math.random() > 0.45 ? "violet" : "cyan";
        motes.push(mote);
      }
      if (!bot.boss && !bot.bossClone) spawnRunExperienceDrops(bot, bot.x, bot.y);
    }`, "drops ligados à experiência");

  source = replaceBetween(source,
`    } else if (owner && owner !== player && !owner.dead && !bot.prismaIllusion) {`,
`\n\n    if (bot.prismaFragment)`,
`    } else if (owner && owner !== player && !owner.dead && !bot.prismaIllusion) {
      owner.score += 18;
      owner.health = Math.min(owner.maxHealth, owner.health + 8);
      owner.energy = Math.min(100, owner.energy + 20);
      const levelResult = grantRunExperience(owner, 4 + Math.max(1, bot.level || 1) * 2);
      notifyRunLevelGain(owner, levelResult);
      burst(owner.x, owner.y, owner.hue, 8);
    }`, "experiência por eliminação dos bots");

  source = replaceOnce(source,
`      bot.speed = phase.speed;
      bot.aggression = phase.aggression;
      bot.radius = phase.radius;
      bot.attackDamage = phase.attackDamage;`,
`      bot.speed = phase.speed * (bot.bossSpeedScale || 1);
      bot.baseSpeed = bot.speed;
      bot.aggression = phase.aggression;
      bot.radius = phase.radius * (bot.bossScale || bot.bossTemplate.scale || 2);
      bot.attackDamage = phase.attackDamage * (bot.bossDamageScale || 1);
      bot.baseAttackDamage = bot.attackDamage;`, "escala nas fases do boss");
  return source;
});

edit("src/audio/audio-engine.js", (source) => {
  const tracks = `  const MUSIC_TRACKS = [
    {
      id: "drift",
      moods: ["normal", "low"],
      tempo: 82,
      leadType: "sine",
      progressions: [
        { chord: [50, 53, 57], bass: 38 }, { chord: [46, 50, 53], bass: 34 },
        { chord: [53, 57, 60], bass: 41 }, { chord: [48, 52, 55], bass: 36 }
      ],
      melody: [69, null, 72, null, 74, null, 72, null, 67, null, 69, null, 65, null, null, null, 69, null, 70, null, 72, null, 69, null, 67, null, 65, null, 62, null, null, null]
    },
    {
      id: "signal",
      moods: ["normal", "high"],
      tempo: 90,
      leadType: "triangle",
      progressions: [
        { chord: [48, 52, 55], bass: 36 }, { chord: [55, 59, 62], bass: 43 },
        { chord: [50, 53, 57], bass: 38 }, { chord: [45, 48, 52], bass: 33 }
      ],
      melody: [72, null, 74, 76, null, 74, 72, null, 67, 69, null, 72, null, 69, 67, null, 64, null, 67, 69, null, 72, 74, null, 72, 69, null, 67, 64, null, null, null]
    },
    {
      id: "fracture",
      moods: ["high", "danger"],
      tempo: 98,
      leadType: "sawtooth",
      progressions: [
        { chord: [45, 48, 52], bass: 33 }, { chord: [46, 50, 53], bass: 34 },
        { chord: [43, 46, 50], bass: 31 }, { chord: [48, 51, 55], bass: 36 }
      ],
      melody: [69, 70, null, 74, 72, null, 70, 69, 67, null, 70, 72, 74, null, 77, null, 76, 74, 72, null, 70, 67, 69, null, 65, 67, 69, 70, null, 69, null, null]
    },
    {
      id: "terminal",
      moods: ["danger"],
      tempo: 104,
      leadType: "square",
      progressions: [
        { chord: [41, 45, 48], bass: 29 }, { chord: [43, 46, 50], bass: 31 },
        { chord: [40, 43, 47], bass: 28 }, { chord: [45, 48, 52], bass: 33 }
      ],
      melody: [77, null, 76, 74, 72, null, 70, 69, 67, 69, 70, null, 74, 72, 70, null, 65, 67, 69, 70, 72, 74, 76, null, 77, 76, 74, 72, 70, null, null, null]
    },
    {
      id: "crown",
      moods: ["boss"],
      tempo: 108,
      leadType: "triangle",
      progressions: [
        { chord: [38, 41, 45], bass: 26 }, { chord: [41, 45, 48], bass: 29 },
        { chord: [36, 40, 43], bass: 24 }, { chord: [43, 46, 50], bass: 31 }
      ],
      melody: [74, 77, 79, null, 77, 74, 72, null, 70, 74, 77, null, 79, 81, 79, null, 77, 74, 72, 70, 72, 74, 77, null, 82, 81, 79, 77, 74, null, null, null]
    },
    {
      id: "void",
      moods: ["boss"],
      tempo: 114,
      leadType: "sawtooth",
      progressions: [
        { chord: [35, 38, 42], bass: 23 }, { chord: [40, 43, 47], bass: 28 },
        { chord: [37, 41, 44], bass: 25 }, { chord: [42, 45, 49], bass: 30 }
      ],
      melody: [82, null, 79, 77, 74, 77, 79, null, 84, 82, 81, 79, 77, null, 74, null, 72, 74, 77, 79, 81, 82, 84, null, 86, 84, 82, 79, 77, 74, null, null]
    }
  ];`;
  source = replaceBetween(source, `  const MUSIC_PROGRESSIONS = [`, `\n\n/*__ECHO_SECTION_END:0037__*/`, tracks, "catálogo de soundtrack");

  const scheduler = `  function scheduleMusicStep(start, step) {
    if (!musicActive || !musicLayers.input) return;
    const intensity = musicLayers.intensity || 0.3;
    const bossMode = Boolean(musicLayers.bossMode);
    const track = MUSIC_TRACKS[musicLayers.trackIndex || 0] || MUSIC_TRACKS[0];
    const barIndex = Math.floor(step / 16) % track.progressions.length;
    const localStep = step % 16;
    const progression = track.progressions[barIndex];

    if (localStep === 0) schedulePadChord(progression.chord, start, intensity);

    if (localStep % 4 === 0) {
      scheduleMusicKick(start, localStep === 0 ? 1.08 : 0.86);
      const bassNote = localStep === 8 ? progression.bass + 7 : progression.bass;
      scheduleMusicTone({ note: bassNote, start, duration: 0.22, type: "triangle", volume: 0.045 + intensity * 0.012, attack: 0.008, release: 0.22, cutoff: 720 + intensity * 420 });
    }

    if (localStep === 4 || localStep === 12) scheduleMusicSnare(start, bossMode ? 1.12 : 0.9);
    if (intensity > 0.4 && localStep % 2 === 0) scheduleMusicNoise(start, 0.045, 0.0055 + intensity * 0.003, 5600, "highpass");

    if (localStep % 2 === 0) {
      const arpeggioIndex = (localStep / 2 + barIndex) % progression.chord.length;
      scheduleMusicTone({ note: progression.chord[arpeggioIndex] + 12, start, duration: 0.07, type: "triangle", volume: 0.012 + intensity * 0.012, attack: 0.004, release: 0.18, cutoff: 2200 + intensity * 2600, echo: true });
    }

    const melodyNote = track.melody[step % track.melody.length];
    if (melodyNote && intensity > 0.48) {
      scheduleMusicTone({ note: melodyNote, start: start + 0.012, duration: bossMode ? 0.18 : 0.12, type: track.leadType, volume: 0.012 + intensity * 0.009, attack: 0.02, release: 0.28, cutoff: 3000 + intensity * 2600, echo: true });
    }

    if (bossMode && localStep % 4 === 2) {
      const accentNote = progression.chord[Math.floor(localStep / 4) % progression.chord.length] + 24;
      scheduleMusicTone({ note: accentNote, start, duration: 0.05, type: "square", volume: 0.007, attack: 0.003, release: 0.11, cutoff: 2500 });
    }
  }`;
  source = replaceBetween(source, `  function scheduleMusicStep(start, step) {`, `\n\n/*__ECHO_SECTION_END:0041__*/`, scheduler, "scheduler por faixa");
  return source;
});

edit("src/audio/music.js", (source) => {
  const selector = `  function selectNextMusicTrack(stateKey, force = false) {
    if (!musicLayers || !MUSIC_TRACKS.length) return;
    const candidates = MUSIC_TRACKS.map((track, index) => ({ track, index })).filter(({ track }) => track.moods.includes(stateKey));
    const pool = candidates.length ? candidates : MUSIC_TRACKS.map((track, index) => ({ track, index }));
    let choices = pool.filter(({ index }) => index !== musicLayers.trackIndex);
    if (!choices.length) choices = pool;
    const chosen = choices[Math.floor(Math.random() * choices.length)] || pool[0];
    if (!chosen) return;
    musicLayers.lastTrackIndex = musicLayers.trackIndex;
    musicLayers.trackIndex = chosen.index;
    musicLayers.stateKey = stateKey;
    musicLayers.pendingState = null;
    if (force) musicLayers.tempo = chosen.track.tempo;
  }

`;
  source = replaceOnce(source, `  function musicScheduler() {`, `${selector}  function musicScheduler() {`, "seletor de faixa");
  source = replaceOnce(source,
`    while (musicLayers.nextNoteTime < audioContext.currentTime + MUSIC_SCHEDULE_AHEAD) {
      scheduleMusicStep(musicLayers.nextNoteTime, musicLayers.step);`,
`    while (musicLayers.nextNoteTime < audioContext.currentTime + MUSIC_SCHEDULE_AHEAD) {
      if (musicLayers.step === 0) selectNextMusicTrack(musicLayers.pendingState || musicLayers.stateKey || "normal");
      scheduleMusicStep(musicLayers.nextNoteTime, musicLayers.step);`, "troca entre músicas");

  source = replaceOnce(source,
`      tempo: 86,
      intensity: 0.32,
      bossMode: false
    };
    musicLayers.timer = window.setInterval(musicScheduler, MUSIC_LOOKAHEAD_MS);`,
`      tempo: 86,
      intensity: 0.32,
      bossMode: false,
      trackIndex: 0,
      lastTrackIndex: -1,
      stateKey: "normal",
      pendingState: "normal"
    };
    selectNextMusicTrack("normal", true);
    musicLayers.timer = window.setInterval(musicScheduler, MUSIC_LOOKAHEAD_MS);`, "estado inicial da soundtrack");

  const update = `  function updateMusic() {
    if (!musicActive || !audioContext || !musicLayers.master) return;
    const hp = player.health / (player.maxHealth || 100);
    const combo = player.combo || 0;
    const isBoss = Boolean(activeBoss && !activeBoss.dead);
    const isPhasing = Boolean(player.phasing);
    const stage = Number(soloStage || 0);
    const intensity = clamp(0.3 + stage * 0.08 + Math.min(combo, 12) * 0.012 + (isBoss ? 0.24 : 0) + (isPhasing ? 0.06 : 0), 0.28, 0.92);
    const stateKey = isBoss ? "boss" : hp < 0.28 ? "danger" : stage >= 3 ? "danger" : stage >= 1.5 ? "high" : hp > 0.7 && stage < 1 ? "low" : "normal";
    if (stateKey !== musicLayers.stateKey) musicLayers.pendingState = stateKey;
    const track = MUSIC_TRACKS[musicLayers.trackIndex || 0] || MUSIC_TRACKS[0];
    const targetTempo = track.tempo + (isBoss ? Math.min(8, activeBoss?.bossPhaseIndex * 3 || 0) : 0);
    const targetGain = muted ? 0.0001 : Math.max(0.0001, masterVolume * 0.55);
    const now = audioContext.currentTime;

    musicLayers.intensity = intensity;
    musicLayers.bossMode = isBoss;
    musicLayers.tempo += (targetTempo - musicLayers.tempo) * 0.025;
    musicLayers.master.gain.cancelScheduledValues(now);
    musicLayers.master.gain.setTargetAtTime(targetGain, now, 0.08);
    musicLayers.filter.frequency.setTargetAtTime(2100 + intensity * 2500 + (hp < 0.3 ? -350 : 0), now, 0.12);
    musicLayers.wet.gain.setTargetAtTime(isBoss ? 0.2 : 0.14, now, 0.15);
  }`;
  source = replaceBetween(source, `  function updateMusic() {`, `\n\n/*__ECHO_SECTION_END:0042__*/`, update, "soundtrack dinâmica");
  return source;
});

edit("src/ui/hud.js", (source) => {
  source = replaceOnce(source,
`    charge: document.querySelector("#charge-value"),
    chargeFill: document.querySelector("#charge-fill"),`,
`    charge: document.querySelector("#charge-value"),
    chargeFill: document.querySelector("#charge-fill"),
    level: document.querySelector("#level-value"),
    experience: document.querySelector("#experience-value"),
    experienceFill: document.querySelector("#experience-fill"),`, "referências do HUD de nível");

  source = replaceOnce(source,
`    ui.abilityRing.style.setProperty("--charge", `${clamp(player.energy, 0, player.maxEnergy || 100) / (player.maxEnergy || 100) * 100}%`);`,
`    ui.abilityRing.style.setProperty("--charge", `${clamp(player.energy, 0, player.maxEnergy || 100) / (player.maxEnergy || 100) * 100}%`);
    const level = Math.max(1, player.level || 1);
    const experienceToNext = Math.max(0, player.experienceToNext || 0);
    const experience = Math.max(0, player.experience || 0);
    if (ui.level) ui.level.textContent = String(level);
    if (ui.experience) ui.experience.textContent = experienceToNext > 0 ? `${Math.floor(experience)} / ${experienceToNext}` : "MÁXIMO";
    if (ui.experienceFill) ui.experienceFill.style.width = `${experienceToNext > 0 ? clamp(experience / experienceToNext, 0, 1) * 100 : 100}%`;`, "atualização do HUD de nível");

  source = replaceOnce(source, `      ui.bossName.textContent = activeBoss.name;`, `      ui.bossName.textContent = `${activeBoss.name} // NV ${activeBoss.level || 1}`;`, "nível do boss no HUD");
  source = replaceOnce(source,
`    const entries = visibleBots.map((bot) => ({ name: bot.name, score: Math.floor(bot.score || 0), player: false }));
    entries.push({ name: player.name, score: Math.floor(player.score), player: true });`,
`    const entries = visibleBots.map((bot) => ({ name: bot.name, score: Math.floor(bot.score || 0), level: bot.level || 1, player: false }));
    entries.push({ name: player.name, score: Math.floor(player.score), level: player.level || 1, player: true });`, "níveis no placar");
  source = replaceOnce(source,
`      item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(entry.name)}</strong><em>${entry.score}</em>`;`,
`      item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(entry.name)}</strong><em>NV ${entry.level} · ${entry.score}</em>`;`, "exibição de nível no placar");
  return source;
});

edit("index.html", (source) => {
  source = replaceOnce(source,
`      <div class="meter charge-meter"><i id="charge-fill"></i></div>

      <div id="mutation-slots"`,
`      <div class="meter charge-meter"><i id="charge-fill"></i></div>

      <div class="metric-row level-row">
        <span>NÍVEL DO SINAL</span>
        <strong id="level-value">1</strong>
      </div>
      <div class="experience-copy"><span>EXPERIÊNCIA</span><strong id="experience-value">0 / 14</strong></div>
      <div class="meter experience-meter"><i id="experience-fill"></i></div>

      <div id="mutation-slots"`, "HUD de experiência");
  source = source.replace("ARENA ESPECTRAL // BUILD 0.4", "ARENA ESPECTRAL // BUILD 0.6");
  source = source.replace("Colete ressonâncias, projete uma presença espectral", "Colete ressonâncias, evolua seu nível, projete uma presença espectral");
  return source;
});

edit("styles.css", (source) => {
  if (source.includes(".experience-meter")) throw new Error("Estilos de experiência já existem");
  return `${source}\n\n/* Run level progression */\n.level-row { margin-top: 12px; }\n.experience-copy { display: flex; justify-content: space-between; align-items: center; margin-top: 5px; font-size: 10px; letter-spacing: .09em; color: rgba(226, 238, 255, .68); }\n.experience-copy strong { color: #b792ff; font-size: 10px; }\n.experience-meter { height: 4px; margin-top: 5px; background: rgba(183, 146, 255, .12); }\n.experience-meter i { background: linear-gradient(90deg, #45e6ff, #b792ff, #ff4fd8); box-shadow: 0 0 12px rgba(183, 146, 255, .45); transition: width .22s ease; }\n`;
});

edit("src/rendering/entities.js", (source) => {
  source = replaceOnce(source,
`    const radius = (entity.radius || 16) * camera.zoom * (spectral ? 0.85 : 1);`,
`    const radius = (entity.radius || 16) * camera.zoom * (spectral ? 0.85 : 1) * (1 + (entity.levelPulse || 0) * 0.08);`, "pulso visual de nível");
  source = replaceOnce(source,
`        ctx.fillText(entity.name, point.x, point.y - radius - 15);`,
`        ctx.fillText(entity.level ? `${entity.name} · NV ${entity.level}` : entity.name, point.x, point.y - radius - 15);`, "rótulo de nível das entidades");
  return source;
});

edit("src/combat/trail.js", (source) => {
  source = replaceOnce(source,
`        width: 11 * (player.ribbonWidthBonus || 1) * (player.skinTrail || 1),`,
`        width: 11 * (player.ribbonWidthBonus || 1) * (player.skinTrail || 1) * (player.rangeScale || 1),`, "largura do ataque por nível");
  source = replaceOnce(source,
`        if (distance < bot.radius + 12) {`,
`        if (distance < bot.radius + 12 * (player.rangeScale || 1)) {`, "alcance do dano por nível");
  return source;
});

edit("tests/server.integration.test.js", (source) => replaceOnce(source,
`    assert.equal((await healthResponse.json()).ok, true);

    const privateDatabaseResponse`,
`    assert.equal((await healthResponse.json()).ok, true);

    for (const publicScript of ["/core/events.js", "/core/random.js", "/core/runtime.js", "/core/qa-panel.js"]) {
      const scriptResponse = await fetch(`${baseUrl}${publicScript}`);
      assert.equal(scriptResponse.status, 200, `${publicScript} deve ser servido`);
      assert.match(scriptResponse.headers.get("content-type") || "", /javascript/);
    }

    const privateDatabaseResponse`, "teste dos scripts públicos"));

write("test/run-levels.test.js", `"use strict";\n\nconst test = require("node:test");\nconst assert = require("node:assert/strict");\nconst {\n  runLevelConfig,\n  runExperienceForLevel,\n  moteRunExperience,\n  initializeRunProgression,\n  grantRunExperience,\n  runExperienceDropTypes,\n  calculateBossRunScaling\n} = require("../src/progression/upgrades.js");\n\nfunction createEntity() {\n  return initializeRunProgression({\n    radius: 18, health: 100, maxHealth: 100, trailDamage: 34, moveSpeed: 205, phaseSpeed: 430, pickupRadius: 0\n  }, { baseRadius: 18, baseMaxHealth: 100, baseDamage: 34, baseSpeed: 205, basePhaseSpeed: 430, basePickupRadius: 0 });\n}\n\ntest("a curva de experiência cresce e respeita o nível máximo", () => {\n  assert.ok(runExperienceForLevel(2) > runExperienceForLevel(1));\n  assert.ok(runExperienceForLevel(10) > runExperienceForLevel(5));\n  assert.equal(runLevelConfig().maxLevel, 20);\n});\n\ntest("coletar experiência aumenta nível, tamanho e atributos", () => {\n  const entity = createEntity();\n  const result = grantRunExperience(entity, runExperienceForLevel(1));\n  assert.equal(result.levelsGained, 1);\n  assert.equal(entity.level, 2);\n  assert.ok(entity.radius > 18);\n  assert.ok(entity.maxHealth > 100);\n  assert.ok(entity.trailDamage > 34);\n  assert.ok(entity.moveSpeed < 205);\n});\n\ntest("experiência nunca ultrapassa o nível máximo", () => {\n  const entity = createEntity();\n  grantRunExperience(entity, 1_000_000);\n  assert.equal(entity.level, runLevelConfig().maxLevel);\n  assert.equal(entity.experienceToNext, 0);\n});\n\ntest("pontos roxos valem mais experiência que pontos azuis", () => {\n  assert.ok(moteRunExperience("violet") > moteRunExperience("cyan"));\n});\n\ntest("drops devolvem apenas uma parte limitada da experiência", () => {\n  const drops = runExperienceDropTypes(1_000, 20);\n  const value = drops.reduce((sum, type) => sum + moteRunExperience(type), 0);\n  assert.ok(drops.length <= runLevelConfig().maxDropMotes);\n  assert.ok(value <= runLevelConfig().maxDropValue);\n  assert.ok(value < 1_000);\n});\n\ntest("boss escala com o nível médio sem crescimento ilimitado", () => {\n  const entities = [{ level: 8, health: 100, maxHealth: 100 }, { level: 12, health: 100, maxHealth: 100 }];\n  const scaling = calculateBossRunScaling({ scale: 2.2 }, entities, 3, 240);\n  assert.ok(scaling.level >= 10);\n  assert.ok(scaling.sizeScale > 2.2);\n  assert.ok(scaling.healthScale <= 2.5);\n  assert.ok(scaling.damageScale <= 1.8);\n});\n`);

edit("package.json", (source) => source.replace('"version": "0.5.1"', '"version": "0.6.0"').replace("identidade de combate e runs reproduzíveis", "evolução por run, bosses adaptativos e soundtrack dinâmica"));
edit("package-lock.json", (source) => source.replaceAll('"version": "0.5.1"', '"version": "0.6.0"'));
edit("core/runtime.js", (source) => source.replace('version: "0.5.1"', 'version: "0.6.0"'));

edit("README.md", (source) => {
  source = source.replace("## Versão atual — 0.5.1", "## Versão atual — 0.6.0");
  source = source.replace("Esta versão conclui o **Incremento 1 — Separar o `game.js`**, preservando o gameplay da versão 0.5.0.", "Esta versão adiciona evolução por nível dentro da run, crescimento visual e de atributos, bots que disputam recursos, bosses maiores e adaptativos e uma soundtrack procedural com múltiplas faixas.");
  const anchor = "- a identidade de combate, o diretor de ameaças, a escala da interface, as seeds e o painel de QA continuam ativos.";
  if (source.includes(anchor)) {
    source = source.replace(anchor, `${anchor}\n- pontos ciano e violeta agora geram experiência; jogador e bots sobem de nível, crescem e ganham força;\n- bots avaliam risco, fogem de ameaças maiores e disputam recursos raros;\n- bosses usam escala individual e adaptação ao nível médio da arena;\n- a música alterna entre seis composições procedurais sem repetição imediata.`);
  }
  return source;
});

edit("docs/HYPERPLAN.md", (source) => {
  const anchor = "- [x] Estados adicionais de guarda, fuga, descanso, exposição e atordoamento";
  if (!source.includes("Sistema de nível por run")) {
    source = source.replace(anchor, `${anchor}\n- [x] Sistema de nível por run para jogador e bots\n- [x] Crescimento visual e de atributos\n- [x] IA de coleta, risco, fuga e disputa de recursos\n- [x] Drops limitados de experiência\n- [x] Escala individual e adaptativa dos bosses\n- [x] Soundtrack procedural com seis faixas dinâmicas`);
  }
  return source;
});

console.log("Pacote de evolução aplicado à fonte modular.");
