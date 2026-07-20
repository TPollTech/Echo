  async function createRoom() {
    setStartStatus("Criando sala local...");
    try {
      const payload = await requestJson("/api/rooms", {
        method: "POST",
        body: JSON.stringify({ name: sanitizeName(ui.name.value) })
      });
      ui.roomCode.value = payload.room.code;
      connectMultiplayer(payload.room.code);
    } catch (error) {
      setStartStatus(error.message, true);
    }
  }

