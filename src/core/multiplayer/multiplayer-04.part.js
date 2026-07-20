  function finishMultiplayer(standings = []) {
    if (activeMode !== "multiplayer" || state === "gameover") return;
    state = "gameover";
    endPhase(true);
    const rank = Math.max(1, standings.findIndex((entry) => entry.id === multiplayerPlayerId) + 1);
    const self = standings.find((entry) => entry.id === multiplayerPlayerId) || player;
    ui.gameoverKicker.innerHTML = `<span></span> PARTIDA ENCERRADA // SALA ${multiplayerRoomCode}`;
    ui.gameoverKicker.classList.toggle("danger", rank !== 1);
    ui.gameoverTitle.textContent = rank === 1 ? "RESSONÂNCIA DOMINANTE." : `${rank}º LUGAR REGISTRADO.`;
    ui.gameoverCopy.textContent = "O resultado foi persistido no banco local do servidor.";
    ui.finalTimeLabel.textContent = "POSIÇÃO";
    ui.finalScore.textContent = Math.floor(self.score || 0).toString();
    ui.finalKills.textContent = String(self.kills || 0);
    ui.finalTime.textContent = `${rank}º`;
    ui.restart.querySelector("span").textContent = "VOLTAR AO MENU";
    ui.gameover.classList.remove("is-hidden");
  }

