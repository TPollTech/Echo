(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EchoEnemyContracts = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const contracts = Object.freeze({
    hunter: Object.freeze({ id: "hunter", role: "PERSEGUIDOR", intent: "interceptar rotas e negar conforto", weakness: "vulnerável quando compromete a perseguição", telegraphMs: 420, tier: 0 }),
    warden: Object.freeze({ id: "warden", role: "CONTROLADOR", intent: "proteger território e fragmentos", weakness: "lento fora da zona guardada", telegraphMs: 560, tier: 0 }),
    drainer: Object.freeze({ id: "drainer", role: "LADRÃO DE CARGA", intent: "drenar energia e recuar", weakness: "baixo dano durante a fuga", telegraphMs: 500, tier: 0 }),
    weaver: Object.freeze({ id: "weaver", role: "TECELÃO DE CAMPO", intent: "criar linhas perigosas e fechar rotas", weakness: "fica exposto após tecer", telegraphMs: 620, tier: 1 }),
    sniper: Object.freeze({ id: "sniper", role: "PRESSÃO À DISTÂNCIA", intent: "forçar reposicionamento com mira carregada", weakness: "frágil durante a mira e a recarga", telegraphMs: 920, tier: 2 }),
    swarmer: Object.freeze({ id: "swarmer", role: "PRESSÃO DE GRUPO", intent: "cercar e ganhar força em conjunto", weakness: "perde eficiência quando separado", telegraphMs: 340, tier: 0 }),
    bruiser: Object.freeze({ id: "bruiser", role: "RUPTURA PESADA", intent: "empurrar e punir rotas previsíveis", weakness: "fica atordoado quando erra", telegraphMs: 760, tier: 2 }),
    berserker: Object.freeze({ id: "berserker", role: "RISCO CRESCENTE", intent: "acelerar conforme perde vida", weakness: "padrão previsível em fúria", telegraphMs: 420, tier: 1 }),
    sprinter: Object.freeze({ id: "sprinter", role: "INVESTIDOR", intent: "executar sequências curtas de avanço", weakness: "precisa descansar após a sequência", telegraphMs: 360, tier: 1 }),
    bulwark: Object.freeze({ id: "bulwark", role: "PROTETOR", intent: "absorver dano destinado a aliados", weakness: "lento e dependente de formação", telegraphMs: 680, tier: 2 }),
    phantom: Object.freeze({ id: "phantom", role: "EMBOSCADA", intent: "alternar invisibilidade e exposição", weakness: "recebe dano extra ao reaparecer", telegraphMs: 520, tier: 2 })
  });

  function getContract(id) {
    return contracts[id] || null;
  }

  function applyContract(bot) {
    if (!bot || typeof bot !== "object") return bot;
    const contract = getContract(bot.archetype);
    if (!contract) return bot;
    bot.contractRole = contract.role;
    bot.contractIntent = contract.intent;
    bot.contractWeakness = contract.weakness;
    bot.telegraphMs = contract.telegraphMs;
    bot.contractTier = contract.tier;
    return bot;
  }

  function listByTier(maxTier) {
    const tier = Math.max(0, Number(maxTier) || 0);
    return Object.values(contracts).filter((contract) => contract.tier <= tier);
  }

  return Object.freeze({ contracts, getContract, applyContract, listByTier });
});
