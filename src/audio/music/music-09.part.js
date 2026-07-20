  function updateMusic() {
    if (!musicActive || !audioContext || !musicLayers.master) return;
    const hp = player.health / (player.maxHealth || 100);
    const combo = player.combo || 0;
    const isBoss = Boolean(activeBoss && !activeBoss.dead);
    const isPhasing = Boolean(player.phasing);
    const stage = Number(soloStage || 0);
    const intensity = clamp(
      0.3
        + stage * 0.08
        + Math.min(combo, 12) * 0.012
        + (isBoss ? 0.24 : 0)
        + (isPhasing ? 0.06 : 0),
      0.28,
      0.92
    );
    const targetTempo = isBoss ? 104 : 86 + Math.min(12, stage * 4);
    const targetGain = muted ? 0.0001 : Math.max(0.0001, masterVolume * 0.55);
    const now = audioContext.currentTime;

    musicLayers.intensity = intensity;
    musicLayers.bossMode = isBoss;
    musicLayers.tempo += (targetTempo - musicLayers.tempo) * 0.025;
    musicLayers.master.gain.cancelScheduledValues(now);
    musicLayers.master.gain.setTargetAtTime(targetGain, now, 0.08);
    musicLayers.filter.frequency.setTargetAtTime(
      2100 + intensity * 2500 + (hp < 0.3 ? -350 : 0),
      now,
      0.12
    );
    musicLayers.wet.gain.setTargetAtTime(isBoss ? 0.2 : 0.14, now, 0.15);
  }

