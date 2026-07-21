# ECHO — arena espectral

ECHO é uma arena em Canvas baseada em projeção espectral. O núcleo físico fica parado e vulnerável enquanto o eco se move; ao materializar, o trajeto vira um ataque.

## Versão atual — 0.6.0

O patch de desempenho da versão 0.6.0 melhora a execução em notebooks e celulares. A identidade visual e a jogabilidade permanecem intactas: nenhum efeito de combate, arquétipo, boss, skill, skin, telegraph ou sistema de progressão foi removido.

- resolução interna adaptativa reage apenas a sobrecarga sustentada e recupera nitidez automaticamente quando há folga;
- fragmentos usam um índice espacial, reduzindo buscas completas durante coleta e decisões da IA;
- entidades fora da câmera deixam de executar efeitos visuais caros;
- gradientes, cicatrizes e camadas estáticas das skills são reutilizados entre frames;
- HUD, minimapa e soundtrack evitam atualizações redundantes;
- abas em segundo plano e telas ociosas deixam de consumir o loop completo;
- interfaces de toque evitam a recomposição cara de `backdrop-filter`, mantendo a mesma leitura visual.

A versão 0.6 adiciona evolução dinâmica dentro da partida e amplia a identidade audiovisual do jogo.

- jogador e bots possuem nível e experiência próprios durante cada run;
- fragmentos ciano, roxo, dourado e vermelho fornecem quantidades diferentes de experiência;
- fragmentos roxos ativam um impulso temporário de experiência e velocidade;
- subir de nível aumenta tamanho, vida, dano e alcance, com pequena redução de mobilidade nos níveis altos;
- bots avaliam perigo, diferença de força, alvos vulneráveis e valor dos fragmentos antes de decidir entre fugir, caçar ou coletar;
- entidades derrotadas devolvem parte de sua evolução como fragmentos;
- bosses aparecem entre aproximadamente 1,6 e 2,05 vezes maiores e escalam conforme os níveis presentes na arena;
- o HUD mostra nível e barra de experiência, e entidades recebem identificação visual de nível;
- o multiplayer deriva níveis visuais do placar autoritativo e exibe o nível dos participantes;
- a soundtrack procedural possui dez temas, alternância sem repetição imediata e estados de menu, combate, ameaça, boss, fase final, vitória e derrota;
- o servidor estático publica com segurança os módulos do navegador e valida os arquivos obrigatórios ao iniciar.

A fonte editável continua organizada em módulos dentro de `src/`. O arquivo `game.js` é um bundle gerado e não deve ser editado manualmente.

## Modos

- **Solo:** run com níveis, crescimento, mutações, modificadores, arquétipos de inimigos, escalada dinâmica e diferentes bosses.
- **Multiplayer local:** salas para até oito jogadores, bots de treino, placar sincronizado, soundtrack e níveis visuais derivados do score do servidor. O crescimento de atributos completo permanece concentrado no modo solo nesta versão.

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

### Erros 404 em `core/*.js`

Inicie o jogo pela raiz do projeto usando `npm start`; não abra o `index.html` diretamente nem execute somente a pasta `server/`. A inicialização agora verifica `game.js`, `core/events.js`, `core/random.js`, `core/runtime.js` e `core/qa-panel.js` antes de abrir a porta.

Caso o bundle esteja ausente ou desatualizado:

```powershell
npm run build
npm start
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

No console do navegador:

- `EchoRunProgression` expõe as configurações de nível;
- `EchoSoundtrack` mostra a biblioteca completa e a faixa atual;
- `EchoMultiplayerLevels` expõe a conversão do score autoritativo em nível visual.
- `__echoDebug.getState().performance` mostra tempo médio de frame, custo do render e DPR adaptativo.

## Arquitetura

- `src/core/`: estado, loop, entrada, câmera, constantes, multiplayer e apresentação de níveis remotos.
- `src/entities/`: jogador, bots, fragmentos e efeitos.
- `src/combat/`: dano, colisão, rastro e efeitos de estado.
- `src/enemies/`: dados dos arquétipos, registro de IA e comportamentos especializados.
- `src/bosses/`: definições, controle de fases e registro de mecânicas.
- `src/progression/`: níveis, crescimento, mutações, sinergias, modificadores, skins, desafios e upgrades.
- `src/rendering/`: renderizador, entidades, efeitos e telegraphs.
- `src/audio/`: engine, soundtrack procedural, estados musicais e efeitos sonoros.
- `src/ui/`: HUD, apresentação de níveis, menus, HUD de boss e acessibilidade.
- `core/` e `combat/` na raiz: módulos auxiliares desacoplados usados pelo runtime.
- `server/`: persistência, servidor estático seguro e multiplayer local.

Consulte `src/README.md`, `docs/ARCHITECTURE.md`, `docs/HYPERPLAN.md` e `docs/VALIDATION.md`.
