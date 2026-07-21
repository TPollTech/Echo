/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0117__*/
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

/*__ECHO_SECTION_END:0117__*/
