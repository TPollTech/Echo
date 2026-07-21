/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0126__*/
  let classProjectiles = [];
  let classTraps = [];
  let classFields = [];
  let classMinions = [];
  let classDamageNumbers = [];
  let selectedClassId = normalizeClassId(localStorage.getItem("echo.class") || "cutter");
  let classSpecialCooldown = 0;
  let lastClassLevel = 1;

  function applyEntityClass(entity, classId, preserveHealthRatio = false) {
    const definition = getClassDefinition(classId);
    const oldMaxHealth = entity.maxHealth || definition.attributes.health;
    const healthRatio = preserveHealthRatio ? clamp((entity.health || oldMaxHealth) / oldMaxHealth, 0, 1) : 1;
    const isPlayerEntity = entity.id === "player";
    const upgradeHealth = isPlayerEntity ? playerUpgrades.core * 5 : 0;
    const upgradeEnergy = isPlayerEntity ? playerUpgrades.charge * 10 : 0;
    entity.classId = definition.id;
    entity.className = definition.name;
    entity.classDefinition = definition;
    entity.roleLabel = entity.boss ? entity.roleLabel : definition.name;
    entity.maxHealth = definition.attributes.health + upgradeHealth;
    entity.health = entity.maxHealth * healthRatio;
    entity.maxEnergy = 100 + upgradeEnergy;
    entity.energy = clamp(entity.energy ?? entity.maxEnergy, 0, entity.maxEnergy);
    entity.moveSpeed = definition.attributes.speed;
    entity.damageTakenScale = definition.attributes.resistance;
    entity.preferredRange = definition.attributes.preferredRange;
    entity.classResource = definition.resource.max;
    entity.classResourceMax = definition.resource.max;
    entity.classResourceName = definition.resource.name;
    entity.classExperience = Math.max(0, entity.classExperience || 0);
    entity.classLevel = getClassLevel(entity.classExperience);
    entity.classCooldown = 0;
    entity.classActionTimer = 0;
    entity.classCharge = 0;
    entity.classCharging = false;
    entity.classShieldTimer = 0;
    entity.classShieldAngle = 0;
    entity.classCounterCharge = 0;
    entity.classStealthTimer = 0;
    entity.classAmbushReady = false;
    entity.classDashHitIds = new Set();
    entity.classOrbTimer = 0;
    return entity;
  }

  function resetClassCombat() {
    classProjectiles = [];
    classTraps = [];
    classFields = [];
    classMinions = [];
    classDamageNumbers = [];
    classSpecialCooldown = 0;
    lastClassLevel = 1;
    applyEntityClass(player, selectedClassId);
    lastClassLevel = player.classLevel;
  }

  function targetAngle(entity = player) {
    const target = entity === player ? worldTarget() : { x: entity.targetX, y: entity.targetY };
    const directAngle = Math.atan2(target.y - entity.y, target.x - entity.x);
    if (entity !== player || activeMode === "multiplayer") return directAngle;
    const assist = clamp(Number(preparation?.settings?.aimAssist || 0) / 100, 0, 1);
    if (assist <= 0) return directAngle;
    let best = null;
    let bestScore = Infinity;
    for (const bot of bots) {
      if (bot.dead) continue;
      const angle = Math.atan2(bot.y - player.y, bot.x - player.x);
      const delta = Math.abs(Math.atan2(Math.sin(angle - directAngle), Math.cos(angle - directAngle)));
      const distance = Math.hypot(bot.x - player.x, bot.y - player.y);
      const score = delta * 680 + distance * 0.12;
      if (delta < 0.3 && score < bestScore) { best = angle; bestScore = score; }
    }
    return best == null ? directAngle : directAngle + Math.atan2(Math.sin(best - directAngle), Math.cos(best - directAngle)) * assist * 0.7;
  }

  function classDamageTarget(target, amount, owner, sourceX, sourceY, knockback = 150) {
    if (!target || target.dead) return false;
    if (target === player) {
      const before = player.health;
      damagePlayer(amount, sourceX, sourceY);
      return player.health < before;
    }
    const before = target.health;
    damageBot(target, amount, owner, sourceX, sourceY);
    if (target.health < before && knockback > 0) {
      const dx = target.x - sourceX;
      const dy = target.y - sourceY;
      const distance = Math.hypot(dx, dy) || 1;
      target.vx += (dx / distance) * knockback;
      target.vy += (dy / distance) * knockback;
    }
    return target.health < before;
  }

  function spawnDamageNumber(x, y, amount, hue = 188) {
    if (!preparation?.settings?.showDamage) return;
    classDamageNumbers.push({ x, y, amount: Math.max(1, Math.round(amount)), hue, life: 0.72, maxLife: 0.72 });
    if (classDamageNumbers.length > 24) classDamageNumbers.shift();
  }

  function damageInRadius(owner, x, y, radius, damage, knockback = 220) {
    let hits = 0;
    const targets = owner === player ? bots : [player];
    for (const target of targets) {
      if (!target || target.dead || target.respawnTimer > 0) continue;
      const distance = Math.hypot(target.x - x, target.y - y);
      if (distance > radius + target.radius) continue;
      if (classDamageTarget(target, damage, owner, x, y, knockback)) hits += 1;
    }
    spawnWave(x, y, owner?.hue ?? 188, radius, 0.55);
    return hits;
  }

  function spawnClassProjectile(owner, angle, options = {}) {
    const speed = options.speed || 620;
    const projectile = {
      id: `${owner.id || "entity"}-${Math.random().toString(36).slice(2, 8)}`,
      owner,
      x: owner.x + Math.cos(angle) * (owner.radius + 8),
      y: owner.y + Math.sin(angle) * (owner.radius + 8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: options.radius || 6,
      damage: options.damage || 16,
      life: options.life || 1.2,
      hue: options.hue ?? owner.hue,
      pierce: options.pierce || 0,
      slow: options.slow || 0,
      explosive: options.explosive || 0,
      homing: options.homing || 0,
      hitIds: new Set()
    };
    classProjectiles.push(projectile);
    return projectile;
  }

  function meleeArc(owner, range, damage, arc = Math.PI * 0.72) {
    const angle = targetAngle(owner);
    let hits = 0;
    const targets = owner === player ? bots : [player];
    for (const target of targets) {
      if (!target || target.dead) continue;
      const dx = target.x - owner.x;
      const dy = target.y - owner.y;
      const distance = Math.hypot(dx, dy);
      const delta = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle)));
      if (distance <= range + target.radius && delta <= arc / 2 && classDamageTarget(target, damage, owner, owner.x, owner.y, 190)) hits += 1;
    }
    spawnWave(owner.x, owner.y, owner.hue, range, 0.3);
    return hits;
  }

  function beginMarksman(owner) {
    if (owner.classCooldown > 0 || owner.classResource < 8) return;
    owner.classCharging = true;
    owner.classCharge = 0;
  }

  function releaseMarksman(owner) {
    if (!owner.classCharging) return;
    owner.classCharging = false;
    const evolution = getClassEvolution("marksman", owner.classLevel);
    const charge = clamp(owner.classCharge, 0.12, 1);
    const angle = targetAngle(owner);
    const distanceBonus = 1 + Math.min(0.65, Math.hypot((owner.targetX || owner.x) - owner.x, (owner.targetY || owner.y) - owner.y) / 1000);
    spawnClassProjectile(owner, angle, {
      speed: (520 + charge * 520) * evolution.range,
      damage: (14 + charge * 42) * distanceBonus,
      radius: (4 + charge * 7) * evolution.projectileSize,
      life: 0.9 + charge * 0.9
    });
    owner.classResource = Math.max(0, owner.classResource - (8 + charge * 18));
    owner.classCooldown = 0.3;
    sound(410 + charge * 260, 0.18, "triangle", 0.04);
  }

  function performDash(owner, distanceScale = 1) {
    if (owner.classCooldown > 0 || owner.classResource < 18) return false;
    const evolution = getClassEvolution("charger", owner.classLevel);
    const angle = targetAngle(owner);
    owner.classActionTimer = 0.3 * distanceScale * evolution.dashRange;
    owner.classDashAngle = angle;
    owner.classDashHitIds = new Set();
    owner.classResource -= 18;
    owner.classCooldown = 0.75;
    owner.hitTimer = Math.max(owner.hitTimer, 0.25);
    spawnWave(owner.x, owner.y, owner.hue, 68, 0.35);
    return true;
  }

  function placeTrap(owner, slow = 0.48) {
    if (owner.classResource < 1) return false;
    const limit = Math.floor(getClassDefinition("trapper").resource.max * getClassEvolution("trapper", owner.classLevel).traps);
    const owned = classTraps.filter((trap) => trap.owner === owner);
    if (owned.length >= limit) owned[0].life = 0;
    classTraps.push({ owner, x: owner.x, y: owner.y, radius: 72, damage: 22, life: 12, armed: 0.55, slow, hue: owner.hue });
    owner.classResource -= 1;
    owner.classCooldown = 0.4;
    sound(245, 0.16, "square", 0.025);
    return true;
  }

  function activateShield(owner) {
    if (owner.classResource < 18 || owner.classCooldown > 0) return false;
    owner.classShieldTimer = 2.4 * getClassEvolution("defender", owner.classLevel).duration;
    owner.classShieldAngle = targetAngle(owner);
    owner.classResource -= 18;
    owner.classCooldown = 0.65;
    spawnWave(owner.x, owner.y, owner.hue, 96, 0.45);
    return true;
  }

  function activateStealth(owner) {
    if (owner.classResource < 24 || owner.classCooldown > 0) return false;
    const evolution = getClassEvolution("assassin", owner.classLevel);
    owner.classStealthTimer = 2.6 * evolution.stealth;
    owner.classAmbushReady = true;
    owner.classResource -= 24;
    owner.classCooldown = 1;
    const angle = targetAngle(owner);
    const distance = 145 * evolution.teleport;
    owner.x = clamp(owner.x + Math.cos(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    owner.y = clamp(owner.y + Math.sin(angle) * distance, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    burst(owner.x, owner.y, owner.hue, 12);
    return true;
  }

  function createGravityField(owner) {
    if (owner.classResource < 30 || owner.classCooldown > 0) return false;
    const evolution = getClassEvolution("controller", owner.classLevel);
    const target = owner === player ? worldTarget() : { x: owner.targetX, y: owner.targetY };
    classFields.push({ owner, type: "gravity", x: target.x, y: target.y, radius: 150 * evolution.area, strength: 390 * evolution.pull, damage: 5, life: 3.2 * evolution.duration, hue: owner.hue, tick: 0 });
    owner.classResource -= 30;
    owner.classCooldown = 0.8;
    return true;
  }

  function summonUnit(owner, command = false) {
    const evolution = getClassEvolution("summoner", owner.classLevel);
    const limit = Math.max(2, Math.floor(2 * evolution.units));
    const owned = classMinions.filter((minion) => minion.owner === owner && minion.life > 0);
    if (!command && owned.length >= limit) return false;
    if (!command) {
      classMinions.push({ owner, x: owner.x, y: owner.y, vx: 0, vy: 0, radius: 6, life: 18, health: 28, attackTimer: 0, frenzy: 0, hue: owner.hue });
      owner.classResource = Math.min(owner.classResourceMax, owned.length + 1);
      return true;
    }
    for (const minion of owned) minion.frenzy = 3;
    return owned.length > 0;
  }

  function launchOrb(owner, all = false) {
    const count = Math.floor(owner.classResource);
    if (count < 1) return false;
    const shots = all ? count : 1;
    const base = targetAngle(owner);
    for (let index = 0; index < shots; index += 1) {
      const angle = all ? base + index * TAU / shots : base;
      spawnClassProjectile(owner, angle, { speed: 540, damage: 20, radius: 8, life: 1.4, explosive: all ? 42 : 0 });
    }
    owner.classResource -= shots;
    owner.classCooldown = all ? 1 : 0.35;
    return true;
  }

  function fireLoader(owner) {
    if (owner.classResource < 1 || owner.classCooldown > 0) return false;
    const violet = (owner.violetAmmo || 0) > 0;
    if (violet) owner.violetAmmo -= 1;
    else owner.blueAmmo = Math.max(0, (owner.blueAmmo || 0) - 1);
    owner.classResource = Math.max(0, (owner.blueAmmo || 0) + (owner.violetAmmo || 0));
    spawnClassProjectile(owner, targetAngle(owner), { speed: 650, damage: violet ? 31 : 18, radius: violet ? 8 : 5, life: 1.3, explosive: violet ? 68 : 0 });
    owner.lastAmmoType = violet ? "violet" : "blue";
    owner.classCooldown = 0.24;
    return true;
  }

  function reverseCutterPath(owner) {
    const points = owner.lastCutterPath;
    if (!points || points.length < 2 || owner.classResource < 28) return false;
    const reverse = [...points].reverse().map((point) => ({ ...point }));
    const hitIds = damageAlongPath(reverse, owner.trailDamage * 0.72, owner);
    ribbons.push({ points: reverse, hue: (owner.hue + 42) % 360, life: 0.48, maxLife: 0.48, width: 9, hitIds });
    owner.classResource -= 28;
    return true;
  }

  const classControllerRegistry = Object.freeze({
    cutter: {
      primaryStart: () => beginCutterPhase(), primaryEnd: (cancelled) => endCutterPhase(cancelled),
      special: () => reverseCutterPath(player)
    },
    marksman: {
      primaryStart: () => beginMarksman(player), primaryEnd: (cancelled) => cancelled ? (player.classCharging = false) : releaseMarksman(player),
      special: () => {
        if (player.classResource < 32) return false;
        spawnClassProjectile(player, targetAngle(), { speed: 980, damage: 38, radius: 7, life: 1.7, pierce: 5 });
        player.classResource -= 32;
        return true;
      }
    },
    charger: {
      primaryStart: () => performDash(player), primaryEnd: () => {},
      special: () => player.classResource >= 34 && (player.classResource -= 34, damageInRadius(player, player.x, player.y, 150, 30), true)
    },
    trapper: {
      primaryStart: () => player.classCooldown <= 0 && (spawnClassProjectile(player, targetAngle(), { speed: 560, damage: 13, radius: 5, life: 1 }), player.classCooldown = 0.3),
      primaryEnd: () => {}, special: () => placeTrap(player)
    },
    defender: {
      primaryStart: () => player.classCooldown <= 0 && (meleeArc(player, 108, 16 + player.classCounterCharge), player.classCounterCharge = 0, player.classCooldown = 0.48),
      primaryEnd: () => {}, special: () => activateShield(player)
    },
    assassin: {
      primaryStart: () => {
        if (player.classCooldown > 0) return;
        const multiplier = player.classAmbushReady ? 2.15 : 1;
        meleeArc(player, 92, 24 * multiplier, Math.PI * 0.55);
        player.classAmbushReady = false;
        player.classStealthTimer = 0;
        player.classCooldown = 0.32;
      },
      primaryEnd: () => {}, special: () => activateStealth(player)
    },
    controller: {
      primaryStart: () => player.classCooldown <= 0 && (meleeArc(player, 145, 12, TAU), player.classCooldown = 0.5),
      primaryEnd: () => {}, special: () => createGravityField(player)
    },
    summoner: {
      primaryStart: () => player.classCooldown <= 0 && (summonUnit(player), player.classCooldown = 0.7),
      primaryEnd: () => {}, special: () => summonUnit(player, true)
    },
    orbiter: {
      primaryStart: () => launchOrb(player), primaryEnd: () => {}, special: () => launchOrb(player, true)
    },
    loader: {
      primaryStart: () => fireLoader(player), primaryEnd: () => {},
      special: () => {
        const ammo = player.classResource;
        if (ammo < 2) return false;
        player.blueAmmo = 0; player.violetAmmo = 0; player.classResource = 0;
        damageInRadius(player, player.x, player.y, 105 + ammo * 7, 12 + ammo * 4);
        return true;
      }
    }
  });

  function beginClassPrimary() {
    if (state !== "playing") return;
    classControllerRegistry[player.classId]?.primaryStart?.();
  }

  function endClassPrimary(cancelled = false) {
    classControllerRegistry[player.classId]?.primaryEnd?.(cancelled);
  }

  function useClassSpecial() {
    if (state !== "playing" || classSpecialCooldown > 0) return;
    if (activeMode === "multiplayer") {
      if (multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: "class_special" }));
      classSpecialCooldown = 0.35;
      return;
    }
    const used = classControllerRegistry[player.classId]?.special?.();
    if (used !== false) {
      classSpecialCooldown = 1.1 * player.cooldownScale;
      sound(player.classDefinition.sound, 0.22, "triangle", 0.04);
      if (preparation.settings.vibration && navigator.vibrate) navigator.vibrate(22);
      updateClassHud();
    }
  }

  function grantClassExperience(amount) {
    if (!player || activeMode === "multiplayer") return;
    player.classExperience += Math.max(0, amount || 0);
  }

  function updateClassProgression() {
    const nextLevel = getClassLevel(player.classExperience + player.score * 0.35);
    if (nextLevel === player.classLevel) return;
    player.classLevel = nextLevel;
    const definition = player.classDefinition;
    const evolution = getClassEvolution(player.classId, nextLevel);
    player.radius = 18 * (1 + (nextLevel - 1) * 0.025);
    player.moveSpeed = definition.attributes.speed * (1 + Math.min(0.12, (nextLevel - 1) * 0.01));
    if (player.classId === "cutter") {
      player.ribbonWidthBonus = evolution.trailWidth;
      player.trailDamage = 34 * evolution.damage;
      player.phaseDrain = 29 / evolution.resourceEfficiency;
    }
    if (nextLevel > lastClassLevel) {
      showToast(`${definition.name} // NÍVEL ${nextLevel}`, 1600);
      spawnWave(player.x, player.y, player.hue, 120, 0.7);
      sound(definition.sound * 1.25, 0.3, "triangle", 0.035);
    }
    lastClassLevel = nextLevel;
  }

  function updatePlayerClass(dt) {
    classSpecialCooldown = Math.max(0, classSpecialCooldown - dt);
    player.classCooldown = Math.max(0, (player.classCooldown || 0) - dt);
    player.classShieldTimer = Math.max(0, (player.classShieldTimer || 0) - dt);
    player.classStealthTimer = Math.max(0, (player.classStealthTimer || 0) - dt);
    if (player.classStealthTimer > 0) player.hitTimer = Math.max(player.hitTimer, 0.08);
    if (player.classCharging) {
      const evolution = getClassEvolution("marksman", player.classLevel);
      player.classCharge = Math.min(1, player.classCharge + dt * 0.72 * evolution.chargeSpeed);
      player.classResource = Math.max(0, player.classResource - dt * 2);
      if (player.classResource <= 0) releaseMarksman(player);
    }
    if (player.classActionTimer > 0) {
      player.classActionTimer -= dt;
      const speed = 840;
      player.vx = Math.cos(player.classDashAngle) * speed;
      player.vy = Math.sin(player.classDashAngle) * speed;
      player.x = clamp(player.x + player.vx * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      player.y = clamp(player.y + player.vy * dt, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
      for (const bot of bots) {
        if (bot.dead || player.classDashHitIds.has(bot.id)) continue;
        if (Math.hypot(bot.x - player.x, bot.y - player.y) < bot.radius + player.radius + 9) {
          player.classDashHitIds.add(bot.id);
          classDamageTarget(bot, 27, player, player.x, player.y, 360);
        }
      }
      if (player.classActionTimer <= 0) damageInRadius(player, player.x, player.y, 88, 12);
    }
    const regen = { cutter: 15, marksman: 14, charger: 18, trapper: 0.16, defender: 16, assassin: 18, controller: 15, summoner: 0.08, orbiter: 0.32, loader: 0 }[player.classId] || 12;
    if (!player.classCharging && player.classId !== "loader") player.classResource = Math.min(player.classResourceMax, player.classResource + regen * dt);
    if (player.classId === "summoner") player.classResource = classMinions.filter((minion) => minion.owner === player && minion.life > 0).length;
    updateClassProgression();
  }
/*__ECHO_SECTION_END:0126__*/
