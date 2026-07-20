  function captureMutationBaseline(target) {
    target.mutationBaseline = snapshotMutationState(target);
  }

