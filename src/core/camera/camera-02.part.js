  function worldTarget() {
    return {
      x: camera.x + (pointer.x - width / 2) / camera.zoom,
      y: camera.y + (pointer.y - height / 2) / camera.zoom
    };
  }

