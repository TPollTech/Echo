# Fonte modular do ECHO

O arquivo `game.js` na raiz é um bundle gerado. O código editável está dividido em fragmentos ordenados por domínio dentro de `src/`.

Esta primeira migração é mecânica e preserva o gameplay: os fragmentos são concatenados no mesmo escopo léxico do runtime anterior. Isso permite converter cada domínio para módulos independentes gradualmente, sem uma reescrita arriscada.

## Regras

- Edite os arquivos em `src/`, nunca o bundle diretamente.
- Execute `npm run build` após alterações.
- `npm run check` recusa bundle divergente e fragmentos grandes.
- Ordem de montagem: `src/build-order.json`.

## Domínios gerados

- `core/game-state`
- `ui/hud`
- `core/constants`
- `enemies/archetypes`
- `progression/skins`
- `progression/mutations`
- `progression/synergies`
- `bosses/boss-definitions`
- `audio/audio-engine`
- `bosses/boss-controller`
- `core/multiplayer`
- `progression/challenges`
- `progression/modifiers`
- `core/input`
- `core/camera`
- `combat/status-effects`
- `entities/player`
- `entities/bot`
- `entities/mote`
- `audio/sfx`
- `audio/music`
- `ui/accessibility`
- `ui/menus`
- `progression/upgrades`
- `combat/trail`
- `combat/damage`
- `enemies/bulwark`
- `bosses/mechanics`
- `entities/effects`
- `enemies/enemy-ai`
- `enemies/sniper`
- `combat/collision`
- `core/game-loop`
- `rendering/renderer`
- `rendering/effects`
- `rendering/entities`
- `rendering/telegraphs`
