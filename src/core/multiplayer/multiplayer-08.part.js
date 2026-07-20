  async function refreshRooms() {
    if (selectedMode !== "multiplayer") return;
    ui.roomList.replaceChildren();
    try {
      const payload = await requestJson("/api/rooms");
      if (!payload.rooms.length) {
        ui.roomList.textContent = "Nenhuma sala ativa. Crie a primeira ressonância.";
        return;
      }
      for (const room of payload.rooms) {
        const button = document.createElement("button");
        button.type = "button";
        button.innerHTML = `<strong>${room.code}</strong><span>${room.players}/${room.maxPlayers} SINAIS</span><span>${formatTime(room.remaining)}</span>`;
        button.addEventListener("click", () => {
          ui.roomCode.value = room.code;
          setStartStatus(`Sala ${room.code} selecionada.`);
        });
        ui.roomList.append(button);
      }
    } catch (error) {
      setStartStatus(`Servidor local indisponível: ${error.message}`, true);
    }
  }

