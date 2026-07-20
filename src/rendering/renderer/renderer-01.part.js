  function toScreen(x, y) {
    return {
      x: (x - camera.x) * camera.zoom + width / 2,
      y: (y - camera.y) * camera.zoom + height / 2
    };
  }

