# Роадмап: Архитектура микросервисов

> [!note]
> Файл локальный, не отслеживается гитом. Обновляй статус по мере прохождения тем.

---

## Прогресс

| # | Тема | Что решает | Сложность | Статус |
|---|------|-----------|-----------|--------|
| 0 | **HTTP Communication** | Базовое межсервисное взаимодействие | ⭐ | ✅ Готово |
| 1 | **RabbitMQ** | Асинхронная коммуникация через брокер | ⭐⭐ | ✅ Готово |
| 2 | **Circuit Breaker** | Устойчивость к падению зависимостей | ⭐⭐ | ✅ Готово |
| 3 | **Saga Choreography** | Распределённые транзакции без оркестратора | ⭐⭐⭐ | ✅ Готово |
| 4 | **Saga Orchestration** | Распределённые транзакции с оркестратором | ⭐⭐⭐ | ✅ Готово |
| 5 | **API Gateway** | Единая точка входа, JWT, rate limiting | ⭐⭐ | ✅ Готово |
| 6 | **Outbox Pattern** | Атомарность: БД + очередь | ⭐⭐ | ✅ Готово |
| 7 | **CQRS** | Разделение read/write моделей | ⭐⭐⭐ | ✅ Готово |
| 8 | **gRPC** | Типизированный бинарный протокол | ⭐⭐⭐ | ✅ Готово |
| 9 | **Temporal** | Durable саги с retry и историей | ⭐⭐⭐⭐ | ✅ Готово |
| 10 | **Event Sourcing** | Состояние как лента событий | ⭐⭐⭐⭐⭐ | ✅ Готово |
| 11 | **Kafka** | Отдельный проект: сравнение с RabbitMQ | ⭐⭐⭐ | ⬜ |

---

## Детали по темам

### ✅ HTTP Communication

