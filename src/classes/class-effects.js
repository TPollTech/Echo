/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0127__*/
  function closestClassTarget(owner, x, y, maximum = Infinity) {
    const targets = owner === player ? bots.filter((bot) => !bot.dead) : [player];
    let closest = null;
    let closestDistance = maximum;
    for (const target of targets) {
      if (!target || target.dead || target.respawnTimer > 0) continue;
      const distance = Math.hypot(target.x - x, target.y - y);
      if (distance < closestDistance) {
        closest = target;
        closestDistance = distance;
      }
    }
    return closest;
  }

  function updateClassProjectiles(dt) {
    for (let index = classProjectiles.length - 1; index >= 0; index -= 1) {
      const projectile = classProjectiles[index];
      projectile.life -= dt;
      if (projectile.life <= 0) {
        classProjectiles.splice(index, 1);
        continue;
      }
      if (projectile.homing > 0) {
        const target = closestClassTarget(projectile.owner, projectile.x, projectile.y, 520);
        if (target) {
          const speed = Math.hypot(projectile.vx, projectile.vy);
          const desired = Math.atan2(target.y - projectile.y, target.x - projectile.x);
          const current = Math.atan2(projectile.vy, projectile.vx);
          const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
          const angle = current + clamp(delta, -projectile.homing * dt, projectile.homing * dt);
          projectile.vx = Math.cos(angle) * speed;
          projectile.vy = Math.sin(angle) * speed;
        }
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      if (projectile.x < WORLD_MARGIN || projectile.x > WORLD_SIZE - WORLD_MARGIN || projectile.y < WORLD_MARGIN || projectile.y > WORLD_SIZE - WORLD_MARGIN) {
        if (projectile.explosive) damageInRadius(projectile.owner, projectile.x, projectile.y, projectile.explosive, projectile.damage * 0.55);
        classProjectiles.splice(index, 1);
        continue;
      }
      const targets = projectile.owner === player ? bots : [player];
      for (const target of targets) {
        if (!target || target.dead || projectile.hitIds.has(target.id)) continue;
        if (Math.hypot(target.x - projectile.x, target.y - projectile.y) > target.radius + projectile.radius) continue;
        projectile.hitIds.add(target.id);
        classDamageTarget(target, projectile.damage, projectile.owner, projectile.x, projectile.y, 90);
        if (projectile.slow > 0 && target !== player) target.classSlowTimer = Math.max(target.classSlowTimer || 0, projectile.slow);
        if (projectile.explosive) damageInRadius(projectile.owner, projectile.x, projectile.y, projectile.explosive, projectile.damage * 0.55);
        burst(projectile.x, projectile.y, projectile.hue, 6);
        if (projectile.pierce > 0) projectile.pierce -= 1;
        else {
          projectile.life = 0;
          break;
        }
      }
      if (projectile.life <= 0) classProjectiles.splice(index, 1);
    }
  }

  function updateClassTraps(dt) {
    for (let index = classTraps.length - 1; index >= 0; index -= 1) {
      const trap = classTraps[index];
      trap.life -= dt;
      trap.armed -= dt;
      if (trap.life <= 0) {
        if (trap.owner?.classId === "trapper") trap.owner.classResource = Math.min(trap.owner.classResourceMax, trap.owner.classResource + 1);
        classTraps.splice(index, 1);
        continue;
      }
      if (trap.armed > 0) continue;
      const target = closestClassTarget(trap.owner, trap.x, trap.y, trap.radius + 28);
      if (!target) continue;
      classDamageTarget(target, trap.damage, trap.owner, trap.x, trap.y, 120);
      if (target !== player) {
        target.classSlowTimer = 2.8;
        target.speed *= trap.slow;
      } else {
        player.vx *= trap.slow;
        player.vy *= trap.slow;
      }
      spawnWave(trap.x, trap.y, trap.hue, trap.radius, 0.6);
      trap.life = 0;
    }
  }

  function updateClassFields(dt) {
    for (let index = classFields.length - 1; index >= 0; index -= 1) {
      const field = classFields[index];
      field.life -= dt;
      field.tick -= dt;
      if (field.life <= 0) {
        classFields.splice(index, 1);
        continue;
      }
      const targets = field.owner === player ? bots : [player];
      for (const target of targets) {
        if (!target || target.dead) continue;
        const dx = field.x - target.x;
        const dy = field.y - target.y;
        const distance = Math.hypot(dx, dy) || 1;
        if (distance > field.radius + target.radius) continue;
        if (field.type === "gravity") {
          const pull = field.strength * (1 - Math.min(1, distance / field.radius)) * dt;
          target.vx += (dx / distance) * pull;
          target.vy += (dy / distance) * pull;
        }
        if (field.type === "slow" && target !== player) {
          target.classSlowTimer = Math.max(target.classSlowTimer || 0, 0.22);
          target.vx *= 0.62;
          target.vy *= 0.62;
        }
        if (field.tick <= 0 && field.damage > 0) classDamageTarget(target, field.damage, field.owner, field.x, field.y, 0);
      }
      if (field.owner === player && field.type === "gravity") {
        for (const mote of motes) {
          const dx = field.x - mote.x;
          const dy = field.y - mote.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < field.radius * 1.35) {
            mote.x += (dx / distance) * field.strength * 0.55 * dt;
            mote.y += (dy / distance) * field.strength * 0.55 * dt;
          }
        }
      }
      if (field.tick <= 0) field.tick = 0.42;
    }
  }

  function updateClassMinions(dt) {
    for (let index = classMinions.length - 1; index >= 0; index -= 1) {
      const minion = classMinions[index];
      minion.life -= dt;
      minion.attackTimer -= dt;
      minion.frenzy = Math.max(0, minion.frenzy - dt);
      if (minion.life <= 0 || minion.health <= 0 || minion.owner?.dead) {
        classMinions.splice(index, 1);
        continue;
      }
      const target = closestClassTarget(minion.owner, minion.x, minion.y, 850);
      if (target) {
        const speed = 235 * (minion.frenzy > 0 ? 1.55 : 1);
        const desired = { x: minion.x, y: minion.y, vx: minion.vx, vy: minion.vy };
        steerVelocity(desired, target.x, target.y, speed, dt, 7);
        minion.vx = desired.vx;
        minion.vy = desired.vy;
        minion.x += minion.vx * dt;
        minion.y += minion.vy * dt;
        if (Math.hypot(target.x - minion.x, target.y - minion.y) < target.radius + 16 && minion.attackTimer <= 0) {
          classDamageTarget(target, 8 * (minion.frenzy > 0 ? 1.65 : 1), minion.owner, minion.x, minion.y, 35);
          minion.attackTimer = minion.frenzy > 0 ? 0.42 : 0.75;
        }
      } else {
        const angle = runTime * 1.4 + index * 1.7;
        minion.x = lerp(minion.x, minion.owner.x + Math.cos(angle) * 48, dt * 3);
        minion.y = lerp(minion.y, minion.owner.y + Math.sin(angle) * 48, dt * 3);
      }
    }
  }

  function updateClassCombat(dt) {
    updatePlayerClass(dt);
    updateClassProjectiles(dt);
    updateClassTraps(dt);
    updateClassFields(dt);
    updateClassMinions(dt);
    for (let index = classDamageNumbers.length - 1; index >= 0; index -= 1) {
      const number = classDamageNumbers[index];
      number.life -= dt;
      number.y -= 24 * dt;
      if (number.life <= 0) classDamageNumbers.splice(index, 1);
    }
    for (const bot of bots) {
      if ((bot.classSlowTimer || 0) > 0) {
        bot.classSlowTimer -= dt;
        if (bot.classSlowTimer <= 0 && bot.classDefinition) bot.speed = bot.classDefinition.attributes.speed;
      }
    }
  }

  function drawClassCombat(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const field of classFields) {
      if (!visible(field.x, field.y, field.radius)) continue;
      const point = toScreen(field.x, field.y);
      const radius = field.radius * camera.zoom;
      const pulse = 0.85 + Math.sin(time * 0.006) * 0.08;
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      gradient.addColorStop(0, hsl(field.hue, 90, 60, 0.14));
      gradient.addColorStop(0.72, hsl(field.hue, 88, 48, 0.07));
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(point.x, point.y, radius * pulse, 0, TAU); ctx.fill();
      ctx.strokeStyle = hsl(field.hue, 94, 70, 0.42);
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(point.x, point.y, radius * pulse, 0, TAU); ctx.stroke();
    }
    for (const trap of classTraps) {
      if (!visible(trap.x, trap.y, trap.radius)) continue;
      const point = toScreen(trap.x, trap.y);
      const radius = trap.radius * camera.zoom;
      ctx.strokeStyle = hsl(trap.hue, 90, 68, trap.armed > 0 ? 0.22 : 0.62);
      ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      for (let marker = 0; marker < 3; marker += 1) {
        const angle = time * 0.001 + marker * TAU / 3;
        ctx.fillStyle = hsl(trap.hue, 95, 72, 0.8);
        ctx.beginPath(); ctx.arc(point.x + Math.cos(angle) * radius * 0.72, point.y + Math.sin(angle) * radius * 0.72, 2.5, 0, TAU); ctx.fill();
      }
    }
    for (const projectile of classProjectiles) {
      if (!visible(projectile.x, projectile.y, 30)) continue;
      const point = toScreen(projectile.x, projectile.y);
      ctx.shadowColor = hsl(projectile.hue, 96, 64, 0.9);
      ctx.shadowBlur = MOBILE_QUALITY ? 0 : 14;
      ctx.fillStyle = hsl(projectile.hue, 96, 72, 0.92);
      ctx.beginPath(); ctx.arc(point.x, point.y, projectile.radius * camera.zoom, 0, TAU); ctx.fill();
      ctx.strokeStyle = hsl(projectile.hue, 90, 60, 0.35);
      ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(point.x - projectile.vx * 0.028 * camera.zoom, point.y - projectile.vy * 0.028 * camera.zoom); ctx.stroke();
    }
    for (const minion of classMinions) {
      if (!visible(minion.x, minion.y, 30)) continue;
      const point = toScreen(minion.x, minion.y);
      ctx.fillStyle = hsl(minion.hue, 92, 70, 0.9);
      ctx.beginPath(); ctx.arc(point.x, point.y, minion.radius * camera.zoom, 0, TAU); ctx.fill();
      ctx.strokeStyle = hsl(minion.hue, 94, 64, 0.45);
      ctx.beginPath(); ctx.arc(point.x, point.y, (minion.radius + 5 + Math.sin(time * 0.008) * 2) * camera.zoom, 0, TAU); ctx.stroke();
    }
    ctx.restore();

    if (preparation.settings.showDamage) {
      ctx.save(); ctx.textAlign = "center"; ctx.font = "700 11px Inter, sans-serif";
      for (const number of classDamageNumbers) {
        const point = toScreen(number.x, number.y);
        ctx.fillStyle = hsl(number.hue, 95, 72, clamp(number.life / number.maxLife, 0, 1));
        ctx.fillText(`-${number.amount}`, point.x, point.y);
      }
      ctx.restore();
    }

    if (player.classCharging) {
      const origin = toScreen(player.x, player.y);
      ctx.save();
      ctx.strokeStyle = hsl(player.hue, 95, 72, 0.28 + player.classCharge * 0.5);
      ctx.lineWidth = 1 + player.classCharge * 2;
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    if (player.classShieldTimer > 0) {
      const point = toScreen(player.x, player.y);
      ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(player.classShieldAngle);
      ctx.strokeStyle = hsl(player.hue, 96, 76, 0.78); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, 0, (player.radius + 14) * camera.zoom, -0.85, 0.85); ctx.stroke(); ctx.restore();
    }

    if (player.classId === "orbiter") {
      const count = Math.floor(player.classResource);
      const point = toScreen(player.x, player.y);
      ctx.save();
      for (let index = 0; index < count; index += 1) {
        const angle = time * 0.0024 + index * TAU / Math.max(1, count);
        const radius = (player.radius + 24) * camera.zoom;
        ctx.fillStyle = hsl(player.hue + index * 12, 94, 72, 0.88);
        ctx.beginPath(); ctx.arc(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius, 5 * camera.zoom, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }
/*__ECHO_SECTION_END:0127__*/
