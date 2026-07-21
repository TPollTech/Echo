/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0117__*/
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

/*__ECHO_SECTION_END:0117__*/
