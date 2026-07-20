  function updateSoloDirector() {
    const nextStage = runTime >= 240 ? 4 : runTime >= 170 ? 3 : runTime >= 110 ? 2 : runTime >= 65 ? 1 : runTime >= 30 ? 0.5 : 0;
    if (nextStage > soloStage) {
      soloStage = nextStage;
      let additions;
      let label;
      if (soloStage === 0.5) { additions = 1; label = "NOVOS SINAIS DETECTADOS"; }
      else if (soloStage === 1) { additions = 2; label = "AMEAÇA 2 // FREQÜÊNCIAS INIMIGAS ESCALONADAS"; }
      else if (soloStage === 2) { additions = 3; label = "AMEAÇA 3 // CAMPO DE BATALHA INSTÁVEL"; }
      else if (soloStage === 3) {
        additions = 2;
        label = "AMEAÇA 4 // MEGA-AMEAÇA DETECTADA";
        const megaIndices = [bots.length, bots.length + 1];
        for (const idx of megaIndices) {
          const arch = botArchetypes[idx % botArchetypes.length];
          const mega = createBot(idx, {
            health: arch.health * 1.6,
            maxHealth: arch.health * 1.6,
            attackDamage: Math.floor(arch.attackDamage * 1.3),
            speed: arch.speed * 1.1
          });
          bots.push(mega);
        }
      }
      else { additions = 3; label = "AMEAÇA 5 // TERMINAL IMINENTE"; }
      const firstIndex = bots.length;
      for (let index = 0; index < additions; index += 1) bots.push(createBot(firstIndex + index));
      showToast(label, 2200);
      sound(110 + soloStage * 34, 0.6, "sawtooth", 0.035);
    }
    if (!bossSpawned && runTime >= SOLO_BOSS_TIME) spawnSoloBoss();
  }

