/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0002__*/
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
    loadoutScreen: document.querySelector("#loadout-screen"),
    loadoutSlots: document.querySelector("#loadout-slots"),
    loadoutAvailable: document.querySelector("#loadout-available"),
    loadoutConfirm: document.querySelector("#loadout-confirm")
  };

/*__ECHO_SECTION_END:0002__*/
/*__ECHO_SECTION:0053__*/
  function showToast(message, duration = 1500) {
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.toast.classList.remove("is-visible"), duration);
  }

/*__ECHO_SECTION_END:0053__*/
/*__ECHO_SECTION:0081__*/
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

/*__ECHO_SECTION_END:0081__*/
/*__ECHO_SECTION:0096__*/
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

/*__ECHO_SECTION_END:0096__*/
