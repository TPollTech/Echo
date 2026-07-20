  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let state = "intro";
  let previousTime = performance.now();
  let runTime = 0;
  let screenShake = 0;
  let flash = 0;
