/* ECHO source module. Sections are assembled by src/build-order.json. */
/*__ECHO_SECTION:0022__*/
  let runModifiers = [];

  const modifierPool = [
    { id: "glass-cannon", name: "ATAQUE ARRISCADO", description: "Causa 50% mais dano, mas reduz a vida máxima em 30%.", symbol: "◇", color: "#ff4fd8", bonusResonance: 15, apply(p) { p.trailDamage *= 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.7); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "vampiric", name: "CURA POR ELIMINAÇÃO", description: "Dobra a vida recuperada ao eliminar um inimigo.", symbol: "♦", color: "#ff557a", bonusResonance: 10, apply(p) { p.killRestoreHealBonus = (p.killRestoreHealBonus || 1) * 2; } },
    { id: "glass-boot", name: "PROJEÇÃO EFICIENTE", description: "Move 30% mais rápido na projeção e gasta 20% menos energia.", symbol: "△", color: "#45e6ff", bonusResonance: 10, apply(p) { p.phaseSpeed *= 1.3; p.phaseDrain *= 0.8; } },
    { id: "magnetic", name: "COLETA AMPLIADA", description: "Dobra a distância usada para atrair e coletar fragmentos.", symbol: "◎", color: "#78ffba", bonusResonance: 12, apply(p) { p.pickupRadius *= 2; } },
    { id: "fortified", name: "MAIS RESISTÊNCIA", description: "Aumenta a vida máxima em 40%, mas reduz o dano em 20%.", symbol: "□", color: "#a88cff", bonusResonance: 12, apply(p) { p.maxHealth = Math.floor(p.maxHealth * 1.4); p.health = p.maxHealth; p.trailDamage *= 0.8; } },
    { id: "overclocked", name: "RECARGA RÁPIDA", description: "Reduz o tempo de recarga em 40%, mas aumenta o gasto de energia em 30%.", symbol: "⚡", color: "#ffe066", bonusResonance: 15, apply(p) { p.cooldownScale *= 0.6; p.phaseDrain *= 1.3; } },
    { id: "risk-reward", name: "MAIS PONTOS", description: "Aumenta os pontos recebidos em 50%, mas reduz a vida máxima em 20%.", symbol: "⬡", color: "#5ce0d2", bonusResonance: 20, apply(p) { p.scoreMultiplier = 1.5; p.maxHealth = Math.floor(p.maxHealth * 0.8); p.health = Math.min(p.health, p.maxHealth); } },
    { id: "glass-trail", name: "RASTRO FORTE", description: "Dobra o dano do rastro, mas reduz sua duração em 40%.", symbol: "⟋", color: "#c8b8ff", bonusResonance: 18, apply(p) { p.trailDamage *= 2; p.ribbonLife *= 0.6; p.trailLinger *= 0.6; } },
    { id: "berserker", name: "ÚLTIMO ESFORÇO", description: "Causa 30% mais dano enquanto estiver abaixo de 50% de vida.", symbol: "☣", color: "#ff8c42", bonusResonance: 12, apply(p) { p.berserkerBonus = 1.3; } }
  ];

  function applyModifiers() {
    for (const mod of runModifiers) {
      mod.apply(player);
    }
  }

/*__ECHO_SECTION_END:0022__*/
