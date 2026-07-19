# ECHO — arena espectral

ECHO é uma arena em Canvas baseada em projeção espectral. O núcleo físico fica parado e vulnerável enquanto o eco se move; ao materializar, o trajeto vira um ataque.

## Modos

- **Solo:** run com quatro escolhas de mutação, arquétipos de inimigos, escalada de ameaça e o chefe Coroa Vazia.
- **Multiplayer local:** salas para até oito jogadores, dois bots de treino, placar sincronizado e servidor autoritativo básico.

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

## Controles

- Mova o mouse ou toque a arena para guiar o núcleo.
- Segure clique esquerdo, `Espaço` ou o botão `ECO` para projetar.
- Solte para materializar e romper o rastro.
- `Esc` pausa; no multiplayer, somente a interface pausa e o servidor continua.
- `M` ativa ou desativa o áudio.

## Desenvolvimento

```powershell
npm test
npm run check
```

Com `?qa` na URL, `U` força uma mutação, `B` invoca o chefe e `V` abre o estado de vitória solo.
