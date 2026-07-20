  function applyBossDefense(bot, amount) {
    let adjusted = amount;
    if (bot.archetype === "necrostro" && bot.bossPhaseIndex >= 1) adjusted *= 0.6;
    if (bot.archetype === "silenciador" && bot.bossPhaseIndex >= 1) adjusted *= 0.75;
    if (bot.copiedDefense) adjusted *= bot.copiedDefense;
    return adjusted;
  }