> [!example] Коммит
> [feat: user-service and order-service communicating via HTTP](https://github.com/tikhomirowww/microservices-course/commit/d00dfeba)

- `order-service` вызывает `user-service` по HTTP для валидации пользователя при создании заказа
- Синхронная коммуникация: один сервис ждёт ответа другого

---

### ✅ RabbitMQ

> [!example] Коммит
> [feat: async communication via RabbitMQ](https://github.com/tikhomirowww/microservices-course/commit/fcdcc952)

- Асинхронная публикация событий через брокер
- `order-service` публикует `order_created` → `payment-service` и `notification-service` потребляют независимо
- NestJS `ClientProxy` + `@MessagePattern` / `@EventPattern`

---

### ✅ Circuit Breaker

> [!example] Коммит
> [feat: circuit breaker for user-service HTTP calls](https://github.com/tikhomirowww/microservices-course/commit/d58d8dc9)

- Защита от каскадных отказов при недоступности `user-service`
- Состояния: Closed → Open → Half-Open
- Библиотека `opossum`: `fallback` возвращает заглушку вместо ошибки

---

### ✅ Saga Choreography

> [!example] Коммит
> [feat: saga choreography - order status driven by payment events](https://github.com/tikhomirowww/microservices-course/commit/129c638d)

- Без центрального оркестратора — сервисы реагируют на события друг друга
- `payment-service` публикует `payment_success` / `payment_failed` → `order-service` меняет статус заказа
- Плюс: нет единой точки отказа. Минус: логика распределена, сложно отлаживать

---

### ✅ Saga Orchestration

> [!example] Коммит
> [feat: saga orchestration](https://github.com/tikhomirowww/microservices-course/commit/ce8202b0)

- Оркестратор: `create_order` → `process_payment` → `confirm/cancel`
- Исправлен баг с `EmptyError` (void return из `updateStatus`)

---

### ✅ API Gateway

> [!example] Коммит
> [feat: api gateway with jwt auth and proxy routing](https://github.com/tikhomirowww/microservices-course/commit/7453e823)

**Схема маршрутизации:**
```
Client → API Gateway :3005
  ├── /auth/*    → auth-service       (без JWT)
  ├── /users/*   → user-service       (JWT)
  ├── /orders/*  → order-service      (JWT)
  └── /saga/*    → saga-orchestrator  (JWT)
```

> [!important] Ключевые решения
> - `pathFilter` внутри прокси вместо пути в `app.use()` — иначе Express обрезает префикс
> - `JwtMiddleware` достаётся из DI через `app.get()` и регистрируется в `providers`
> - Whitelist `/auth` внутри middleware — публичные маршруты пропускаются без токена
> - `X-User-Id` / `X-User-Email` — передаются downstream из JWT payload

- `order-service` и `saga-orchestrator` — порты не проброшены наружу
- `ThrottlerModule` — rate limiting 10 req/min
- nginx убран как лишний слой

---

### ✅ Outbox Pattern

> [!example] Коммит
> [feat: outbox pattern for reliable event publishing](https://github.com/tikhomirowww/microservices-course/commit/4d0df2a5)

> [!tip] Что решает
> Проблема dual-write: запись в БД и публикация в очередь не атомарны. Если сервис упал между ними — событие потеряно.

**Что построили:**
- `Outbox` entity — таблица в той же БД что и заказы (`event`, `payload`, `published`)
- `orders.service.ts` — `create()` обёрнут в транзакцию: INSERT orders + INSERT outbox атомарно
- `OutboxScheduler` — каждые 5 секунд читает `WHERE published = false`, публикует в RabbitMQ, ставит `published = true`
- Два события: `order_created_notification` → notifications_queue, `order_created_payment` → payments_queue

> [!important] Ключевые решения
> - `DataSource.transaction(manager => ...)` — одна транзакция в одной БД
> - `ScheduleModule.forRoot()` + `@Interval(5000)` — периодический воркер
> - Разные названия событий для разных очередей вместо routing в payload

---

### ✅ CQRS

> [!example] Коммит
> [feat: CQRS with order-summary read model](https://github.com/tikhomirowww/microservices-course/commit/4c1d3f02)

> [!tip] Что решает
> Один и тот же объект плохо подходит и для записи (бизнес-логика), и для чтения (оптимизированные запросы).

**Что построили:**
- `OrderSummary` entity — денормализованная read-модель (`orderId`, `userId`, `userEmail`, `status`)
- `orders-read/` модуль — отдельный контроллер и сервис только для чтения
- `GET /orders` читает из `order_summary` — один быстрый SELECT без JOIN
- Write side (`orders.service.ts`) пишет в `orders` + `order_summary` атомарно в одной транзакции
- `updateStatus` обновляет обе таблицы при изменении статуса

> [!important] Ключевые решения
> - Read и write модели в одном сервисе но разных модулях — для учебного проекта достаточно
> - Синхронизация через транзакцию а не события — проще, т.к. read/write в одной БД
> - `@InjectRepository(OrderSummary)` — отдельный репозиторий для read модели

---

### ✅ gRPC

> [!example] Коммит
> [feat: gRPC inventory-service for stock reservation before order creation](https://github.com/tikhomirowww/microservices-course/commit/d7918cf9)

> [!tip] Что решает
> HTTP/JSON медленнее и не типизирован. gRPC даёт бинарный протокол (Protocol Buffers) и типизированный контракт через `.proto` файл.

**Схема:**
```
POST /orders → order-service
  → gRPC CheckAndReserve(itemId, quantity) → inventory-service
  ← { reserved: true/false }
  → если false: 409 Conflict
  → если true: транзакция → создать заказ
```

**Что построили:**
- `proto/inventory.proto` — общий контракт (один файл на оба сервиса)
- `inventory-service` — gRPC сервер (`Transport.GRPC`, `@GrpcMethod`)
- `order-service` — gRPC клиент (`ClientGrpc`, `getService<IInventoryService>`)
- `firstValueFrom()` — конвертация Observable в Promise
- Build context в корень проекта чтобы `proto/` был доступен обоим контейнерам

> [!important] Ключевые решения
> - gRPC для синхронного резервирования: нельзя создать заказ не зная есть ли товар
> - `proto/` в корне проекта — единый источник правды для контракта
> - `item_id` в proto → `itemId` в TypeScript — NestJS конвертирует автоматически
> - Числа `= 1`, `= 2` в proto — номера полей для бинарной сериализации, не значения
> - `inventory-service` не пробрасывается наружу — только внутри Docker сети

---

### ✅ Temporal

> [!example] Коммит
> [feat: Temporal durable saga with async order creation](https://github.com/tikhomirowww/microservices-course/commit/958c8bfa)

> [!tip] Что решает
> Самописный оркестратор не переживает падения процесса и не имеет retry из коробки.

**Схема:**
```
POST /orders → saga-orchestrator
  → Temporal: start orderSagaWorkflow(userId, orderId)
  ← {orderId, status: "pending"}  ← мгновенно

  [фоново]
  Activity: createOrder → order-service (RMQ)
  Activity: processPayment → payment-service (RMQ)
  Activity: confirmOrder / cancelOrder → order-service (RMQ)
```

**Что построили:**
- `worker.ts` — Temporal Worker: поллит сервер, выполняет Activities
- `order-saga.workflow.ts` — детерминированный сценарий саги (только логика, без IO)
- `order-saga.activities.ts` — шаги с реальным IO и retry (3 попытки, 30s timeout)
- `POST /orders` возвращает `pending` мгновенно, workflow живёт независимо от HTTP
- `orderId` генерируется до старта workflow — клиент сразу знает id заказа
- Temporal UI на `:8080` — история каждого шага, retry, ошибки

> [!important] Ключевые решения
> - Workflow детерминирован — нельзя делать IO напрямую, только через Activities
> - Activities решают проблему недетерминированности: выполняются один раз, результат сохраняется в историю
> - `node:20-slim` вместо `node:20-alpine` — Temporal SDK требует glibc, Alpine использует musl
> - `DB=postgres12` для Temporal auto-setup — sqlite не поддерживается в 1.24.2
> - `POST /orders` → saga-orchestrator, `GET /orders` → order-service (разделение по методу в gateway)

---

### ✅ Event Sourcing

> [!tip] Что решает
> При обычном подходе история изменений теряется — хранится только текущее состояние.

**Схема:**
```
POST /orders → saga-orchestrator
  → createOrder activity → order-service
    → INSERT order + INSERT order_summary + INSERT order_event(OrderCreated)  [одна транзакция]

updateStatus(orderId, CONFIRMED) → order-service
  → UPDATE order + UPDATE order_summary + INSERT order_event(OrderConfirmed)

GET /orders/:id/events → order-service
  ← [{type: ORDER_CREATED, ...}, {type: ORDER_CONFIRMED, ...}]
```

**Что построили:**
- `OrderEvent` entity — таблица `order_event`: `id`, `orderId`, `type` (enum), `payload` (json), `createdAt`
- `OrderEventType` enum — `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_CANCELLED`
- `EventStoreService` — `append(event, manager?)` и `getEvents(orderId)`
- `append` принимает опциональный `EntityManager` — чтобы работать в рамках внешней транзакции
- `createPending` — пишет `ORDER_CREATED` атомарно в одной транзакции с заказом
- `updateStatus` — пишет `ORDER_CONFIRMED` / `ORDER_CANCELLED`
- `GET /orders/:id/events` — новый эндпоинт, возвращает полную ленту событий

> [!important] Ключевые решения
> - `EventStoreService.append(event, manager?)` — опциональный manager для transactional writes
> - `OrderSummary` остаётся как read-проекция — именно так и работает Event Sourcing в продакшене
> - `@CreateDateColumn()` — время проставляется автоматически, не передаётся вручную
> - Event store — append-only, события никогда не обновляются и не удаляются
