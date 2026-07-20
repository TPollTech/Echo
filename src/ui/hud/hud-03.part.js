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

    if (player.silenced) {
      ui.abilityTitle.textContent = "MUTAÇÕES SILENCIADAS";
      ui.abilityHint.textContent = player.silencePermanent ? "Rompa a Âncora do Vácuo para restaurar seu sinal." : `${Math.max(0, player.silencedTimer).toFixed(1)}s até a restauração.`;
    } else if (player.phasing) {
      ui.abilityTitle.textContent = "NÚCLEO EXPOSTO";
      ui.abilityHint.textContent = "Solte para atravessar o rastro e atacar.";
    } else if (player.cooldown > 0) {
      ui.abilityTitle.textContent = "RECALIBRANDO";
      ui.abilityHint.textContent = `${player.cooldown.toFixed(1)}s para nova projeção.`;
    } else if (player.energy < 12) {
      ui.abilityTitle.textContent = "CARGA INSUFICIENTE";
      ui.abilityHint.textContent = "Colete fragmentos ou aguarde a recarga.";
    } else {
      ui.abilityTitle.textContent = "ECO ESPECTRAL PRONTO";
      ui.abilityHint.textContent = "Segure para abandonar o núcleo. Solte para romper o rastro.";
    }

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

