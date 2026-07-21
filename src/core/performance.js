/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0124__*/
  const PERFORMANCE_PROFILE = Object.freeze({
    activeMinimumFrameMs: MOBILE_QUALITY ? 12 : 10,
    idleMinimumFrameMs: 28,
    hudInterval: MOBILE_QUALITY ? 1 / 15 : 1 / 30,
    slowFrameMs: MOBILE_QUALITY ? 18 : 21.5,
    recoveryFrameMs: MOBILE_QUALITY ? 14 : 17.2,
    scaleCooldownMs: MOBILE_QUALITY ? 2000 : 4200,
    slowSamplesBeforeScale: MOBILE_QUALITY ? 8 : 36,
    fastSamplesBeforeScale: MOBILE_QUALITY ? 80 : 300
  });

  const nativeRenderDpr = Math.min(window.devicePixelRatio || 1, MOBILE_QUALITY ? 1.5 : 2);
  const renderPerformance = {
    averageFrameMs: 1000 / 60,
    averageWorkMs: 0,
    dprCap: nativeRenderDpr,
    minimumDpr: Math.min(nativeRenderDpr, MOBILE_QUALITY ? 0.6 : 1.25),
    maximumDpr: nativeRenderDpr,
    slowSamples: 0,
    fastSamples: 0,
    lastScaleChange: 0,
    scaleChanges: 0
  };

  let hudUpdateTimer = 0;
  let musicUpdateTimer = 0;

  function targetRenderDpr() {
    const manualScale = clamp(Number(preparation?.settings?.renderScale ?? 100) / 100, 0.55, 1);
    return Math.max(0.5, Math.min(window.devicePixelRatio || 1, renderPerformance.dprCap) * manualScale);
  }

  function updateAdaptiveResolution(frameMs, workMs, now) {
    if (state !== "playing" || document.hidden || preparation?.settings?.autoQuality === false) return;
    renderPerformance.averageFrameMs = lerp(renderPerformance.averageFrameMs, frameMs, 0.06);
    renderPerformance.averageWorkMs = lerp(renderPerformance.averageWorkMs, workMs, 0.08);
    if (now - renderPerformance.lastScaleChange < PERFORMANCE_PROFILE.scaleCooldownMs) return;

    const overloaded = renderPerformance.averageFrameMs > PERFORMANCE_PROFILE.slowFrameMs
      || renderPerformance.averageWorkMs > 15.5;
    const comfortable = renderPerformance.averageFrameMs < PERFORMANCE_PROFILE.recoveryFrameMs
      && renderPerformance.averageWorkMs < 10.5;

    if (overloaded) {
      renderPerformance.slowSamples += 1;
      renderPerformance.fastSamples = 0;
    } else if (comfortable) {
      renderPerformance.fastSamples += 1;
      renderPerformance.slowSamples = Math.max(0, renderPerformance.slowSamples - 2);
    } else {
      renderPerformance.slowSamples = Math.max(0, renderPerformance.slowSamples - 1);
      renderPerformance.fastSamples = Math.max(0, renderPerformance.fastSamples - 1);
    }

    if (renderPerformance.slowSamples >= PERFORMANCE_PROFILE.slowSamplesBeforeScale
      && renderPerformance.dprCap > renderPerformance.minimumDpr) {
      renderPerformance.dprCap = Math.max(renderPerformance.minimumDpr, renderPerformance.dprCap - (MOBILE_QUALITY ? 0.35 : 0.25));
      renderPerformance.slowSamples = 0;
      renderPerformance.fastSamples = 0;
      renderPerformance.lastScaleChange = now;
      renderPerformance.scaleChanges += 1;
      resize(true);
    } else if (renderPerformance.fastSamples >= PERFORMANCE_PROFILE.fastSamplesBeforeScale
      && renderPerformance.dprCap < renderPerformance.maximumDpr) {
      renderPerformance.dprCap = Math.min(renderPerformance.maximumDpr, renderPerformance.dprCap + 0.125);
      renderPerformance.slowSamples = 0;
      renderPerformance.fastSamples = 0;
      renderPerformance.lastScaleChange = now;
      renderPerformance.scaleChanges += 1;
      resize(true);
    }
  }

/*__ECHO_SECTION_END:0124__*/
