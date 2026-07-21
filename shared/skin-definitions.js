"use strict";

const EchoSkinSystem = (() => {
  const SKIN_DEFINITIONS = Object.freeze([
    { id: "azul-neon", name: "AZUL NEON", hue: 188, colors: ["#45e6ff", "#137da8", "#d8fbff"], rarity: "COMUM", description: "Linhas elétricas azuis e halo duplo.", unlock: "always", glowIntensity: 1, trailWidth: 1, style: "electric", symbol: "N" },
    { id: "roxo-neon", name: "ROXO NEON", hue: 268, colors: ["#a78bfa", "#5b21b6", "#f1e9ff"], rarity: "COMUM", description: "Faixas violetas girando ao redor do núcleo.", unlock: "always", glowIntensity: 1.1, trailWidth: 1, style: "violet", symbol: "V" },
    { id: "vermelho", name: "BRASA", hue: 350, colors: ["#ff4f72", "#9f1239", "#ffd1da"], rarity: "COMUM", description: "Faíscas quentes e rastro de brasa.", unlock: "always", glowIntensity: 1.12, trailWidth: 1.05, style: "ember", symbol: "B" },
    { id: "dourado", name: "CAMPEÃO", hue: 42, colors: ["#ffd86b", "#b7791f", "#fff4bd"], rarity: "RARO", description: "Acabamento dourado liberado ao vencer um chefe.", unlock: "boss", glowIntensity: 1.35, trailWidth: 1.12, style: "champion", symbol: "C" },
    { id: "gelo", name: "GELO", hue: 200, colors: ["#9eefff", "#3b82f6", "#effcff"], rarity: "COMUM", description: "Cristais de gelo e brilho branco.", unlock: "always", glowIntensity: 1.05, trailWidth: 1, style: "ice", symbol: "G" },
    { id: "sombra", name: "SOMBRA", hue: 280, colors: ["#7c3aed", "#211533", "#c4b5fd"], rarity: "RARO", description: "Névoa escura com pontos de luz violeta.", unlock: "always", glowIntensity: 0.82, trailWidth: 0.95, style: "shadow", symbol: "S" },
    { id: "arco-iris", name: "PRISMA", hue: -1, colors: ["#ff4fd8", "#45e6ff", "#ffd86b"], rarity: "LENDÁRIO", description: "Cores em movimento, liberadas ao alcançar 500 pontos.", unlock: "score-500", glowIntensity: 1.25, trailWidth: 1.3, style: "prism", symbol: "P" },
    { id: "branco", name: "PÉROLA", hue: 0, colors: ["#ffffff", "#a5b4fc", "#e0f2fe"], rarity: "COMUM", description: "Brilho suave com reflexos azulados.", unlock: "always", glowIntensity: 1.15, trailWidth: 1, style: "pearl", symbol: "P" },
    { id: "preto", name: "ECLIPSE", hue: 260, colors: ["#353046", "#090611", "#8b5cf6"], rarity: "RARO", description: "Núcleo escuro cercado por um aro quebrado.", unlock: "always", glowIntensity: 0.7, trailWidth: 1.15, style: "eclipse", symbol: "E" },
    { id: "verde-toxico", name: "TÓXICO", hue: 122, colors: ["#78ff5c", "#15803d", "#d9ffd0"], rarity: "COMUM", description: "Bolhas verdes e pequenas gotas no rastro.", unlock: "always", glowIntensity: 1.3, trailWidth: 1.08, style: "toxic", symbol: "T" }
  ].map((skin) => Object.freeze({ ...skin, colors: Object.freeze([...skin.colors]) })));

  const getSkinDefinition = (skinId) => SKIN_DEFINITIONS.find((skin) => skin.id === skinId) || SKIN_DEFINITIONS[0];
  return Object.freeze({ SKIN_DEFINITIONS, getSkinDefinition });
})();

if (typeof globalThis !== "undefined") globalThis.EchoSkinSystem = EchoSkinSystem;
if (typeof module !== "undefined" && module.exports) module.exports = EchoSkinSystem;
