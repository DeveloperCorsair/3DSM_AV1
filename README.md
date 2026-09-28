# CineBridge — Microsserviço de Recomendação e Orquestração de Equipes

Implementação da atividade ATVI: microsserviço
que recebe um projeto audiovisual, analisa profissionais cadastrados e monta,
de forma automática, uma equipe recomendada — aplicando conscientemente os
padrões de projeto **Strategy**, **Template Method**, **Observer** e **Visitor**.

## Stack técnica

- **Node.js** (LTS) + **TypeScript em modo estrito** (`strict: true`)
- **Fastify** para a camada HTTP
- Persistência via interface `RepositorioProfissionais`
- Comunicação interna via `EventEmitter` nativo, abstraída atrás da interface
  `Barramento`
- **Vitest** para testes unitários e de integração.

## Estrutura de pastas

```
src/
  domain/          Entidades: Projeto, Profissional, Competencia, Avaliacao,
                    Recomendacao, Convite (a "árvore de dados" visitada)
  strategies/       [Strategy] 3 algoritmos de recomendação + fábrica
  orchestrator/     [Template Method] fluxo fixo de composição de equipe
  observers/        [Observer] notificações (e-mail, mensagens, auditoria)
  visitors/         [Visitor] validação, compatibilidade, relatório
  repository/       Repositório de profissionais + decorator tolerante a falhas
  events/           Barramento de eventos de domínio (in-memory → filas)
  server/           Serviço de aplicação, injeção de dependências, app Fastify
tests/
  unit/             Um arquivo de teste por padrão + serviço + repositório
  integration/       Teste do endpoint REST via app.inject (Fastify)
diagrama-classes.puml   Diagrama de classes (PlantUML) dos 4 padrões
```

## Como rodar

```bash
npm install
npm run build      # compila para dist/
npm start          # sobe o Fastify em http://localhost:3000
# ou, em desenvolvimento com reload:
npm run dev
```

### Endpoint principal

```
POST /projetos/recomendacoes
Content-Type: application/json

{
  "genero": "documentario",
  "duracaoEstimadaMinutos": 90,
  "orcamentoTotal": 60000,
  "dataEntrega": "2027-05-01T00:00:00.000Z",
  "tipoCaptacao": "documentario",
  "localizacao": { "cidade": "Sao Paulo", "estado": "SP", "pais": "Brasil" },
  "papeisRequeridos": [
    { "nome": "diretor", "peso": 1 },
    { "nome": "editor", "peso": 0.5 }
  ],
  "estrategia": "similaridade_cosseno"
}
```

Retorna a equipe recomendada (`itens`), o resultado da validação de
consistência (Visitor) e um relatório com compatibilidade e margem
orçamentária (Visitor).

## Testes e cobertura

```bash
npm test              # roda toda a suíte (29 testes)
npm run test:coverage # roda com relatório de cobertura (v8)
```

## Requisitos não funcionais atendidos

- **Tolerância a falhas**: `RepositorioProfissionaisTolerranteAFalhas`
  decora o repositório real e retorna fallback (lista vazia /
  `undefined`) em vez de propagar exceções.
- **Auditoria**: `ObservadorAuditoria` registra toda ação relevante
  (recomendação gerada, convite atualizado) com timestamp.
- **Baixa acoplagem para escala futura**: comunicação interna via
  `Barramento` (hoje `EventEmitter`, migrável para fila de mensagens
  sem alterar a lógica de negócio).
- **Injeção de dependências explícita**: veja `server/composition-root.ts`
  — único ponto do sistema que conecta implementações concretas às
  abstrações (sem framework de DI).

## Compatibilidade de plataforma

Testado para rodar em Windows 10+ e Linux Ubuntu 24.04+ (e derivados),
por depender apenas do runtime Node.js (LTS) e de pacotes npm
multiplataforma (Fastify, TypeScript, Vitest).
