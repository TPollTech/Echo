  if (ui.minimap) {
    ui.minimap.addEventListener("click", (event) => {
      if (state !== "playing" || activeMode !== "solo") return;
      const rect = ui.minimap.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const scale = WORLD_SIZE / MINIMAP_SIZE;
      const worldX = mx * scale;
      const worldY = my * scale;
      camera.x = clamp(worldX, width / (2 * camera.zoom), WORLD_SIZE - width / (2 * camera.zoom));
      camera.y = clamp(worldY, height / (2 * camera.zoom), WORLD_SIZE - height / (2 * camera.zoom));
    });
  }

