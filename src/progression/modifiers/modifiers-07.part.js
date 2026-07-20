  function selectModifier(mod) {
    runModifiers = mod ? [mod] : [];
    document.getElementById("modifier-screen").classList.add("is-hidden");
    if (mod) {
      pendingResonance += mod.bonusResonance;
      showToast(`MODIFICADOR: ${mod.name} (+${mod.bonusResonance} ressonância)`, 2000);
    }
    startSoloGame();
  }

