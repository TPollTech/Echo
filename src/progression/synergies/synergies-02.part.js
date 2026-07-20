  function checkSynergies() {
    for (const synergy of synergies) {
      if (player.activeSynergies.includes(synergy.id)) continue;
      const hasAll = synergy.requires.every((req) => player.mutations.includes(req));
      if (hasAll) {
        player.activeSynergies.push(synergy.id);
        synergy.apply(player);
        showToast(`SINERGIA: ${synergy.name}`, 2400);
        spawnWave(player.x, player.y, 42, 160, 1.1);
        burst(player.x, player.y, 42, 30);
        sound(440, 0.4, "triangle", 0.06);
        setTimeout(() => sound(660, 0.35, "sine", 0.04), 100);
      }
    }
    updateMutationSlots();
  }

