  let player = createPlayer();
  let bots = [];
  let motes = [];
  let particles = [];
  let ribbons = [];
  let waves = [];
  let scars = [];
  let ambientSeeds = [];

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function hsl(hue, saturation = 90, lightness = 62, alpha = 1) {
    return `hsla(${hue} ${saturation}% ${lightness}% / ${alpha})`;
  }

