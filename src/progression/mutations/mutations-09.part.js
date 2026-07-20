  function chooseMutation(mutation) {
    mutation.apply(player);
    player.mutations.push(mutation.id);
    player.nextMutationIndex += 1;
    mutationPending = false;
    state = "playing";
    ui.mutation.classList.add("is-hidden");
    updateMutationSlots();
    checkSynergies();
    showToast(`${mutation.name.toUpperCase()} INTEGRADA`, 1800);
    spawnWave(player.x, player.y, player.hue, 130, 0.9);
    burst(player.x, player.y, player.hue, 24);
    sound(330, 0.34, "triangle", 0.05);
  }

