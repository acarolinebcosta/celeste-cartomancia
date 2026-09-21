# Celeste Cartomancia

Frontend editorial da Celeste para apresentação das leituras e demonstração dos fluxos de atendimento. Esta fase mantém o produto deliberadamente frontend-only e prepara contratos estáveis para a integração futura com backend, disponibilidade real e pagamentos.

> O conteúdo jurídico, o domínio de produção e os dados públicos de contato ainda precisam ser definidos e revisados antes da publicação.

## Visão geral

A aplicação contempla:

- catálogo tipado de leituras;
- detalhes derivados do domínio, sem regras baseadas em texto de apresentação;
- fluxo agendado para atendimentos ao vivo;
- fluxo assíncrono para Pergunta Direta;
- validação com React Hook Form e Zod;
- disponibilidade, booking e checkout demonstrativos atrás de interfaces de serviço;
- consentimento de analytics e atribuição por UTM;
- confirmação mock persistida durante a sessão;
- páginas de Termos, Privacidade, 404 e placeholder administrativo.

Não há API, banco de dados, autenticação, processamento de pagamento, e-mail ou integração externa nesta branch.

## Stack

- React 19
- TypeScript 5
- Vite 7
- Wouter
- React Hook Form
- Zod
- Vitest + Testing Library
- ESLint flat config
- CSS autoral responsivo
- pnpm

## Requisitos

- Node.js 22 ou superior, abaixo da versão 27
- pnpm 10.15.1

## Como rodar

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

`VITE_SITE_URL` define a origem usada por canonical, Open Graph e metadata por rota. Em desenvolvimento, a aplicação usa `window.location.origin` quando a variável não existe.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `pnpm dev` | Inicia somente o Vite |
| `pnpm build` | Gera o frontend de produção em `dist/` |
| `pnpm preview` | Serve localmente o build de produção |
| `pnpm check` | Executa TypeScript sem emitir arquivos |
| `pnpm lint` | Executa ESLint |
| `pnpm test` | Executa a suíte Vitest uma vez |

## Arquitetura

```text
client/
├── public/                 # marca, robots e sitemap
└── src/
    ├── components/         # estrutura compartilhada, marca, consentimento e efeitos de rota
    ├── config/             # configuração central de assets
    ├── data/               # catálogo e conteúdo editorial
    ├── features/booking/   # regras de transição, steps e schemas
    ├── lib/                # adaptador central de analytics
    ├── mocks/              # dados demonstrativos de disponibilidade
    ├── pages/              # rotas da SPA
    ├── services/           # contratos e implementações mock
    ├── test/               # setup de testes DOM
    ├── types/              # tipos do domínio
    └── utils/              # formatação derivada
docs/                       # registro da linha de base
.github/workflows/          # CI frontend
```

Conteúdo, regras, mocks e integrações possuem responsabilidades separadas. Componentes não conhecem detalhes de banco, transporte HTTP ou provedor de pagamento.

## Modelo de leituras

`Reading` usa `fulfillmentType`, `durationMinutes` e `availableModalities` como fontes de verdade. Preço é mantido somente como número e formatado por `formatBRL`/`formatPriceFrom`.

Regras atuais:

- Pergunta Direta é `async`, usa `message` e não consulta disponibilidade.
- Leituras de 30 e 60 minutos são `scheduled`.
- Modalidades de leituras agendadas vêm de `availableModalities`.
- Nenhuma regra de negócio depende de textos como “30 minutos” ou “Leitura assíncrona”.

## Fluxos de booking

### Scheduled

Leitura → Modalidade → Data e horário → Dados → Resumo → Pagamento

### Async

Leitura → Pergunta/contexto → Dados → Resumo → Pagamento

Para `?modalidade=voice` ou `?modalidade=video`, a modalidade é preservada e o catálogo inicial mostra somente leituras compatíveis. Quando `servico` e `modalidade` explícitos são incompatíveis, prevalece a leitura: a modalidade inválida é descartada e a única modalidade válida de uma leitura assíncrona é aplicada.

Resets em cascata:

- trocar leitura revalida a modalidade e limpa data/horário;
- trocar modalidade limpa data/horário;
- trocar data limpa horário;
- o resumo nunca deve conter modalidade, data ou horário incompatíveis.

Todos os horários mock representam `America/Sao_Paulo`. Disponibilidade real será autoridade exclusiva do backend.

## Mock services

As interfaces em `client/src/services/` formam a fronteira para a próxima fase:

- `AvailabilityService`: datas e slots;
- `BookingService`: criação e consulta por código público;
- `PaymentService`: criação de checkout e consulta de status.

As implementações atuais são exclusivamente demonstrativas. O código público é gerado no navegador e o booking é guardado em `sessionStorage`; isso não é persistência, segurança ou garantia de reserva. Produção deve gerar o código no servidor.

O checkout não coleta cartão, não executa Pix e não confirma reservas. Os estados aprovado, recusado, expirado e cancelado existem apenas para composição visual; aprovação só pode ser selecionada manualmente em desenvolvimento.

## Analytics e UTMs

Todos os eventos passam por `track()`. Componentes não chamam SDKs de terceiros diretamente. Os adapters futuros de GA4, Meta Pixel e Google Ads devem ser conectados somente nessa fronteira e apenas após consentimento.

Eventos preparados:

- `page_view`
- `view_service`
- `select_service`
- `select_modality`
- `begin_booking`
- `select_date`
- `select_time`
- `submit_customer_data`
- `begin_checkout`
- `mock_checkout_viewed`
- `purchase`
- `whatsapp_click`

