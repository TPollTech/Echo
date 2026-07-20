# ECHO — arena espectral

ECHO é uma arena em Canvas baseada em projeção espectral. O núcleo físico fica parado e vulnerável enquanto o eco se move; ao materializar, o trajeto vira um ataque.

## Versão atual — 0.5.1

Esta versão conclui o **Incremento 1 — Separar o `game.js`**, preservando o gameplay da versão 0.5.0.

- o código editável foi movido para módulos canônicos dentro de `src/`;
- `game.js` agora é um bundle gerado e não deve ser editado manualmente;
- estado, entidades, combate, inimigos, bosses, progressão, renderização, áudio e interface têm arquivos próprios;
- inimigos usam `enemyBehaviorRegistry` em vez de cadeias de decisões espalhadas;
- bosses usam `bossMechanicRegistry` para despachar suas mecânicas;
- `npm run check` recusa bundle divergente, módulos ausentes, arquivos exagerados e regressões para cadeias por arquétipo;
- a identidade de combate, o diretor de ameaças, a escala da interface, as seeds e o painel de QA continuam ativos.

## Modos

- **Solo:** run com mutações, modificadores, arquétipos de inimigos, escalada dinâmica e diferentes bosses.
- **Multiplayer local:** salas para até oito jogadores, bots de treino, placar sincronizado e servidor autoritativo básico.

## Executar

Requer Node.js 24.15 ou superior.

```powershell
npm install
npm start
```

Abra `http://localhost:4174`. Outros dispositivos na mesma rede podem usar o endereço de LAN mostrado pelo servidor.

O servidor salva perfis e resultados em `data/echo.sqlite`. Salas ativas ficam em memória e os resultados são persistidos quando a partida termina ou o jogador sai.

Se a porta estiver ocupada:

```powershell
$env:PORT=4180
npm start
```

Para reproduzir uma run específica:

```text
http://localhost:4174/?seed=ECHO-7F42A
```

## Controles

- Mova o mouse ou toque a arena para guiar o núcleo.
- Segure clique esquerdo, `Espaço` ou o botão `ECO` para projetar.
- Solte para materializar e romper o rastro.
- `Esc` pausa; no multiplayer, somente a interface pausa e o servidor continua.
- `M` ativa ou desativa o áudio.

Na tela de pausa é possível ajustar volume, tremor, flashes e escala da interface.

## Desenvolvimento

O fluxo correto é editar a fonte modular, gerar o bundle e validar:

```powershell
npm run build
npm run check
npm test
```

`npm run build` monta `game.js` seguindo `src/build-order.json`. O `check` confirma que o bundle está sincronizado e valida a arquitetura antes das checagens de sintaxe.

O workflow `ECHO CI` executa `npm run check` e `npm test` em pushes e pull requests direcionados ao `main`.

## QA

Adicione `?qa` à URL para abrir o painel de diagnóstico. Ele mostra seed, FPS e eventos do runtime, além de oferecer atalhos para mutação, boss, vitória e geração de nova seed.

```text
http://localhost:4174/?qa&seed=ECHO-7F42A
```

Atalhos existentes:

- `U`: força uma mutação.
- `B`: invoca um boss.
- `V`: abre o estado de vitória solo.

## Arquitetura

- `src/core/`: estado, loop, entrada, câmera, constantes e multiplayer.
- `src/entities/`: jogador, bots, fragmentos e efeitos.
- `src/combat/`: dano, colisão, rastro e efeitos de estado.
- `src/enemies/`: dados dos arquétipos, registro de IA e comportamentos especializados.
- `src/bosses/`: definições, controle de fases e registro de mecânicas.
- `src/progression/`: mutações, sinergias, modificadores, skins, desafios e upgrades.
- `src/rendering/`: renderizador, entidades, efeitos e telegraphs.
- `src/audio/`: engine, música e efeitos sonoros.
- `src/ui/`: HUD, menus, HUD de boss e acessibilidade.
- `core/` e `combat/` na raiz: módulos auxiliares já desacoplados usados pelo runtime 0.4/0.5.
- `server/`: persistência e multiplayer local.

Consulte `src/README.md`, `docs/ARCHITECTURE.md` e `docs/HYPERPLAN.md`.
