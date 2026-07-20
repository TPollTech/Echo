  let minimapFrame = 0;
  const MINIMAP_SIZE = MOBILE_QUALITY ? 100 : 140;

  if (MOBILE_QUALITY && ui.minimap) {
    ui.minimap.width = 100;
    ui.minimap.height = 100;
  }

