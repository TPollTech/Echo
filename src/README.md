# Fonte modular do ECHO

O arquivo `game.js` na raiz é um **bundle gerado**. O código editável do jogo está organizado em módulos canônicos dentro de `src/`.

A versão 0.5.1 preserva o escopo léxico e a ordem do runtime anterior por meio de seções identificadas no `src/build-order.json`. Isso permitiu separar responsabilidades sem alterar deliberadamente o gameplay.

## Fluxo obrigatório

```powershell
npm run build
npm run check
npm test
```

- Edite somente arquivos em `src/`.
- Nunca edite `game.js` manualmente.
- Execute `npm run build` para regenerar o bundle.
- `npm run check` recusa divergência entre fonte e bundle.
- `npm test` inclui testes permanentes da arquitetura.

## Organização

```text
src/
├── main.js
├── build-order.json
├── core/
│   ├── game-state.js
│   ├── game-loop.js
│   ├── input.js
│   ├── camera.js
│   ├── constants.js
│   ├── multiplayer.js
│   ├── random.js
│   └── events.js
├── entities/
│   ├── player.js
│   ├── bot.js
│   ├── mote.js
│   └── effects.js
├── combat/
│   ├── damage.js
│   ├── collision.js
│   ├── trail.js
│   └── status-effects.js
├── enemies/
│   ├── archetypes.js
│   ├── enemy-ai.js
│   ├── sniper.js
│   ├── bulwark.js
│   └── phantom.js
├── bosses/
│   ├── boss-controller.js
│   ├── boss-definitions.js
│   └── mechanics/
├── progression/
│   ├── mutations.js
│   ├── synergies.js
│   ├── modifiers.js
│   ├── skins.js
│   ├── challenges.js
│   └── upgrades.js
├── rendering/
│   ├── renderer.js
│   ├── entities.js
│   ├── effects.js
│   └── telegraphs.js
├── audio/
│   ├── audio-engine.js
│   ├── music.js
│   └── sfx.js
└── ui/
    ├── hud.js
    ├── menus.js
    ├── boss-hud.js
    └── accessibility.js
```

## Registros de comportamento

`src/enemies/enemy-ai.js` contém `enemyBehaviorRegistry`. Cada arquétipo declara apenas as etapas e parâmetros que utiliza; o loop geral faz um único despacho.

`src/bosses/mechanics/runtime.js` contém `bossMechanicRegistry`. O loop principal chama `runBossMechanic(bot, dt)` sem conhecer as mecânicas específicas de cada luta.

## Limites automáticos

A auditoria estrutural exige:

- todos os módulos obrigatórios;
- no máximo 70 módulos canônicos;
- no máximo 650 linhas por módulo principal;
- nenhum arquivo `.part.js`;
- dados de inimigos e bosses nos arquivos corretos;
- presença dos dois registros de comportamento;
- ausência de cadeias `bot.archetype === ...` nos módulos centrais de IA e bosses;
- bundle perfeitamente sincronizado.

As marcações `/*__ECHO_SECTION...__*/` preservam a ordem de montagem e não devem ser removidas até a conversão futura para imports explícitos.
