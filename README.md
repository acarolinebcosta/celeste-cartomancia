# Celeste Cartomancia

Aplicação editorial da Celeste com frontend React e o primeiro núcleo backend real de catálogo, disponibilidade e pré-reservas. O backend é autoridade para serviço, preço, modalidade, agenda e estado do booking; pagamentos continuam deliberadamente demonstrativos.

> Os textos jurídicos, o domínio de produção, retenção de dados e dados públicos de contato ainda precisam de revisão antes da publicação.

## Stack

### Frontend

- React 19, Vite e TypeScript;
- Wouter, React Hook Form e Zod;
- Vitest + Testing Library;
- services HTTP e mocks atrás das mesmas interfaces.

### Backend

- Node.js 22–26 e TypeScript;
- Fastify 5, Zod e logger estruturado do Fastify/Pino;
- PostgreSQL 17;
- Prisma ORM com migrations versionadas;
- Luxon para conversões explícitas de timezone;
- Vitest com PostgreSQL real nos testes de integração;
- OpenAPI/Swagger em desenvolvimento.

## Requisitos

- Node.js 22 ou superior, abaixo da versão 27;
- pnpm 10.15.1;
- Docker para o PostgreSQL local e testes de integração.

## Configuração local

```bash
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d
pnpm db:migrate:deploy
pnpm db:seed
```

O Compose inicia somente PostgreSQL e cria `celeste` e `celeste_test`. O seed é idempotente: pode ser executado novamente sem duplicar serviços ou regras semanais.

Para iniciar em dois terminais:

```bash
pnpm dev:server
pnpm dev:frontend
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`

`pnpm dev` permanece como atalho para o frontend. O backend inicia isoladamente com `pnpm dev:server`.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL do backend |
| `TEST_DATABASE_URL` | Banco isolado dos testes de integração |
| `PORT` / `API_HOST` | Bind HTTP do Fastify |
| `FRONTEND_ORIGIN` | Origem CORS permitida; produção não usa `*` |
| `BOOKING_HOLD_MINUTES` | Validade de um booking agendado pendente; padrão 15 |
| `BUSINESS_TIMEZONE` | Timezone oficial; `America/Sao_Paulo` |
| `TERMS_VERSION` | Versão do consentimento de Termos |
| `PRIVACY_VERSION` | Versão do consentimento de Privacidade |
| `ENABLE_SWAGGER` | Habilita docs fora de produção |
| `VITE_API_URL` | Base URL da API no cliente |
| `VITE_USE_MOCK_API` | `true` mantém booking/disponibilidade locais; `false` usa a API |
| `VITE_SITE_URL` | Origem pública para metadata do frontend |

Não versionar `.env` nem segredos reais.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` / `pnpm dev:frontend` | Inicia Vite |
| `pnpm dev:server` | Inicia Fastify com reload |
| `pnpm start:server` | Inicia o backend compilado |
| `pnpm build` | Gera frontend e backend |
| `pnpm build:frontend` | Gera a SPA em `dist/` |
| `pnpm build:server` | Compila backend em `dist/backend/` |
| `pnpm check` | TypeScript frontend + backend |
| `pnpm lint` | ESLint de todo o repositório |
| `pnpm test:frontend` | Testes React e de adapters |
| `pnpm test:server:unit` | Testes unitários do domínio/backend |
| `pnpm test:server:integration` | Testes REST com PostgreSQL real |
| `pnpm coverage:server` | Coverage backend e thresholds |
| `pnpm prisma:generate` | Gera Prisma Client |
| `pnpm db:migrate` | Cria/aplica migration em desenvolvimento |
| `pnpm db:migrate:deploy` | Aplica migrations já versionadas |
| `pnpm db:seed` | Executa catálogo e agenda iniciais |

Para testes de integração locais:

```bash
TEST_DATABASE_URL="postgresql://celeste:celeste@localhost:5432/celeste_test?schema=public" pnpm test:server:integration
```

## Arquitetura

```text
client/src/
├── components/          UI compartilhada
├── data/                conteúdo editorial local
├── features/booking/    estado, passos e validação frontend
├── lib/apiClient.ts     transporte HTTP, timeout e erros
├── services/            interfaces + implementações Mock/API
└── types/               contratos consumidos pela UI

server/
├── app.ts               composição Fastify e dependências
├── server.ts            processo HTTP
├── config/              ambiente validado
├── db/                  Prisma Client
├── domain/              tempo, código público, hash e DTOs
├── errors/              erros de domínio consistentes
├── middleware/          tratamento seguro de erros
├── repositories/        acesso PostgreSQL e transações
├── routes/              transporte REST/OpenAPI
├── schemas/             validação Zod e schemas OpenAPI
├── services/            casos de uso e regras de negócio
└── tests/               unitários e integração real

