  window.__echoDebug = {
    startSoloGame,
    beginPhase,
    endPhase,
    forceMutation() {
      if (state === "playing") {
        player.score = Math.max(player.score, MUTATION_THRESHOLDS[player.nextMutationIndex] || player.score);
        checkMutation();
      }
    },
    forceBoss: spawnSoloBoss,
    winSolo() { finishSolo("victory"); },
    damage(amount = 15) { damagePlayer(amount, player.x - 50, player.y); },
    getState() {
      return {
        state,
        player: {
          x: Math.round(player.x),
          y: Math.round(player.y),
          health: Math.round(player.health),
          energy: Math.round(player.energy),
          score: Math.floor(player.score),
          kills: player.kills,
          phasing: player.phasing,
          mutations: [...(player.mutations || [])]
        },
        mode: activeMode,
        roomCode: multiplayerRoomCode,
        counts: { bots: bots.filter((bot) => !bot.dead).length, motes: motes.length, particles: particles.length }
      };
    }
  };
}());
