  function applyModifiers() {
    for (const mod of runModifiers) {
      mod.apply(player);
    }
  }

