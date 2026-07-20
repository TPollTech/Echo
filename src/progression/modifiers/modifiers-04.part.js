  function generateModifierChoices() {
    const shuffled = [...modifierPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

