  function checkMutation() {
    if (activeMode !== "solo" || player.silenced) return;
    const threshold = MUTATION_THRESHOLDS[player.nextMutationIndex];
    if (threshold && player.score >= threshold && !mutationPending) {
      mutationPending = true;
      window.setTimeout(showMutationChoice, 180);
    }
  }

