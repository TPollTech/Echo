  ui.multiplayerMode.addEventListener("click", () => setSelectedMode("multiplayer"));
  ui.createRoom.addEventListener("click", createRoom);
  ui.refreshRooms.addEventListener("click", refreshRooms);
  ui.roomCode.addEventListener("input", () => { ui.roomCode.value = sanitizeRoomCode(ui.roomCode.value); });
