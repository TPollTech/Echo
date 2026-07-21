# Arquitetura ECHO 0.6.0

A versão 0.6.0 mantém `game.js` como saída gerada da fonte canônica em `src/` e acrescenta dois domínios: classes e preparação. O mesmo contrato de classe alimenta menu, jogador, bots, HUD, multiplayer e persistência.

### `src/classes/`

- `class-definitions.js`: registro imutável das dez classes, habilidades compatíveis, evolução, limites de composição e decisões de IA.
- `class-runtime.js`: controladores dos ataques primários, especiais, passivas e recursos no cliente.
- `class-effects.js`: simulação e renderização de projéteis, armadilhas, campos, unidades e indicadores.
- `bot-class-runtime.js`: aplicação do contrato de classe e execução de IA em bots solo.

### `src/menu/`

- `main-menu.js`: estado persistente de preparação, seis abas, seleção de modo/classe/skin/habilidades, configurações, progresso e prévia animada.

O servidor replica o contrato autoritativo em `server/multiplayer.js`. O transporte usa snapshots a 20 Hz, deltas de fragmentos, limite de fila por conexão e confirmação da sequência de entrada. O cliente faz previsão apenas do próprio movimento e suaviza entidades remotas. O SQLite armazena preferências em `player_preferences`, evolução em `class_progress` e registra classe/dificuldade em cada partida.

## Regra principal

1. O código do jogo é editado em `src/`.
2. `src/build-order.json` preserva a ordem léxica necessária ao runtime atual.
3. `npm run build` gera o `game.js`.
4. `npm run check` confirma que o bundle está sincronizado e que a arquitetura não regrediu.
5. `game.js` não deve receber alterações manuais.

Essa estratégia preserva exatamente o escopo e a ordem do protótipo enquanto permite continuar a extração para módulos totalmente independentes.

## Fonte canônica

### `src/core/`

- `game-state.js`: estado da partida, ciclo de runs e variáveis compartilhadas.
- `game-loop.js`: atualização e frame principal.
- `input.js`: eventos de teclado, ponteiro e controles.
- `camera.js`: câmera, conversões e redimensionamento.
- `constants.js`: constantes e dados globais estáveis.
- `multiplayer.js`: comunicação e snapshots de rede.
- `random.js` e `events.js`: pontes para os módulos fundamentais já existentes.

### `src/entities/`

- `player.js`
- `bot.js`
- `mote.js`
- `effects.js`

### `src/combat/`

- `damage.js`
- `collision.js`
- `trail.js`
- `status-effects.js`

### `src/enemies/`

- `archetypes.js`: atributos-base dos onze inimigos comuns.
- `enemy-ai.js`: loop geral e `enemyBehaviorRegistry`.
- `sniper.js`: disparo e mira do Franco-atirador.
- `bulwark.js`: redirecionamento de dano do Tanque.
- `phantom.js`: ponto de extração reservado para o Espelho.

O loop geral não decide mais comportamento usando uma sequência de `if (bot.archetype === ...)`. Cada arquétipo registra somente as etapas que utiliza, como atualização anterior ao movimento, seleção de alvo, velocidade especial, comportamento posterior ao movimento, alcance e permissão de ruptura.

### `src/bosses/`

- `boss-definitions.js`: dados das nove lutas e suas fases.
- `boss-controller.js`: criação, transição de fase, defesa e conclusão.
- `mechanics/runtime.js`: `bossMechanicRegistry` e helpers de mecânicas.

O loop do jogo chama apenas `runBossMechanic(bot, dt)`. Tremor, Espectro Decisivo, Necróstro, Vórtice, Cicatriz, Mímico, Silenciador e Prisma têm handlers próprios no registro; Coroa Vazia usa o comportamento-base até a revisão 0.6.

### `src/progression/`

- `mutations.js`
- `synergies.js`
- `modifiers.js`
- `skins.js`
- `challenges.js`
- `upgrades.js`

### `src/rendering/`

- `renderer.js`
- `entities.js`
- `player-skins.js`: desenho procedural compartilhado pelo jogador local e pelos participantes remotos, inclusive no perfil mobile.
- `effects.js`
- `telegraphs.js`

`shared/skin-definitions.js` é o registro canônico de nomes, paletas, estilos e condições de desbloqueio usado pelo cliente e pelo servidor.

### `src/audio/`

- `audio-engine.js`
- `music.js`
- `sfx.js`

### `src/ui/`

- `hud.js`
- `menus.js`
- `boss-hud.js`
- `accessibility.js`

## Proteções automáticas

`scripts/check-source-structure.js` impede:

- ausência de domínios ou módulos obrigatórios;
- retorno de arquivos `.part.js` à arquitetura final;
- mais de 70 módulos canônicos;
- módulo principal acima de 650 linhas;
- `bossTemplates` fora de `src/bosses/boss-definitions.js`;
- `botArchetypes` fora de `src/enemies/archetypes.js`;
- remoção dos registros de comportamento;
- retorno de cadeias por arquétipo nos módulos centrais de IA e bosses;
- divergência entre `src/` e `game.js`.

A suíte também inclui `tests/source-structure.test.js`, que repete as garantias no `npm test`.

## Núcleo anterior mantido

Os módulos independentes da Fundação 0.4 e Identidade de Combate 0.5 continuam ativos:

- `core/events.js`
- `core/random.js`
- `core/runtime.js`
- `core/qa-panel.js`
- `combat/enemy-contracts.js`
- `combat/threat-director.js`
- `combat/runtime.js`
- `ui/accessibility.js`

Os hooks de `combat/runtime.js` ainda são transitórios. Agora que a fonte principal está separada, eles poderão ser substituídos por chamadas explícitas durante os incrementos seguintes.

## Eventos ativos

- `runtime:ready`
- `combat:runtime-ready`
- `run:started`
- `run:finished`
- `run:seed-changed`
- `player:registered`
- `player:damaged`
- `enemy:registered`
- `enemy:remapped`
- `enemy:elite`
- `enemy:damaged`
- `enemy:killed`
- `enemy:resting`
- `enemy:exposed`
- `boss:registered`
- `boss:spawned`
- `boss:phase-changed`
- `boss:defeated`
- `mutation:selected`
- `threat:tier-changed`
- `threat:recovery-changed`
- `settings:ui-scale`

## Regra para os próximos incrementos

Cada alteração deve:

1. Modificar a fonte em `src/`.
2. Preservar ou atualizar deliberadamente o comportamento documentado.
3. Executar `npm run build`.
4. Passar em `npm run check` e `npm test`.
5. Manter inimigos e bosses baseados em dados e registros.
6. Evitar dependência direta entre interface, áudio e combate.
