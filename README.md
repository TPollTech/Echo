# ECHO — arena espectral

ECHO é uma arena em Canvas baseada em projeção espectral. O núcleo físico fica parado e vulnerável enquanto o eco se move; ao materializar, o trajeto vira um ataque.

## Versão atual — 0.6.0

O ECHO 0.6.0 reúne o sistema de classes, o menu de preparação e as melhorias de desempenho para notebooks e celulares. A identidade anterior foi preservada: níveis, bônus, chefes, som, skins, solo e multiplayer continuam integrados.

O patch atual também reduz o atraso percebido no multiplayer local, unifica o visual das skins entre desktop e celular e reorganiza a preparação para usar nomes e descrições diretos.

- dez classes jogáveis com atributos, recurso, ataque primário, especial, passiva, evolução e IA próprios: Cortador, Atirador, Investidor, Armadilheiro, Defensor, Assassino, Controlador, Invocador, Orbitador e Carregador;
- menu único para escolher classe, skin, até quatro habilidades, modo, dificuldade, configurações e progresso antes de jogar;
- `JOGAR` inicia solo ou treino diretamente; multiplayer abre somente o fluxo necessário da sala;
- composição balanceada de classes para bots e controle autoritativo das classes no servidor multiplayer;
- preferências e progresso por classe persistidos no SQLite local, com fallback em `localStorage`;
- HUD próprio de classe, nível, recurso e especial, além de prévia animada no menu;
- treino local sem recompensas, pensado para testar classes e habilidades.
- snapshots multiplayer a 20 Hz, previsão de movimento local, suavização dos outros jogadores, medição real de ping e envio incremental dos fragmentos;
- dez skins procedurais compartilhadas pelo menu, pelo jogo e pelo servidor, sem uma versão visual simplificada para o jogador mobile;
- modo como primeira aba, habilidades com custo/recarga/efeito exatos e progresso dividido entre classes, conquistas e desbloqueios;
- conquistas de classe funcionais, com recompensa única persistida no SQLite local.

- resolução interna adaptativa reage apenas a sobrecarga sustentada e recupera nitidez automaticamente quando há folga;
- fragmentos usam um índice espacial, reduzindo buscas completas durante coleta e decisões da IA;
- entidades fora da câmera deixam de executar efeitos visuais caros;
- gradientes, cicatrizes e camadas estáticas das skills são reutilizados entre frames;
- HUD, minimapa e soundtrack evitam atualizações redundantes;
- abas em segundo plano e telas ociosas deixam de consumir o loop completo;
- interfaces de toque evitam a recomposição cara de `backdrop-filter`, mantendo a mesma leitura visual.

A versão 0.6 adiciona evolução dinâmica dentro da partida e amplia a identidade audiovisual do jogo.

- jogador e inimigos possuem nível e experiência próprios durante cada partida;
- fragmentos ciano, roxo, dourado e vermelho fornecem quantidades diferentes de experiência;
- fragmentos roxos ativam um impulso temporário de experiência e velocidade;
- subir de nível aumenta tamanho, vida, dano e alcance, com pequena redução de mobilidade nos níveis altos;
- bots avaliam perigo, diferença de força, alvos vulneráveis e valor dos fragmentos antes de decidir entre fugir, caçar ou coletar;
- entidades derrotadas devolvem parte de sua evolução como fragmentos;
- chefes aparecem entre aproximadamente 1,6 e 2,05 vezes maiores e ficam mais fortes conforme os níveis presentes na arena;
- o HUD mostra nível e barra de experiência, e entidades recebem identificação visual de nível;
- o multiplayer deriva níveis visuais do placar autoritativo e exibe o nível dos participantes;
- a trilha sonora procedural possui dez temas, alternância sem repetição imediata e músicas para menu, combate, ameaça, chefe, fase final, vitória e derrota;
- o servidor estático publica com segurança os módulos do navegador e valida os arquivos obrigatórios ao iniciar.

A fonte editável continua organizada em módulos dentro de `src/`. O arquivo `game.js` é um bundle gerado e não deve ser editado manualmente.

## Modos

- **Solo:** partida com classes, níveis, crescimento específico, bônus compatíveis, regras extras, tipos de inimigos, dificuldade dinâmica e diferentes chefes.
- **Multiplayer local:** salas para até oito jogadores, classes e efeitos autoritativos, bots com composição balanceada, placar sincronizado e persistência local.
- **Treino:** arena local sem recompensas nem gravação da partida, para experimentar classes, ataques e habilidades.

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

Para reproduzir uma partida específica:

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
- `Q` ativa o especial da classe.
- `1` a `4` ativam as habilidades equipadas.
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

Adicione `?qa` à URL para abrir o painel de diagnóstico. Ele mostra a semente da partida, FPS e eventos internos, além de oferecer atalhos para bônus, chefe, vitória e geração de uma nova semente.

```text
http://localhost:4174/?qa&seed=ECHO-7F42A
```

Atalhos existentes:

- `U`: oferece um bônus.
- `B`: invoca um chefe.
- `V`: abre o estado de vitória solo.

No console do navegador:

- `EchoRunProgression` expõe as configurações de nível;
- `EchoSoundtrack` mostra a biblioteca completa e a faixa atual;
- `EchoMultiplayerLevels` expõe a conversão do score autoritativo em nível visual.
- `__echoDebug.getState().performance` mostra tempo médio de frame, custo do render e DPR adaptativo.

## Arquitetura

- `src/core/`: estado, loop, entrada, câmera, constantes, multiplayer e apresentação de níveis remotos.
- `src/classes/`: registro das dez classes, controladores, efeitos e IA de classe dos bots.
- `src/menu/`: preparação unificada, persistência de preferências e prévia animada.
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
