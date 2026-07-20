/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0001__*/
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
/*__ECHO_SECTION_END:0001__*/
/*__ECHO_SECTION:0010__*/
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let state = "intro";
  let previousTime = performance.now();
  let runTime = 0;
  let screenShake = 0;
  let flash = 0;
/*__ECHO_SECTION_END:0010__*/
/*__ECHO_SECTION:0012__*/
  let screenShakeEnabled = true;
  let flashEnabled = true;
  let toastTimer = 0;
  let leaderboardTimer = 0;
/*__ECHO_SECTION_END:0012__*/
/*__ECHO_SECTION:0014__*/
  let selectedMode = "solo";
  let activeMode = "solo";
  let soloStage = 0;
/*__ECHO_SECTION_END:0014__*/
/*__ECHO_SECTION:0016__*/
  let pausedFromState = null;
  let lastRunSaved = false;
/*__ECHO_SECTION_END:0016__*/
/*__ECHO_SECTION:0018__*/
  let playerUpgrades = { core: 0, charge: 0, calibration: 0, collection: 0, regeneration: 0 };
  let playerResonance = 0;
  let pendingResonance = 0;
/*__ECHO_SECTION_END:0018__*/
/*__ECHO_SECTION:0026__*/
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

/*__ECHO_SECTION_END:0026__*/
/*__ECHO_SECTION:0034__*/
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
    updateLeaderboard();
    updateHud();
  }

/*__ECHO_SECTION_END:0034__*/
/*__ECHO_SECTION:0040__*/
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

/*__ECHO_SECTION_END:0040__*/
/*__ECHO_SECTION:0049__*/
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

/*__ECHO_SECTION_END:0049__*/
/*__ECHO_SECTION:0051__*/
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

/*__ECHO_SECTION_END:0051__*/
/*__ECHO_SECTION:0082__*/
  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

/*__ECHO_SECTION_END:0082__*/
/*__ECHO_SECTION:0084__*/
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

/*__ECHO_SECTION_END:0084__*/
/*__ECHO_SECTION:0088__*/
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

/*__ECHO_SECTION_END:0088__*/
/*__ECHO_SECTION:0095__*/
  let minimapFrame = 0;
  const MINIMAP_SIZE = MOBILE_QUALITY ? 100 : 140;

  if (MOBILE_QUALITY && ui.minimap) {
    ui.minimap.width = 100;
    ui.minimap.height = 100;
  }

/*__ECHO_SECTION_END:0095__*/
/*__ECHO_SECTION:0105__*/
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

/*__ECHO_SECTION_END:0105__*/
/*__ECHO_SECTION:0107__*/
  function releaseCanvasPointer(event) {
    if (pointer.id !== event.pointerId) return;
    pointer.active = false;
    pointer.id = null;
    if (event.pointerType === "mouse") endPhase();
  }

/*__ECHO_SECTION_END:0107__*/
/*__ECHO_SECTION:0110__*/
  loadSettings();
  resize();
  resetWorld();
  loadProfile();
/*__ECHO_SECTION_END:0110__*/
/*__ECHO_SECTION:0112__*/
  requestAnimationFrame((now) => {
    previousTime = now;
    requestAnimationFrame(frame);
  });

/*__ECHO_SECTION_END:0112__*/