prisma/
├── migrations/          histórico SQL reproduzível
├── schema.prisma        modelo relacional
└── seed.ts              catálogo e agenda iniciais
```

O fluxo backend é:

```text
route → schema Zod → service/use case → repository → PostgreSQL
```

Rotas não contêm regra de negócio, componentes React não chamam `fetch` diretamente e a UI não conhece Prisma.

## Catálogo e fulfillment

O banco é autoridade para preço, duração, modalidade, fulfillment e ativação. Dinheiro é persistido e transportado em centavos (`priceCents`), nunca como float.

| Serviço | Fulfillment | Duração | Preço | Modalidades |
| --- | --- | ---: | ---: | --- |
| Pergunta Direta | `ASYNC` | — | 4900 | `MESSAGE` |
| Entre Caminhos | `SCHEDULED` | 30 min | 12900 | `VOICE`, `VIDEO` |
| Amor & Relações | `SCHEDULED` | 30 min | 12900 | `VOICE`, `VIDEO` |
| Panorama do Ciclo | `SCHEDULED` | 30 min | 12900 | `VOICE`, `VIDEO` |
| Leitura Profunda | `SCHEDULED` | 60 min | 17900 | `VOICE`, `VIDEO` |

`ASYNC` exige pergunta e não aceita data/horário. `SCHEDULED` exige modalidade, data e horário válidos e não aceita `question`. O PostgreSQL também possui checks para esses invariantes.

## Disponibilidade e timezone

A configuração inicial de desenvolvimento atende terça a sábado, 09:00–18:00, com buffer de 15 minutos. O modelo suporta:

- regras por dia da semana;
- janelas de início/fim e buffer;
- bloqueios por período;
- datas integralmente bloqueadas;
- exceções com janelas substitutas.

Todos os dias/horários recebidos são interpretados explicitamente em `America/Sao_Paulo`. Instantes de booking são convertidos e persistidos em UTC (`timestamptz`). A geração de slots nunca depende do timezone da máquina ou do navegador.

O frontend e seus dados exibidos não são fonte de verdade. O slot é recalculado no servidor no momento da criação.

## Lifecycle do booking

Novos bookings sempre começam assim:

```text
status = PENDING_PAYMENT
paymentStatus = AWAITING_PAYMENT
```

Bookings agendados recebem `expiresAt` de 15 minutos por padrão. Enquanto o hold está válido, o intervalo bloqueia a agenda. Se vencer, a consulta de disponibilidade o marca `EXPIRED` e libera o período; não há cron nesta fase. Bookings assíncronos não reservam slot e não recebem `expiresAt`.

`CONFIRMED` e `APPROVED` existem no modelo para evolução, mas nunca são produzidos por esta fase.

## Proteção contra double-booking

A reserva não usa um `SELECT` desprotegido. Dentro de uma única transação PostgreSQL, o repositório:

1. adquire advisory lock transacional da chave de idempotência;
2. resolve replay ou conflito da chave;
3. para bookings agendados, adquire advisory lock transacional por dia da agenda;
4. expira holds vencidos;
5. verifica sobreposição considerando duração e buffer;
6. insere o booking ainda sob o lock.

Serializar por dia protege também sobreposições entre leituras de 30 e 60 minutos, não apenas igualdade de `scheduledStart`. Índices dão suporte às buscas e uma constraint única protege a chave idempotente.

O teste CT09 envia duas requisições simultâneas ao mesmo slot: uma recebe `201`, a outra `409 SLOT_UNAVAILABLE`, e apenas um booking ativo existe.

## Idempotência

`POST /api/bookings` exige `Idempotency-Key` de 8–128 caracteres. O servidor persiste a chave e um SHA-256 de representação estável do payload.

- mesma chave + mesmo payload: devolve o booking original (`200`, `idempotency-replayed: true`);
- mesma chave + payload diferente: `409 IDEMPOTENCY_CONFLICT`;
- requisições simultâneas: advisory lock + índice único impedem duplicação.

O hash detecta divergência; não é usado como mecanismo de autenticação.

## API REST

### `GET /api/health`

Verifica processo e conexão com banco sem expor detalhes sensíveis.

### `GET /api/services`

Retorna apenas serviços ativos. Expõe `priceCents`, fulfillment, duração e modalidades em formato compatível com adapters frontend.

### `GET /api/availability`

Parâmetros obrigatórios: `serviceSlug`, `modality`, `from`, `to`. O range inclusivo é limitado a 60 dias. Serviços async retornam `INVALID_FULFILLMENT` e nunca geram horários fictícios.

```json
{
  "timezone": "America/Sao_Paulo",
  "fulfillmentType": "SCHEDULED",
  "dates": [{ "date": "2026-10-02", "slots": [{ "startTime": "09:00", "available": true }] }]
}
```

### `POST /api/bookings`

Valida novamente serviço, ativação, modalidade, fulfillment, cliente, consentimento e disponibilidade. O payload não aceita preço, status nem ID. O preço vigente é copiado do serviço no banco para preservar histórico.

O servidor gera `publicCode` com `crypto.randomBytes`; IDs UUID internos não são retornados.

### `GET /api/bookings/:publicCode`

Retorna projeção mínima: código público, serviço, estados, fulfillment, modalidade, agenda, timezone, preço, hold e criação. Não retorna ID interno, nome, e-mail, WhatsApp, pergunta ou contexto.

### Erros

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "Esse horário não está mais disponível."
  }
}
```

