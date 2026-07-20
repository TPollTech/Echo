# ECHO 1.0 — Hiperplano executável

## Estado

- [x] Fundação 0.4 integrada
- [x] Seed reproduzível
- [x] Barramento de eventos
- [x] Painel de QA
- [x] Testes do núcleo
- [x] CI permanente
- [x] Integração do núcleo ao carregamento
- [x] Incremento 1 — separação completa da fonte do `game.js`
- [x] Bundle `game.js` gerado e validado automaticamente
- [x] Limite de tamanho para módulos principais
- [x] Inimigos despachados por registro de comportamento
- [x] Bosses despachados por registro de mecânicas
- [x] Eventos principais de gameplay conectados ao barramento
- [x] Escala configurável da interface
- [x] Diretor de ameaças
- [x] Contratos dos onze inimigos comuns
- [x] Limite adaptativo de ataques simultâneos
- [x] Modo de recuperação em integridade crítica
- [x] Estados adicionais de guarda, fuga, descanso, exposição e atordoamento
- [ ] Telegraphs visuais completos para todos os inimigos
- [ ] Revisão individual dos bosses
- [ ] Recompensas exclusivas de boss
- [ ] Códice e progressão horizontal
- [ ] Arenas e eventos
- [ ] Cooperativo
- [ ] Otimização espacial
- [ ] Balanceamento por simulação
- [ ] Preparação da versão 1.0

## Incremento 1 — Fonte modular — concluído na 0.5.1

Entregas:

- fonte canônica organizada em `src/core`, `src/entities`, `src/combat`, `src/enemies`, `src/bosses`, `src/progression`, `src/rendering`, `src/audio` e `src/ui`;
- `game.js` transformado em bundle gerado por `npm run build`;
- ordem do runtime preservada por `src/build-order.json`;
- gameplay e valores existentes preservados durante a migração;
- `enemyBehaviorRegistry` centralizando decisões dos inimigos;
- `bossMechanicRegistry` centralizando mecânicas específicas dos bosses;
- definições de inimigos e bosses isoladas em arquivos de dados;
- auditoria de módulos obrigatórios, tamanho, registros e sincronização do bundle;
- testes permanentes da arquitetura;
- `npm run check` e `npm test` executados no workflow antes da publicação do bundle.

## Versões

### 0.4 — Fundação — concluída

Arquitetura inicial, seeds, eventos, QA, CI e documentação.

### 0.5 — Identidade de combate — concluída

- contratos declarativos para os onze inimigos comuns;
- diretor adaptativo com cinco níveis de ameaça;
- controle de atacantes simultâneos;
- modo de recuperação;
- inimigos avançados bloqueados no começo da run;
- chance progressiva de elites;
- eventos observáveis de combate;
- escala de interface entre 90% e 150%.

### 0.5.1 — Fonte modular — concluída

Executa o Incremento 1 sem alterar deliberadamente o gameplay. Toda evolução seguinte deve partir de `src/`, nunca do bundle gerado.

### 0.6 — Bosses — próxima etapa

- revisar individualmente as nove lutas;
- padronizar preparação, aviso, impacto e recuperação;
- criar contra-ataques claros para cada mecânica;
- completar transições de fase;
- adicionar recompensas próprias;
- criar testes específicos por boss.

### 0.7 — Progressão

Mutações, sinergias, códice, oficina horizontal e dificuldades.

### 0.8 — Mundo e áudio

Arenas, eventos, música por estados e acessibilidade completa.

### 0.9 — Rede e desempenho

Cooperativo, reconexão, spatial hash, pooling e qualidade adaptativa.

### 1.0 — Lançamento

Tutorial, balanceamento, empacotamento e documentação final.

## Próximas três prioridades

1. Criar um contrato comum de telegraph para ataques e fases de boss.
2. Revisar Coroa Vazia, Espectro Decisivo e Tremor Deep como primeiro pacote do 0.6.
3. Substituir gradualmente os hooks transitórios de `combat/runtime.js` por chamadas explícitas na fonte modular.
