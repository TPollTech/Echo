"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "game.js");
const SRC = path.join(ROOT, "src");
const MANIFEST = path.join(SRC, "build-order.json");
const MAX_PART_LINES = 320;

const functionDomains = new Map([
  ["loadSkinProgress", "progression/skins"],
  ["saveSkinProgress", "progression/skins"],
  ["updateSkinProgress", "progression/skins"],
  ["getSelectedSkin", "progression/skins"],
  ["snapshotMutationState", "progression/mutations"],
  ["restoreMutationState", "progression/mutations"],
  ["captureMutationBaseline", "progression/mutations"],
  ["silencePlayer", "combat/status-effects"],
  ["restorePlayerMutations", "combat/status-effects"],
  ["createPlayer", "entities/player"],
  ["createBot", "entities/bot"],
  ["createBoss", "bosses/boss-controller"],
  ["createMote", "entities/mote"],
  ["resetWorld", "core/game-state"],
  ["initAudio", "audio/audio-engine"],
  ["sound", "audio/sfx"],
  ["playCollectSound", "audio/sfx"],
  ["midiToFrequency", "audio/music"],
  ["createMusicNoiseBuffer", "audio/music"],
  ["scheduleMusicTone", "audio/music"],
  ["scheduleMusicNoise", "audio/music"],
  ["scheduleMusicKick", "audio/music"],
  ["scheduleMusicHat", "audio/music"],
  ["musicScheduler", "audio/music"],
  ["startMusic", "audio/music"],
  ["stopMusic", "audio/music"],
  ["updateMusic", "audio/music"],
  ["loadSettings", "ui/accessibility"],
  ["saveSettings", "ui/accessibility"],
  ["setStartStatus", "ui/menus"],
  ["setSelectedMode", "ui/menus"],
  ["requestJson", "core/multiplayer"],
  ["loadProfile", "progression/upgrades"],
  ["loadUpgrades", "progression/upgrades"],
  ["purchaseUpgrade", "progression/upgrades"],
  ["updateWorkshopUI", "progression/upgrades"],
  ["openWorkshop", "ui/menus"],
  ["closeWorkshop", "ui/menus"],
  ["refreshRooms", "core/multiplayer"],
  ["createRoom", "core/multiplayer"],
  ["connectMultiplayer", "core/multiplayer"],
  ["mergeNetworkEntity", "core/multiplayer"],
  ["applyMultiplayerSnapshot", "core/multiplayer"],
  ["startSoloGame", "core/game-state"],
  ["finishSolo", "core/game-state"],
  ["finishMultiplayer", "core/multiplayer"],
  ["saveRun", "core/game-state"],
  ["returnToMenu", "ui/menus"],
  ["showToast", "ui/hud"],
  ["beginPhase", "combat/trail"],
  ["endPhase", "combat/trail"],
  ["arrivalNova", "combat/damage"],
  ["applyBossDefense", "bosses/boss-controller"],
  ["redirectBulwarkDamage", "enemies/bulwark"],
  ["damageAlongPath", "combat/trail"],
  ["damagePlayer", "combat/damage"],
  ["damageBot", "combat/damage"],
  ["killBot", "bosses/boss-controller"],
  ["copyMimicMutations", "bosses/mechanics"],
  ["spawnPrismaIllusions", "bosses/mechanics"],
  ["spawnSilenceAnchor", "bosses/mechanics"],
  ["checkBossPhase", "bosses/boss-controller"],
  ["spawnBossClone", "bosses/mechanics"],
  ["tremorShockwaves", "bosses/mechanics"],
  ["respawnBot", "entities/bot"],
  ["spawnWave", "entities/effects"],
  ["spawnParticle", "entities/effects"],
  ["burst", "entities/effects"],
  ["worldTarget", "core/camera"],
  ["updatePlayer", "entities/player"],
  ["collectMotes", "entities/mote"],
  ["checkMutation", "progression/mutations"],
  ["showMutationChoice", "progression/mutations"],
  ["chooseMutation", "progression/mutations"],
  ["checkSynergies", "progression/synergies"],
  ["updateMutationSlots", "progression/mutations"],
  ["updateBots", "enemies/enemy-ai"],
  ["updateSniper", "enemies/sniper"],
  ["collectBotMotes", "entities/bot"],
  ["beginBotPhase", "enemies/enemy-ai"],
  ["updateBotPhase", "enemies/enemy-ai"],
  ["resolveEntityOverlap", "combat/collision"],
  ["updateEffects", "entities/effects"],
  ["updateCamera", "core/camera"],
  ["updateLeaderboard", "ui/hud"],
  ["updateHud", "ui/hud"],
  ["updateBossBar", "ui/boss-hud"],
  ["update", "core/game-loop"],
  ["toScreen", "rendering/renderer"],
  ["visible", "rendering/renderer"],
  ["drawBackground", "rendering/renderer"],
  ["drawScars", "rendering/effects"],
  ["drawMotes", "rendering/entities"],
  ["drawRibbon", "rendering/effects"],
  ["drawBots", "rendering/entities"],
  ["drawEntity", "rendering/entities"],
  ["drawShell", "rendering/entities"],
  ["drawPlayer", "rendering/entities"],
  ["drawEffects", "rendering/effects"],
  ["drawMinimap", "ui/hud"],
  ["drawCursor", "rendering/telegraphs"],
  ["render", "rendering/renderer"],
  ["frame", "core/game-loop"],
  ["resize", "core/camera"],
  ["openPause", "ui/menus"],
  ["closePause", "ui/menus"]
]);

