  function applyMultiplayerSnapshot(snapshot) {
    multiplayerSnapshot = snapshot;
    multiplayerRemaining = snapshot.remaining;
    runTime = snapshot.elapsed;
    const incomingPlayer = snapshot.players.find((entry) => entry.id === multiplayerPlayerId);
    if (incomingPlayer) player = mergeNetworkEntity(player.id === incomingPlayer.id ? player : null, incomingPlayer);
    const existingBots = new Map(bots.map((bot) => [bot.id, bot]));
    bots = snapshot.players
      .filter((entry) => entry.id !== multiplayerPlayerId)
      .map((entry) => mergeNetworkEntity(existingBots.get(entry.id), entry));
    motes = snapshot.motes;
    ribbons = snapshot.ribbons.map((ribbon) => ({ ...ribbon, points: ribbon.points.map((point) => ({ ...point })) }));
    updateLeaderboard();
    updateHud();
  }

