  function collectBotMotes(bot) {
    for (let index = motes.length - 1; index >= 0; index -= 1) {
      const mote = motes[index];
      const range = bot.radius + mote.radius + 3;
      if (distanceSq(bot.x, bot.y, mote.x, mote.y) < range * range) {
        bot.score += mote.type === "gold" ? 5 : mote.type === "violet" ? 2 : 1;
        bot.energy = Math.min(100, bot.energy + 2);
        motes.splice(index, 1);
        motes.push(createMote());
        break;
      }
    }
  }

