# Arquitetura ECHO 0.5

A versão 0.5 continua a migração do protótipo monolítico para módulos compatíveis com navegador e Node.js, preservando o `game.js` funcional enquanto novas responsabilidades são extraídas.

## Núcleo 0.4 mantido

- `core/events.js`: barramento de eventos desacoplado.
- `core/random.js`: aleatoriedade reproduzível por seed.
- `core/runtime.js`: inicialização, persistência da seed, carregamento dos módulos e API `window.EchoCore`.
- `core/qa-panel.js`: painel visual disponível com `?qa`.

## Camada de combate 0.5

### `combat/enemy-contracts.js`

Declara a identidade dos onze arquétipos comuns:

- função tática;
- intenção de comportamento;
- fraqueza;
- tempo mínimo de comunicação visual;
- nível de ameaça necessário para aparecer naturalmente.

Esses contratos não dependem da renderização ou da interface.

### `combat/threat-director.js`

Avalia a pressão da run usando:

- tempo;
- estágio estimado;
- pontuação;
- eliminações;
- integridade do jogador;
- presença de boss.

O resultado controla escala de vida, dano, velocidade, recarga, chance de elite, demora de respawn e quantidade máxima de atacantes simultâneos. Quando a integridade fica crítica, o diretor ativa um modo curto de recuperação sem entregar a vitória.

### `combat/runtime.js`

Integra os módulos ao jogo atual sem duplicar o loop principal. Ele:

- registra bots criados por `Array.from`, `push` e ciclos de respawn;
- captura a referência do jogador através do módulo compartilhado de movimento;
- aplica contratos e níveis de ameaça;
- limita ataques simultâneos;
- adiciona estados de guarda, fuga, descanso, exposição e atordoamento;
- observa dano, eliminações, mutações, fases de boss e início/fim de run;
- publica esses acontecimentos no barramento de eventos.

Essa integração é transitória. Conforme o `game.js` for dividido, os hooks serão substituídos por chamadas explícitas aos módulos.

### `ui/accessibility.js`

Adiciona escala persistente de interface entre 90% e 150% na tela de pausa e emite `settings:ui-scale`.

## Contrato global temporário

Enquanto a migração acontece, os módulos ficam disponíveis em:

```js
window.EchoCore
window.EchoEvents
window.EchoRandom
window.EchoEnemyContracts
window.EchoThreatDirector
window.EchoCombatRuntime
window.EchoAccessibility
```

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

## Regra de migração

Cada extração deve:

1. Preservar o comportamento existente.
2. Adicionar testes para o módulo extraído.
3. Passar em `npm run check` e `npm test`.
4. Evitar dependência direta entre interface, áudio e combate.
5. Manter o gameplay utilizável durante toda a transição.
