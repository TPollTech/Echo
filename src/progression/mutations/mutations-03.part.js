  const MUTATION_STATE_KEYS = [
    "trailDamage", "ribbonLife", "trailLinger", "cooldownScale", "pickupRadius",
    "shellDefense", "siphon", "killRestore", "phaseSpeed", "phaseDrain",
    "arrivalNova", "arrivalGuard", "moteHealing", "healScale", "chainDamage",
    "chainCombo", "chainTimer", "ghostWall", "ghostWallUsed", "vortexPull",
    "reversal", "dualPhase", "dualPhaseCharges", "dualPhaseUsed",
    "ribbonWidthBonus", "ribbonLingerDamageBonus", "killRestoreHealBonus",
    "siphonBonus", "novaRadiusBonus", "vortexPullBonus", "chainWindow",
    "chainMaxStacks", "phasePickupBonus", "ghostwallNova"
  ];

  function snapshotMutationState(target) {
    const snapshot = {};
    for (const key of MUTATION_STATE_KEYS) snapshot[key] = target[key];
    return snapshot;
  }

  function restoreMutationState(target, snapshot) {
    if (!snapshot) return;
    for (const key of MUTATION_STATE_KEYS) target[key] = snapshot[key];
  }

  function captureMutationBaseline(target) {
    target.mutationBaseline = snapshotMutationState(target);
  }