UTMs suportadas: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term`. Elas são capturadas uma vez no bootstrap quando presentes e persistidas em `sessionStorage`.

**PURCHASE MUST ONLY BE FIRED AFTER VERIFIED BACKEND PAYMENT CONFIRMATION.** O frontend mock nunca emite `purchase`, inclusive quando o estado visual aprovado é selecionado em desenvolvimento.

## Acessibilidade

- zoom do navegador permanece habilitado;
- foco visível em controles interativos;
- stepper com `ol`/`li` e `aria-current`;
- seleções com `aria-pressed`;
- formulários com labels, `aria-invalid`, `aria-describedby` e erros anunciados;
- aceite de Termos validado pelo schema;
- menu mobile com `aria-expanded`, `aria-controls`, Escape e retorno de foco;
- header ganha superfície legível após scroll;
- CTA mobile respeita `env(safe-area-inset-bottom)`;
- microcopy usa tamanho mínimo de 11px e textos auxiliares 12px ou mais;
- paleta de texto secundário usa contraste reforçado sobre os fundos escuros.

Os breakpoints foram revisados para 375px, 390px, 430px, 768px, 1024px e 1440px, com atenção a header, hero, catálogo, booking, seletores, formulários, pagamento, CTA fixa e footer.

## SEO e deploy

O HTML contém metadata base, canonical, Open Graph, Twitter Card, favicon, apple-touch-icon, `robots.txt` e `sitemap.xml`. `RouteEffects` atualiza título, descrição, canonical e Open Graph para navegação SPA.

Antes da publicação:

1. configurar `VITE_SITE_URL` com o domínio real;
2. substituir `celeste.example` em `robots.txt` e `sitemap.xml`;
3. revisar os textos jurídicos e dados de contato;
4. avaliar prerenderização ou SSR para SEO avançado.

Como esta é uma SPA Vite, crawlers sem execução de JavaScript recebem apenas a metadata base. Metadata dinâmica server-side e prerender são trabalhos futuros. `vercel.json` encaminha rotas sem arquivo próprio para `index.html`, permitindo refresh direto em `/agendar`, `/leituras/...`, `/agendamento/...`, `/privacidade` e `/termos`.

## Testes

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
```

A suíte cobre catálogo, preço, fulfillment, modalidades, querystrings, resets em cascata, fluxos async/scheduled, schemas, termos, e-mail, disponibilidade mock, UTMs, consentimento, código público, persistência da sessão e ausência de `purchase` no checkout mock.

## Regras de negócio reservadas

- Pergunta Direta é assíncrona.
- Consultas de 30/60 minutos são agendadas.
- Modalidades dependem da leitura.
- Timezone oficial: `America/Sao_Paulo`.
- O backend será a fonte de verdade de disponibilidade.
- O backend deverá impedir double-booking com operação atômica.
- Booking só será confirmado após pagamento confirmado.
- O evento `purchase` só poderá ocorrer após confirmação real e verificada do pagamento.

## Backend Integration Points

Esta seção define contratos futuros; nenhum endpoint está implementado nesta branch.

### `GET /services`

Retorna o catálogo publicado. Cada item deve fornecer `slug`, nome, conteúdo editorial, `fulfillmentType`, `durationMinutes`, preço em unidade monetária inteira, modalidades, disponibilidade comercial e prazo estimado opcional.

### `GET /availability`

Parâmetros esperados: `serviceSlug`, `modality`, intervalo de datas e timezone. Retorna datas e slots ainda disponíveis. Deve ignorar serviços assíncronos e nunca confiar em slots enviados pelo frontend.

### `POST /bookings`

Recebe leitura, modalidade, data/slot quando agendado, questão quando assíncrono, dados do cliente, aceite/versionamento jurídico e UTMs. Deve:

- revalidar preço, modalidade e disponibilidade;
- criar código público server-side não previsível;
- impedir double-booking atomicamente;
- iniciar como pendente de pagamento;
- aceitar chave de idempotência;
- nunca confiar no preço ou status enviado pelo navegador.

### `GET /bookings/:publicCode`

Retorna uma projeção pública mínima do booking, sem expor identificadores internos ou dados sensíveis desnecessários. A política de acesso ao código público deve ser definida no backend.

### `POST /checkout`

Recebe uma referência interna/publicamente autorizada do booking e a forma de pagamento. Cria a preferência/sessão no provedor e retorna somente dados seguros necessários para montar Pix ou o componente oficial de cartão.

### `GET /payments/:id`

Retorna o estado sanitizado do pagamento: aguardando, aprovado, recusado, expirado ou cancelado. O frontend pode consultar para UX, mas não é autoridade de confirmação.

### Webhook do provedor de pagamento

Deve existir apenas no backend. O webhook precisa validar autenticidade, ser idempotente, buscar/confirmar o estado diretamente no provedor e atualizar pagamento e booking de forma consistente. Somente após essa confirmação o backend pode autorizar o evento `purchase`.

### Contratos adicionais da próxima fase

- versionamento dos Termos e da Política de Privacidade;
- configuração de prazos para leituras assíncronas;
- políticas de remarcação, cancelamento e expiração;
- serviço de e-mail e notificações, fora do request principal;
- observabilidade e trilha de auditoria de mudanças de status;
- autenticação e autorização administrativas em fase separada.

## Fora de escopo desta fase

- backend real;
- banco de dados e migrations;
- integração real com Mercado Pago;
- webhook;
- autenticação ou dashboard administrativo;
- envio de e-mail;
- API de WhatsApp;
- integrações externas.
