  const modifierPool = [
    { id: "glass-cannon", name: "CANHÃO DE CRISTAL", description: "Dano x1.5, mas HP máximo -30%.", symbol: "◇", color: "#ff4fd8", bonusResonance: 15, apply(p) { p.trailDamage *= 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.7); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "vampiric", name: "INSTINTO VAMPIRO", description: "Cura por kill x2, regen passiva -50%.", symbol: "♦", color: "#ff557a", bonusResonance: 10, apply(p) { p.killRestoreHealBonus = (p.killRestoreHealBonus || 1) * 2; } },
    { id: "glass-boot", name: "PASSOS DE CRISTAL", description: "Velocidade de phase +30%, energia drena -20%.", symbol: "△", color: "#45e6ff", bonusResonance: 10, apply(p) { p.phaseSpeed *= 1.3; p.phaseDrain *= 0.8; } },
    { id: "magnetic", name: "CORPO MAGNÉTICO", description: "Raio de coleta x2, motes atraídos.", symbol: "◎", color: "#78ffba", bonusResonance: 12, apply(p) { p.pickupRadius *= 2; } },
    { id: "fortified", name: "FORTALECIDO", description: "HP +40%, dano -20%.", symbol: "□", color: "#a88cff", bonusResonance: 12, apply(p) { p.maxHealth = Math.floor(p.maxHealth * 1.4); p.health = p.maxHealth; p.trailDamage *= 0.8; } },
    { id: "overclocked", name: "SOBRECARGA", description: "Cooldown -40%, energia drena +30%.", symbol: "⚡", color: "#ffe066", bonusResonance: 15, apply(p) { p.cooldownScale *= 0.6; p.phaseDrain *= 1.3; } },
    { id: "risk-reward", name: "RISCO E RECOMPENSA", description: "Score x1.5, HP máximo -20%.", symbol: "⬡", color: "#5ce0d2", bonusResonance: 20, apply(p) { p.scoreMultiplier = 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.8); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "glass-trail", name: "Rastro DE CRISTAL", description: "Dano do rastro x2, mas rastro dura 40% menos.", symbol: "⟋", color: "#c8b8ff", bonusResonance: 18, apply(p) { p.trailDamage *= 2; p.ribbonLife *= 0.6; p.trailLinger *= 0.6; } },
    { id: "berserker", name: "BERSERKER", description: "Dano +30% abaixo de 50% HP.", symbol: "☣", color: "#ff8c42", bonusResonance: 12, apply(p) { p.berserkerBonus = 1.3; } }
  ];

