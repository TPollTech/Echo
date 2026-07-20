  const skins = [
    { id: "spectro", name: "ESPECTRO", hue: 188, description: "Frequência base", unlocked: () => true, glowIntensity: 1, trailWidth: 1, symbol: "◇" },
    { id: "fenix", name: "FÊNIX", hue: 15, description: "Chamas eternas", unlocked: () => true, glowIntensity: 1.2, trailWidth: 1.1, symbol: "◆" },
    { id: "sombra", name: "SOMBRA", hue: 280, description: "Aura das trevas", unlocked: () => true, glowIntensity: 0.82, trailWidth: 0.95, symbol: "●" },
    { id: "gelo", name: "GELO", hue: 200, description: "Cristais gélidos", unlocked: () => true, glowIntensity: 1.05, trailWidth: 1, symbol: "◈" },
    { id: "neon", name: "NEON", hue: 140, description: "Brilho sintético", unlocked: () => true, glowIntensity: 1.45, trailWidth: 1.2, symbol: "◇" },
    { id: "sangue", name: "SANGUE", hue: 350, description: "Gotas vermelhas", unlocked: () => true, glowIntensity: 1.1, trailWidth: 1.05, symbol: "◆" },
    { id: "dourado", name: "DOURADO", hue: 42, description: "Derrote um boss para liberar", unlocked: () => skinProgress.bossesDefeated >= 1, glowIntensity: 1.35, trailWidth: 1.12, symbol: "★" },
    { id: "caotico", name: "CAÓTICO", hue: -1, description: "Alcance 500 pontos para liberar", unlocked: () => skinProgress.bestScore >= 500, glowIntensity: 1.25, trailWidth: 1.3, symbol: "✦" }
  ];

