  function restorePlayerMutations() {
    if (!player.silenced) return;
    restoreMutationState(player, player.silenceSnapshot);
    player.silenceSnapshot = null;
    player.silenced = false;
    player.silencePermanent = false;
    player.silencedTimer = 0;
    player.damageDebuff = 1;
    ui.mutationSlots.classList.remove("is-silenced");
    showToast("MUTAÇÕES RESTAURADAS", 1500);
    checkMutation();
  }

