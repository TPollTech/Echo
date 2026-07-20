  function respawnBot(bot) {
    if (bot.boss) return;
    const fresh = createBot(Math.floor(Math.random() * names.length));
    Object.assign(bot, fresh, { id: bot.id });
  }

