  function spawnSoloBoss(templateId = null) {
    if (activeMode !== "solo" || state !== "playing" || bossSpawned) return;
    bossSpawned = true;
    const boss = createBoss(templateId);
    const stageMultiplier = 1 + soloStage * 0.18;
    boss.health = Math.floor(boss.health * stageMultiplier);
    boss.maxHealth = boss.health;
    boss.attackDamage = Math.floor(boss.attackDamage * (1 + soloStage * 0.12));
    const angle = Math.random() * TAU;
    boss.x = clamp(player.x + Math.cos(angle) * 620, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    boss.y = clamp(player.y + Math.sin(angle) * 620, WORLD_MARGIN, WORLD_SIZE - WORLD_MARGIN);
    bots.push(boss);
    activeBoss = boss;
    showToast(boss.bossTemplate.spawnDialogue, 3200);
    sound(62, 1.1, "sawtooth", 0.07);
  }

