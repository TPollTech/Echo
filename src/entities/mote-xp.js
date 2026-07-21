/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0205__*/
const { BALANCE, getXpForLevel, getScaleForLevel, getHealthForLevel, getDamageForLevel, getRangeForLevel, getSpeedMultiplierForLevel } = require("./core/balance.js");
const { xpSystem } = require("./progression/xp.js");

const moteXpSystem = {
  xpMotes: [],
  xpParticles: [],
  xpPopups: [],
  spawnTimer: 0,

  MOTE_TYPES: Object.freeze({
    BLUE: "blue",
    VIOLET: "violet",
    GOLD: "gold",
    RED: "red"
  }),

  init() {
    this.xpMotes = [];
    this.xpParticles = [];
    this.xpPopups = [];
    this.spawnTimer = 0;
  },

  createXpMote(x, y, type = null, forceType = false) {
    const roll = forceType ? 0 : Math.random();
    const { blueSpawnWeight, violetSpawnWeight, goldSpawnWeight, redSpawnWeight } = BALANCE.mote;
    const total = blueSpawnWeight + violetSpawnWeight + goldSpawnWeight + redSpawnWeight;

    let actualType = type;
    if (!actualType) {
      let accum = 0;
      if (roll < (accum += blueSpawnWeight / total)) actualType = this.MOTE_TYPES.BLUE;
      else if (roll < (accum += violetSpawnWeight / total)) actualType = this.MOTE_TYPES.VIOLET;
      else if (roll < (accum += goldSpawnWeight / total)) actualType = this.MOTE_TYPES.GOLD;
      else actualType = this.MOTE_TYPES.RED;
    }

    const config = this.getMoteConfig(actualType);
    return {
      id: `mote-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x,
      y,
      vx: 0,
      vy: 0,
      type: actualType,
      radius: config.radius,
      hue: config.hue,
      xpValue: config.xpValue,
      bonusEffect: config.bonusEffect,
      bonusDuration: config.bonusDuration,
      phase: Math.random() * Math.PI * 2,
      driftAngle: Math.random() * Math.PI * 2,
      driftSpeed: 0.3 + Math.random() * 0.7,
      pulsePhase: Math.random() * Math.PI * 2,
      collected: false,
      spawnTime: Date.now(),
      lifetime: config.lifetime
    };
  },

  getMoteConfig(type) {
    switch (type) {
      case this.MOTE_TYPES.BLUE:
        return {
          radius: 2.5 + Math.random() * 1.5,
          hue: 188 + Math.random() * 30,
          xpValue: BALANCE.xp.blueMoteXp,
          bonusEffect: null,
          bonusDuration: 0,
          lifetime: 30
        };
      case this.MOTE_TYPES.VIOLET:
        return {
          radius: 3.5 + Math.random() * 1.5,
          hue: 268 + Math.random() * 30,
          xpValue: BALANCE.xp.violetMoteXp,
          bonusEffect: BALANCE.xp.violetMoteBonusEffect,
          bonusDuration: BALANCE.xp.violetMoteBonusDuration,
          lifetime: 25
        };
      case this.MOTE_TYPES.GOLD:
        return {
          radius: 4 + Math.random() * 2,
          hue: 42 + Math.random() * 15,
          xpValue: BALANCE.xp.blueMoteXp * 2,
          bonusEffect: { health: 5 },
          bonusDuration: 0,
          lifetime: 20
        };
      case this.MOTE_TYPES.RED:
        return {
          radius: 3 + Math.random() * 1,
          hue: 0 + Math.random() * 15,
          xpValue: -BALANCE.xp.blueMoteXp,
          bonusEffect: { damage: 5 },
          bonusDuration: 0,
          lifetime: 15
        };
      default:
        return this.getMoteConfig(this.MOTE_TYPES.BLUE);
    }
  },

  spawnInitialMotes(count, playerX, playerY, worldSize, worldMargin) {
    for (let i = 0; i < count; i++) {
      const nearPlayer = Math.random() < 0.3;
      let x, y;
      if (nearPlayer) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 400;
        x = playerX + Math.cos(angle) * dist;
        y = playerY + Math.sin(angle) * dist;
      } else {
        x = worldMargin + Math.random() * (worldSize - 2 * worldMargin);
        y = worldMargin + Math.random() * (worldSize - 2 * worldMargin);
      }
      x = Math.max(worldMargin, Math.min(worldSize - worldMargin, x));
      y = Math.max(worldMargin, Math.min(worldSize - worldMargin, y));
      this.xpMotes.push(this.createXpMote(x, y));
    }
  },

  spawnMoteNear(x, y, radius, worldSize, worldMargin, forceType = null) {
    const angle = Math.random() * Math.PI * 2;
    const dist = radius * (0.5 + Math.random() * 0.5);
    const mx = Math.max(worldMargin, Math.min(worldSize - worldMargin, x + Math.cos(angle) * dist));
    const my = Math.max(worldMargin, Math.min(worldSize - worldMargin, y + Math.sin(angle) * dist));
    return this.createXpMote(mx, my, forceType);
  },

  spawnMotesInZone(zoneX, zoneY, zoneRadius, count, worldSize, worldMargin, dangerMultiplier = 1) {
    const motes = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * zoneRadius;
      const x = Math.max(worldMargin, Math.min(worldSize - worldMargin, zoneX + Math.cos(angle) * dist));
      const y = Math.max(worldMargin, Math.min(worldSize - worldMargin, zoneY + Math.sin(angle) * dist));
      let type = null;
      if (dangerMultiplier > 1.2 && Math.random() < 0.3 * dangerMultiplier) {
        type = this.MOTE_TYPES.VIOLET;
      }
      motes.push(this.createXpMote(x, y, type));
    }
    this.xpMotes.push(...motes);
    return motes;
  },

  collectMote(entity, mote, worldSize, worldMargin) {
    if (mote.collected) return false;

    const xpSystemData = xpSystem.getData(entity);
    if (!xpSystemData) return false;

    mote.collected = true;

    if (mote.type === this.MOTE_TYPES.RED) {
      entity.health = Math.max(1, entity.health + mote.xpValue);
      this.createXpParticles(mote.x, mote.y, mote.hue, 5);
      this.showXpPopup(mote.x, mote.y, mote.xpValue, "#ff4444");
      return true;
    }

    const xpGained = xpSystem.addXp(entity, mote.xpValue, mote.type);

    if (mote.type === this.MOTE_TYPES.VIOLET && mote.bonusEffect) {
      this.applyTemporaryBonus(entity, mote.bonusEffect, mote.bonusDuration);
      this.showXpPopup(mote.x, mote.y, `+${mote.xpValue} XP + BÔNUS!`, "#b792ff");
    } else if (mote.type === this.MOTE_TYPES.GOLD) {
      entity.health = Math.min(entity.maxHealth, entity.health + 5);
      this.showXpPopup(mote.x, mote.y, `+${mote.xpValue} XP + VIDA`, "#ffd86b");
    } else {
      this.showXpPopup(mote.x, mote.y, `+${mote.xpValue} XP`, "#45e6ff");
    }

    this.createXpParticles(mote.x, mote.y, mote.hue, BALANCE.visual.xpPickupParticles);
    this.playCollectSound(mote.type);

    if (BALANCE.mote.respawnOnCollect && this.xpMotes.length < BALANCE.mote.maxMotes) {
      setTimeout(() => {
        const newMote = this.createXpMote(
          worldMargin + Math.random() * (worldSize - 2 * worldMargin),
          worldMargin + Math.random() * (worldSize - 2 * worldMargin)
        );
        this.xpMotes.push(newMote);
      }, (BALANCE.mote.respawnDelay.min + Math.random() * (BALANCE.mote.respawnDelay.max - BALANCE.mote.respawnDelay.min)) * 1000);
    }

    return true;
  },

  applyTemporaryBonus(entity, effect, duration) {
    entity.tempBonuses = entity.tempBonuses || [];
    const bonus = {
      effect: { ...effect },
      duration,
      maxDuration: duration,
      startTime: Date.now()
    };
    entity.tempBonuses.push(bonus);

    if (effect.damage) entity.attackDamage = Math.floor(entity.attackDamage * effect.damage);
    if (effect.speed) entity.speed = entity.speed * effect.speed;
    if (effect.defense) entity.damageReduction = (entity.damageReduction || 1) * effect.defense;
    if (effect.damageResistance) entity.damageReduction = (entity.damageReduction || 1) * effect.damageResistance;
  },

  updateTempBonuses(entity, dt) {
    if (!entity.tempBonuses || entity.tempBonuses.length === 0) return;

    for (let i = entity.tempBonuses.length - 1; i >= 0; i--) {
      const bonus = entity.tempBonuses[i];
      bonus.duration -= dt;

      if (bonus.duration <= 0) {
        if (bonus.effect.damage) entity.attackDamage = Math.floor(entity.attackDamage / bonus.effect.damage);
        if (bonus.effect.speed) entity.speed = entity.speed / bonus.effect.speed;
        if (bonus.effect.defense) entity.damageReduction = (entity.damageReduction || 1) / bonus.effect.defense;
        if (bonus.effect.damageResistance) entity.damageReduction = (entity.damageReduction || 1) / bonus.effect.damageResistance;
        entity.tempBonuses.splice(i, 1);
      }
    }
  },

  createXpParticles(x, y, hue, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 60;
      this.xpParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hue,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        radius: 1.5 + Math.random() * 2,
        gravity: 0
      });
    }
  },

  showXpPopup(x, y, text, color) {
    this.xpPopups.push({
      x, y,
      text,
      color,
      life: BALANCE.visual.xpGainPopupDuration,
      maxLife: BALANCE.visual.xpGainPopupDuration,
      vy: -20,
      scale: 1
    });
  },

  playCollectSound(type) {
    if (typeof window.sound === "function") {
      const pitch = type === this.MOTE_TYPES.VIOLET ? BALANCE.audio.xpCollectPitch.violet : BALANCE.audio.xpCollectPitch.blue;
      window.sound(pitch, BALANCE.audio.xpCollectVolume, "sine");
    }
  },

  playLevelUpSound() {
    if (typeof window.sound === "function") {
      window.sound(BALANCE.audio.levelUpPitch, BALANCE.audio.levelUpVolume, "triangle");
    }
  },

  update(dt, player, bots, worldSize, worldMargin) {
    this.updateMotes(dt);
    this.updateParticles(dt);
    this.updatePopups(dt);
    this.updateCollections(player, bots, worldSize, worldMargin);
    this.spawnTimer -= dt;
  },

  updateMotes(dt) {
    for (let i = this.xpMotes.length - 1; i >= 0; i--) {
      const mote = this.xpMotes[i];
      mote.phase += dt * 3;
      mote.pulsePhase += dt * 5;
      mote.driftAngle += mote.driftSpeed * dt;

      mote.x += Math.cos(mote.driftAngle) * mote.driftSpeed * 10 * dt;
      mote.y += Math.sin(mote.driftAngle) * mote.driftSpeed * 10 * dt;

      mote.lifetime -= dt;
      if (mote.lifetime <= 0 || mote.collected) {
        this.xpMotes.splice(i, 1);
      }
    }
  },

  updateParticles(dt) {
    for (let i = this.xpParticles.length - 1; i >= 0; i--) {
      const p = this.xpParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.vy += p.gravity * dt;
      if (p.life <= 0) this.xpParticles.splice(i, 1);
    }
  },

  updatePopups(dt) {
    for (let i = this.xpPopups.length - 1; i >= 0; i--) {
      const p = this.xpPopups[i];
      p.y += p.vy * dt;
      p.vy *= 0.98;
      p.life -= dt;
      p.scale = p.life / p.maxLife;
      if (p.life <= 0) this.xpPopups.splice(i, 1);
    }
  },

  updateCollections(player, bots, worldSize, worldMargin) {
    const entities = [player, ...bots.filter(b => !b.dead)];

    for (const entity of entities) {
      const pickupRadius = (entity.pickupRadius || 0) + (entity.baseRadius || entity.radius || 18) + 5;
      const xpData = xpSystem.getData(entity);

      for (let i = this.xpMotes.length - 1; i >= 0; i--) {
        const mote = this.xpMotes[i];
        if (mote.collected) continue;

        const dx = entity.x - mote.x;
        const dy = entity.y - mote.y;
        const distSq = dx * dx + dy * dy;
        const range = pickupRadius + mote.radius;

        if (distSq < range * range) {
          this.collectMote(entity, mote, worldSize, worldMargin);
        }
      }

      if (xpData) xpSystem.update(entity, dt);
      this.updateTempBonuses(entity, dt);
    }
  },

  getMotesInRange(x, y, radius) {
    return this.xpMotes.filter(m => {
      const dx = m.x - x;
      const dy = m.y - y;
      return dx * dx + dy * dy < radius * radius && !m.collected;
    });
  },

  getNearestMote(x, y, type = null) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const mote of this.xpMotes) {
      if (mote.collected) continue;
      if (type && mote.type !== type) continue;

      const dx = mote.x - x;
      const dy = mote.y - y;
      const dist = dx * dx + dy * dy;

      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = mote;
      }
    }

    return nearest ? { mote: nearest, distance: Math.sqrt(nearestDist) } : null;
  },

  getVioletMotesInRange(x, y, radius) {
    return this.getMotesInRange(x, y, radius).filter(m => m.type === this.MOTE_TYPES.VIOLET);
  },

  render(ctx, camera) {
    this.renderMotes(ctx, camera);
    this.renderParticles(ctx, camera);
    this.renderPopups(ctx, camera);
  },

  renderMotes(ctx, camera) {
    for (const mote of this.xpMotes) {
      if (mote.collected) continue;

      const screen = camera.toScreen(mote.x, mote.y);
      if (screen.x < -50 || screen.x > camera.width + 50 || screen.y < -50 || screen.y > camera.height + 50) continue;

      ctx.save();
      ctx.translate(screen.x, screen.y);

      const pulse = 1 + Math.sin(mote.pulsePhase) * 0.15;
      const r = mote.radius * pulse;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.5);
      gradient.addColorStop(0, `hsla(${mote.hue}, 90%, 70%, 1)`);
      gradient.addColorStop(0.5, `hsla(${mote.hue}, 80%, 60%, 0.6)`);
      gradient.addColorStop(1, `hsla(${mote.hue}, 70%, 50%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      if (mote.type === this.MOTE_TYPES.VIOLET) {
        ctx.strokeStyle = `hsla(${mote.hue}, 90%, 70%, ${0.5 + Math.sin(mote.phase * 2) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = `hsla(${mote.hue}, 90%, 70%, 0.9)`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  },

  renderParticles(ctx, camera) {
    for (const p of this.xpParticles) {
      const screen = camera.toScreen(p.x, p.y);
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  renderPopups(ctx, camera) {
    ctx.font = "bold 12px 'Orbitron', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const p of this.xpPopups) {
      const screen = camera.toScreen(p.x, p.y);
      const alpha = p.life / p.maxLife;

      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.scale(p.scale, p.scale);

      const hexAlpha = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = `${p.color.slice(0, -2)}${hexAlpha}`;
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.5})`;
      ctx.lineWidth = 3;
      ctx.strokeText(p.text, 0, 0);
      ctx.fillText(p.text, 0, 0);

      ctx.restore();
    }
  },

  dropXpOnDeath(entity, killer) {
    const xpData = xpSystem.getData(entity);
    if (!xpData) return;

    const totalXp = xpData.totalXp || 0;
    const dropAmount = Math.floor(totalXp * BALANCE.xp.dropPercentage);
    if (dropAmount <= 0) return;

    const { minMotes, maxMotes, blueMoteRatio, violetMoteRatio } = BALANCE.xpDrop;
    const moteCount = Math.min(maxMotes, Math.max(minMotes, Math.floor(dropAmount / (BALANCE.xp.blueMoteXp * 2))));

    let remainingXp = dropAmount;
    for (let i = 0; i < moteCount; i++) {
      const isLast = i === moteCount - 1;
      let type, xpValue;

      if (isLast) {
        xpValue = remainingXp;
      } else {
        const avgXp = remainingXp / (moteCount - i);
        const variation = 0.5 + Math.random() * 0.5;
        xpValue = Math.floor(avgXp * variation);
      }

      remainingXp -= xpValue;

      if (xpValue >= BALANCE.xp.violetMoteXp && Math.random() < violetMoteRatio) {
        type = this.MOTE_TYPES.VIOLET;
      } else {
        type = this.MOTE_TYPES.BLUE;
      }

      const angle = (Math.PI * 2 / moteCount) * i + (Math.random() - 0.5) * 0.5;
      const dist = BALANCE.xpDrop.spreadRadius * (0.5 + Math.random() * 0.5);
      const x = entity.x + Math.cos(angle) * dist;
      const y = entity.y + Math.sin(angle) * dist;

      const mote = this.createXpMote(x, y, type);
      if (type === this.MOTE_TYPES.VIOLET) {
        mote.xpValue = Math.floor(xpValue);
      }
      this.xpMotes.push(mote);
    }
  }
};

module.exports = Object.freeze({ moteXpSystem });
/*__ECHO_SECTION_END:0205__*/