const variableDomains = new Map([
  ["ui", "ui/hud"],
  ["botArchetypes", "enemies/archetypes"],
  ["skins", "progression/skins"],
  ["mutations", "progression/mutations"],
  ["synergies", "progression/synergies"],
  ["bossTemplates", "bosses/boss-definitions"],
  ["challengePool", "progression/challenges"],
  ["activeChallenges", "progression/challenges"],
  ["runStats", "progression/challenges"],
  ["runModifiers", "progression/modifiers"],
  ["modifierPool", "progression/modifiers"],
  ["pendingModifierChoices", "progression/modifiers"],
  ["UPGRADE_META", "progression/upgrades"],
  ["UPGRADE_COSTS", "progression/upgrades"],
  ["pointer", "core/input"],
  ["camera", "core/camera"],
  ["player", "core/game-state"],
  ["bots", "core/game-state"],
  ["motes", "core/game-state"],
  ["particles", "core/game-state"],
  ["ribbons", "core/game-state"],
  ["waves", "core/game-state"],
  ["scars", "core/game-state"],
  ["ambientSeeds", "core/game-state"]
]);

function isTopLevelStart(line, index) {
  if (index === 0) return true;
  return /^  (?:(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(|(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=|(?:ui|canvas|window|document)\.[\w$]+|if\s*\(|load[A-Za-z_$][\w$]*\(\);|resize\(\);|requestAnimationFrame\(|setSelectedMode\(|generateDailyChallenges\(|\}\)\(\);)/.test(line);
}

function statementName(text) {
  const fn = text.match(/^  (?:async\s+)?function\s+([A-Za-z_$][\w$]*)/m);
  if (fn) return { type: "function", name: fn[1] };
  const variable = text.match(/^  (?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/m);
  if (variable) return { type: "variable", name: variable[1] };
  return { type: "other", name: "bootstrap" };
}

function classify(text) {
  const first = text.split("\n").find((line) => line.trim()) || "";
  const entry = statementName(text);
  if (entry.type === "function" && functionDomains.has(entry.name)) return functionDomains.get(entry.name);
  if (entry.type === "variable" && variableDomains.has(entry.name)) return variableDomains.get(entry.name);
  if (/^(?:  const (?:MOTE_COUNT|BOT_COUNT|MUTATION_THRESHOLDS|SOLO_BOSS_TIME|SETTINGS_KEY|qaMode|isMobile|MOBILE_QUALITY|moteCount|ambientSeedCount|names|colors|sectorNames)|  const (?:SKIN_KEY|SKIN_PROGRESS_KEY|CHALLENGES_KEY))/.test(first)) return "core/constants";
  if (/challenge/i.test(first)) return "progression/challenges";
  if (/modifier/i.test(first)) return "progression/modifiers";
  if (/music|audio|muted|masterVolume/i.test(first)) return "audio/audio-engine";
  if (/multiplayer|room|WebSocket|network/i.test(first)) return "core/multiplayer";
  if (/boss/i.test(first)) return "bosses/boss-controller";
  if (/mutation/i.test(first)) return "progression/mutations";
  if (/skin/i.test(first)) return "progression/skins";
  if (/addEventListener/.test(first) || /^  (?:ui|canvas|window|document)\./.test(first)) return "core/input";
  if (/^  \}\)\(\);/.test(first)) return "main";
  return "core/game-state";
}

function splitUpdateBots(text) {
  const bossStart = text.indexOf("      if (bot.boss && bot.bossTemplate && !bot.bossPhaseTransitioning)");
  const bossEnd = bossStart >= 0 ? text.indexOf("      if (bot.archetype !== \"sprinter\"", bossStart) : -1;
  if (bossStart < 0 || bossEnd < 0) return [{ domain: "enemies/enemy-ai", text }];
  return [
    { domain: "enemies/enemy-ai", text: text.slice(0, bossStart) },
    { domain: "bosses/mechanics", text: text.slice(bossStart, bossEnd) },
    { domain: "enemies/enemy-ai", text: text.slice(bossEnd) }
  ].filter((part) => part.text);
}

function chunkPart(part) {
  const lines = part.text.match(/.*(?:\n|$)/g)?.filter(Boolean) || [];
  if (lines.length <= MAX_PART_LINES) return [part];
  const chunks = [];
  for (let index = 0; index < lines.length; index += MAX_PART_LINES) {
    chunks.push({ domain: part.domain, text: lines.slice(index, index + MAX_PART_LINES).join("") });
  }
  return chunks;
}

function safeName(domain) {
  return domain.split("/").pop().replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function clearGeneratedSource() {
  if (!fs.existsSync(SRC)) return;
  for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
    if (entry.name === "README.md") continue;
    fs.rmSync(path.join(SRC, entry.name), { recursive: true, force: true });
  }
}

function writeReadme(order) {
  const domains = [...new Set(order.map((item) => item.split("/").slice(1, -1).join("/")))];
  fs.writeFileSync(path.join(SRC, "README.md"), `# Fonte modular do ECHO\n\nO arquivo \`game.js\` na raiz é um bundle gerado. O código editável está dividido em fragmentos ordenados por domínio dentro de \`src/\`.\n\nEsta primeira migração é mecânica e preserva o gameplay: os fragmentos são concatenados no mesmo escopo léxico do runtime anterior. Isso permite converter cada domínio para módulos independentes gradualmente, sem uma reescrita arriscada.\n\n## Regras\n\n- Edite os arquivos em \`src/\`, nunca o bundle diretamente.\n- Execute \`npm run build\` após alterações.\n- \`npm run check\` recusa bundle divergente e fragmentos grandes.\n- Ordem de montagem: \`src/build-order.json\`.\n\n## Domínios gerados\n\n${domains.map((domain) => `- \`${domain}\``).join("\n")}\n`);
}

function main() {
  const write = process.argv.includes("--write");
  const force = process.argv.includes("--force");
  if (!write) throw new Error("Use --write para gerar a árvore modular.");
  if (fs.existsSync(MANIFEST) && !force) {
    console.log("A fonte modular já existe. Use --force apenas para refazer a migração a partir do bundle atual.");
    return;
  }

  const source = fs.readFileSync(SOURCE, "utf8").replace(/\r\n/g, "\n");
  const lines = source.match(/.*(?:\n|$)/g)?.filter(Boolean) || [];
  const starts = [];
  lines.forEach((line, index) => { if (isTopLevelStart(line.replace(/\n$/, ""), index)) starts.push(index); });
  if (starts[0] !== 0) starts.unshift(0);
  starts.push(lines.length);

  const rawStatements = [];
  for (let index = 0; index < starts.length - 1; index += 1) {
    const text = lines.slice(starts[index], starts[index + 1]).join("");
    if (!text) continue;
    const entry = statementName(text);
    if (entry.name === "updateBots") rawStatements.push(...splitUpdateBots(text));
    else rawStatements.push({ domain: classify(text), text });
  }

  const parts = rawStatements.flatMap(chunkPart);
  clearGeneratedSource();
  fs.mkdirSync(SRC, { recursive: true });
  const counters = new Map();
  const order = [];
  for (const part of parts) {
    const count = (counters.get(part.domain) || 0) + 1;
    counters.set(part.domain, count);
    const directory = path.join(SRC, part.domain);
    fs.mkdirSync(directory, { recursive: true });
    const relative = path.posix.join("src", part.domain, `${safeName(part.domain)}-${String(count).padStart(2, "0")}.part.js`);
    fs.writeFileSync(path.join(ROOT, relative), part.text);
    order.push(relative);
  }

  fs.writeFileSync(MANIFEST, `${JSON.stringify(order, null, 2)}\n`);
  fs.writeFileSync(path.join(SRC, "main.js"), `"use strict";\n\nconst buildOrder = require("./build-order.json");\nmodule.exports = Object.freeze(buildOrder.slice());\n`);
  writeReadme(order);
  console.log(`Fonte modular gerada: ${order.length} fragmentos, máximo de ${MAX_PART_LINES} linhas por arquivo.`);
}

main();