Códigos de domínio: `VALIDATION_ERROR`, `SERVICE_NOT_FOUND`, `SERVICE_INACTIVE`, `INVALID_MODALITY`, `INVALID_FULFILLMENT`, `SLOT_UNAVAILABLE`, `BOOKING_NOT_FOUND`, `IDEMPOTENCY_CONFLICT` e `INTERNAL_ERROR`.

## Frontend: API e modo mock

`client/src/lib/apiClient.ts` centraliza base URL, JSON, timeout, headers, request ID e mapeamento de erros. `ApiAvailabilityService` e `ApiBookingService` implementam as interfaces existentes; componentes não usam `fetch`.

- `VITE_USE_MOCK_API=true`: navegação visual sem backend;
- `VITE_USE_MOCK_API=false`: disponibilidade e bookings reais;
- `PaymentService`: permanece sempre mock nesta fase.

Se um slot for perdido entre seleção e criação, a UI apresenta “Esse horário acabou de ficar indisponível. Escolha outro horário para continuar.”, limpa o horário e recarrega a agenda.

## Segurança e dados pessoais

- Helmet e headers seguros;
- CORS restrito por `FRONTEND_ORIGIN`;
- body máximo de 32 KiB;
- rate limit global e limite específico de criação;
- schemas Fastify + Zod com rejeição de campos extras;
- request/correlation ID devolvido em `x-request-id`;
- logs estruturados de rota/status/duração pelo Fastify;
- logs de booking limitados a código público, serviço e status;
- redaction de customer, pergunta, contexto, cookie e autorização;
- stack traces não são retornadas ao cliente;
- segredos somente por ambiente.

Nome, e-mail, WhatsApp, pergunta e contexto são dados pessoais. Esta fase minimiza a projeção pública, versiona consentimento e registra `termsAcceptedAt`. Retenção, exclusão e anonimização são decisões pendentes. Não há tabela, coleta ou armazenamento de cartão/CVV.

## Analytics

Analytics continua centralizado em `track()` e condicionado a consentimento. O backend booking core não emite eventos de marketing.

**PURCHASE MUST ONLY BE FIRED AFTER VERIFIED BACKEND PAYMENT CONFIRMATION.** Nem o mock visual aprovado, nem a criação `PENDING_PAYMENT`, nem qualquer endpoint desta fase emite `purchase`.

## Testes e coverage

Os testes frontend cobrem estado, validação, analytics, mocks, cliente HTTP e adapters. Os testes backend cobrem catálogo, modalidade, fulfillment, preço, código público, timezone, slots, duração, buffer, bloqueios, consentimento, expiração, idempotência e projeção pública.

A suíte de integração usa PostgreSQL real e cobre a matriz CT01–CT18, incluindo concorrência. Prisma não é mockado nos riscos críticos.

Thresholds backend:

- linhas e statements: 80%;
- funções: 80%;
- branches: 70%.

## CI

`.github/workflows/frontend-ci.yml` executa em pull requests e pushes na `main`:

- frontend: install congelado, TypeScript, lint, testes e build;
- backend: PostgreSQL 17, Prisma generate, migrations, TypeScript, lint, unitários, integração, coverage e build.

Não há secrets nem deploy automático.

## Deploy

O frontend Vite mantém o rewrite SPA da Vercel. API e PostgreSQL precisam ser publicados em infraestrutura Node/PostgreSQL separada; configurar `VITE_API_URL`, `FRONTEND_ORIGIN` e `DATABASE_URL` por ambiente. Executar `pnpm db:migrate:deploy` antes de iniciar a versão backend.

Swagger só é montado quando `ENABLE_SWAGGER=true` e `NODE_ENV` não é `production`.

## Payment Integration — Next Phase

Ainda não implementado:

- Mercado Pago, Pix e cartão reais;
- `POST /api/checkout`;
- `GET /api/payments/:id`;
- webhook autenticado e idempotente;
- transições verificadas para `APPROVED`/`CONFIRMED`;
- autorização server-side do evento `purchase`;
- política definitiva de expiração/cancelamento após pagamento;
- e-mail, WhatsApp, autenticação e administração.

A próxima fase deve criar o pagamento referenciando um booking existente, validar webhooks diretamente com o provedor e confirmar booking apenas após pagamento verificado. O backend também deverá resolver conflitos entre hold expirado e pagamento tardio antes de habilitar cobrança real.

## Fora de escopo

- Mercado Pago e webhook;
- cobrança Pix/cartão;
- e-mail e WhatsApp API;
- autenticação ou painel admin;
- CRUD administrativo e relatórios;
- cupons/descontos;
- SSR ou CMS.
