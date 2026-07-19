# ECHO — arena espectral

ECHO é uma arena em Canvas baseada em projeção espectral. O núcleo físico fica parado e vulnerável enquanto o eco se move; ao materializar, o trajeto vira um ataque.

## Versão atual — 0.5.0

A atualização **Identidade de Combate** adiciona uma camada modular sobre a simulação existente:

- contratos de função, intenção, fraqueza e tempo de reação para os onze arquétipos comuns;
- diretor de ameaças que adapta escalada, pressão simultânea, elites e recuperação conforme a run;
- eventos observáveis de run, jogador, inimigos, mutações e bosses;
- comportamentos adicionais para Caçador, Sentinela, Parasita, Corredor, Destruinte, Tanque e Espelho;
- escala de interface configurável entre 90% e 150%;
- seed reproduzível e painel de QA mantidos da Fundação 0.4.

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

```powershell
npm test
npm run check
```

O workflow `ECHO CI` executa validação de sintaxe e testes em pushes e pull requests direcionados ao `main`.

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

- `core/`: seed, eventos, runtime e ferramentas de QA.
- `combat/enemy-contracts.js`: identidade declarativa dos inimigos.
- `combat/threat-director.js`: avaliação de intensidade e composição.
- `combat/runtime.js`: integração não invasiva com a simulação atual.
- `ui/accessibility.js`: escala persistente da interface.
- `shared/`: cálculos compartilhados entre navegador e servidor.
- `server/`: persistência e multiplayer local.

A divisão completa do `game.js` continua incrementalmente para preservar o comportamento já funcional. Consulte `docs/ARCHITECTURE.md` e `docs/HYPERPLAN.md` para o andamento até a versão 1.0.
