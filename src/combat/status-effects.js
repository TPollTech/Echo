/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0029__*/
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

  function restorePlayerMutations() {
    if (!player.silenced) return;
    restoreMutationState(player, player.silenceSnapshot);
    player.silenceSnapshot = null;
    player.silenced = false;
    player.silencePermanent = false;
    player.silencedTimer = 0;
    player.damageDebuff = 1;
    ui.mutationSlots.classList.remove("is-silenced");
    showToast("BÔNUS RESTAURADOS", 1500);
    checkMutation();
  }

/*__ECHO_SECTION_END:0029__*/
