/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0129__*/
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
      if (ui.joystickZone) ui.joystickZone.classList.add("is-joy-active");
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
/*__ECHO_SECTION_END:0129__*/
