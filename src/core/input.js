/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0024__*/
  const pointer = {
    x: width * 0.66,
    y: height * 0.5,
    active: false,
    id: null,
    type: "mouse"
  };

/*__ECHO_SECTION_END:0024__*/
/*__ECHO_SECTION:0102__*/
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
/*__ECHO_SECTION_END:0102__*/
/*__ECHO_SECTION:0104__*/
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

/*__ECHO_SECTION_END:0104__*/
/*__ECHO_SECTION:0106__*/
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

/*__ECHO_SECTION_END:0106__*/
/*__ECHO_SECTION:0108__*/
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
/*__ECHO_SECTION_END:0108__*/
/*__ECHO_SECTION:0113__*/
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
/*__ECHO_SECTION_END:0113__*/
