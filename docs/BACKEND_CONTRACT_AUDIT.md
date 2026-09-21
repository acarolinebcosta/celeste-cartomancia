# Auditoria de contratos — Booking Core

Data: 2026-09-20
Base: `main` em `9acf868a902c92390f7177ed15b4a99cf9a2fc07`

## Escopo auditado

- README e os pontos de integração reservados para backend;
- `client/src/types/domain.ts`;
- `client/src/services/availabilityService.ts`;
- `client/src/services/bookingService.ts`;
- `client/src/services/paymentService.ts`;
- fluxos `async` e `scheduled` em `Booking.tsx`;
- regras de transição em `features/booking/bookingState.ts`;
- catálogo e mocks de disponibilidade.

## Contratos preservados

- `Pergunta Direta` é assíncrona, aceita apenas `message` e exige pergunta;
- as demais leituras são agendadas e aceitam `voice`/`video`;
- bookings começam em `pending_payment`/`awaiting_payment`;
- `PaymentService` continua mock e nenhum fluxo emite `purchase`;
- componentes continuam dependentes das interfaces de serviço, não de transporte HTTP.

## Inconsistências que exigem ajuste localizado

### Disponibilidade não recebe modalidade

O contrato frontend atual recebe apenas `Reading`, mas o endpoint real precisa validar e consultar `serviceSlug`, `modality` e intervalo. A interface será ampliada para receber a modalidade escolhida e o cliente HTTP adaptará a resposta da API ao formato visual existente. A implementação mock seguirá disponível.

### Dinheiro usa unidades diferentes

O catálogo editorial usa reais inteiros (`price: 129`) para apresentação. O backend será autoridade e persistirá `priceCents: 12900`. A API exporá `priceCents`; adaptadores frontend farão a conversão na fronteira, sem aceitar preço como fonte de verdade no `POST /bookings`.

### Projeção pública contém dados pessoais do rascunho

O mock atual persiste todo o `BookingDraft` na projeção lida por código público. A API real não deve devolver nome, e-mail, WhatsApp, pergunta ou contexto. O tipo de confirmação será normalizado para uma projeção mínima com serviço, fulfillment, modalidade, agenda, preço e status. O mock implementará a mesma projeção.

## Decisões de backend

- PostgreSQL e Prisma são a fonte de verdade para catálogo, preço, modalidades, agenda e booking.
- Datas/hora de negócio são interpretadas explicitamente em `America/Sao_Paulo` e persistidas como instantes UTC (`timestamptz`).
- Concorrência de agenda será serializada no PostgreSQL por advisory lock transacional por dia de agenda, seguida de verificação de sobreposição dentro da mesma transação.
- Idempotência será serializada por advisory lock da chave e protegida também por índice único.
- `PENDING_PAYMENT` bloqueia o período apenas até `expiresAt`; registros vencidos são ignorados e podem ser marcados `EXPIRED` sem cron.
- IDs internos nunca integram DTOs públicos; `publicCode` é gerado no servidor com aleatoriedade criptográfica.
