  function silencePlayer(duration, permanent = false) {
    if (!player.mutationBaseline) captureMutationBaseline(player);
    if (!player.silenced) {
      player.silenceSnapshot = snapshotMutationState(player);
      restoreMutationState(player, player.mutationBaseline);
    }
    player.silenced = true;
    player.silencePermanent = player.silencePermanent || permanent;
    player.silencedTimer = permanent ? Number.POSITIVE_INFINITY : Math.max(player.silencedTimer || 0, duration);
    player.damageDebuff = 0.75;
    ui.mutationSlots.classList.add("is-silenced");
  }

