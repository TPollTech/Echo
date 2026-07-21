# ECHO 1.0 — Hiperplano executável

## Estado

- [x] Fundação 0.4 integrada
- [x] Seed reproduzível
- [x] Barramento de eventos
- [x] Painel de QA
- [x] Testes do núcleo
- [x] CI permanente
- [x] Integração do núcleo ao carregamento
- [x] Separação completa da fonte do `game.js`
- [x] Bundle `game.js` gerado e validado automaticamente
- [x] Limite de tamanho para módulos principais
- [x] Inimigos despachados por registro de comportamento
- [x] Bosses despachados por registro de mecânicas
- [x] Diretor de ameaças e contratos dos onze inimigos comuns
- [x] Níveis e experiência durante a run
- [x] Crescimento visual e aumento real de atributos
- [x] Progressão compartilhada entre jogador e bots
- [x] IA de coleta, fuga e caça baseada em risco
- [x] Drops de experiência após derrotas
- [x] Bosses ampliados e escalados pelo nível da arena
- [x] HUD e identificação visual de nível
- [x] Soundtrack procedural com sete temas e rotação dinâmica
- [x] Correção e teste HTTP dos módulos `core/*.js`
- [ ] Telegraphs visuais completos para todos os inimigos
- [ ] Revisão mecânica individual das nove lutas de boss
- [ ] Códice e progressão horizontal permanente
- [ ] Arenas e eventos
- [ ] Cooperativo com progressão sincronizada
- [ ] Otimização espacial
- [ ] Balanceamento por simulação
- [ ] Preparação da versão 1.0

## 0.5.1 — Fonte modular — concluída

Entregas:

- fonte canônica organizada em `src/core`, `src/entities`, `src/combat`, `src/enemies`, `src/bosses`, `src/progression`, `src/rendering`, `src/audio` e `src/ui`;
- `game.js` transformado em bundle gerado por `npm run build`;
- ordem do runtime preservada por `src/build-order.json`;
- `enemyBehaviorRegistry` e `bossMechanicRegistry`;
- auditoria de módulos, tamanho e sincronização do bundle;
- testes permanentes da arquitetura.

## 0.6.0 — Evolução da arena — concluída

### Progressão da run

- nível máximo 25 com curva progressiva de experiência;
- fragmentos ciano, roxo, dourado e vermelho com valores próprios;
- impulso temporário ao consumir fragmentos roxos;
- crescimento de raio limitado para não ocupar a arena inteira;
- aumento de vida, dano e alcance;
- redução leve e limitada de mobilidade em níveis altos;
- eventos observáveis de ganho de experiência e subida de nível.

### Bots

- utilizam o mesmo contrato de experiência e nível do jogador;
- coletam fragmentos e crescem visualmente;
- avaliam distância, valor do fragmento, vida atual e presença de ameaças;
- fogem de entidades significativamente mais fortes;
- caçam entidades vulneráveis quando possuem vantagem;
- continuam usando os comportamentos próprios de cada arquétipo;
- berserkers e swarmers respeitam os multiplicadores de nível.

### Derrotas e recompensas

- parte da experiência acumulada retorna à arena em fragmentos;
- entidades de nível maior derrubam mais recursos;
- eliminações concedem experiência direta ao responsável;
- bosses e fragmentos de boss possuem tratamento próprio para evitar duplicação infinita.

### Bosses

- escala visual individual entre aproximadamente 1,6x e 2,05x;
- Tremor Deep possui a maior escala base;
- vida e dano consideram estágio, nível médio e maior nível vivo;
- fases preservam a proporção visual do boss;
- hitboxes continuam baseadas no mesmo raio renderizado.

### Soundtrack

Sete temas procedurais:

1. Signal Drift;
2. Glass Current;
3. Violet Engine;
4. Fracture Run;
5. Crownfall;
6. Deep Quake;
7. Terminal Light.

A rotação evita repetição imediata, reage ao estágio da run, troca para temas de boss e utiliza uma variação final nas últimas fases.

### Interface e diagnóstico

- barra de experiência e nível no HUD;
- indicação `LV` sobre jogador e bots;
- nível no placar;
- APIs de diagnóstico `EchoRunProgression` e `EchoSoundtrack`;
- eventos de progressão e mudança de faixa disponíveis no barramento.

### Servidor e validação

- servidor estático seguro por diretórios permitidos;
- validação dos arquivos obrigatórios antes de abrir a porta;
- teste HTTP real para `core/events.js`, `core/random.js`, `core/runtime.js` e `core/qa-panel.js`;
- teste que impede módulos de serem montados fora do fechamento do runtime;
- `npm run build`, `npm run check` e `npm test` obrigatórios antes da publicação do bundle.

## Próximas versões

### 0.6.1 — Revisão completa dos bosses

- padronizar preparação, aviso, impacto e recuperação;
- revisar individualmente as nove lutas;
- criar contra-ataques claros;
- completar transições de fase;
- ampliar os testes comportamentais de cada boss.

### 0.7 — Progressão horizontal

Códice, oficina permanente, dificuldades e novas combinações de mutações e sinergias.

### 0.8 — Mundo e áudio

Arenas, eventos, novas variações musicais, identidade sonora por arena e acessibilidade completa.

### 0.9 — Rede e desempenho

Cooperativo, progressão sincronizada, reconexão, spatial hash, pooling e qualidade adaptativa.

### 1.0 — Lançamento

Tutorial, balanceamento por simulação, empacotamento, playtests extensivos e documentação final.

## Próximas três prioridades

1. Realizar playtest manual completo da 0.6 em desktop e celular.
2. Revisar Coroa Vazia, Espectro Decisivo e Tremor Deep como primeiro pacote da 0.6.1.
3. Substituir gradualmente os hooks transitórios de `combat/runtime.js` por chamadas explícitas na fonte modular.
