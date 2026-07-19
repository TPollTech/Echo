# Arquitetura ECHO 0.4

A versão 0.4 inicia a migração do protótipo monolítico para módulos compatíveis com navegador e Node.js.

## Núcleo criado

- `core/events.js`: barramento de eventos desacoplado.
- `core/random.js`: aleatoriedade reproduzível por seed.
- `core/runtime.js`: inicialização, persistência da seed e API `window.EchoCore`.
- `core/qa-panel.js`: painel visual disponível com `?qa`.

## Contrato global temporário

Enquanto `game.js` é dividido progressivamente, os módulos são expostos por:

```js
window.EchoCore
window.EchoEvents
window.EchoRandom
```

O objetivo é eliminar esse contrato global aos poucos, sem interromper o jogo atual.

## Eventos planejados

- `run:started`
- `run:finished`
- `run:seed-changed`
- `player:damaged`
- `enemy:killed`
- `boss:spawned`
- `boss:phase-changed`
- `boss:defeated`
- `mutation:selected`
- `music:intensity-changed`

## Regra de migração

Cada extração deve:

1. Preservar o comportamento existente.
2. Adicionar testes para o módulo extraído.
3. Passar em `npm run check` e `npm test`.
4. Evitar dependência direta entre interface, áudio e combate.
