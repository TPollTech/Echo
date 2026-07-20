      if (bot.archetype !== "sprinter" && bot.archetype !== "sniper" && !bot.stealthed && !(bot.boss && bot.bossPhaseTransitioning)) {
        if (bot.factionTarget && !bot.factionTarget.dead && bot.cooldown <= 0 && bot.energy > 45 && bot.aggression > 0.5) {
          const distToTarget = Math.hypot(bot.x - bot.factionTarget.x, bot.y - bot.factionTarget.y);
          if (distToTarget < attackRange) {
            beginBotPhase(bot, bot.factionTarget);
          }
        } else if (bot.cooldown <= 0 && bot.energy > 45 && distanceToPlayer < attackRange && bot.aggression > 0.5 && (!allyAlreadyAttacking || bot.boss || bot.swarmer)) {
          beginBotPhase(bot);
        }
      }
    }
  }


