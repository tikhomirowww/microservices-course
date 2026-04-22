# Роадмап: Архитектура микросервисов

> [!note]
> Файл локальный, не отслеживается гитом. Обновляй статус по мере прохождения тем.

---

## Прогресс

| # | Тема | Что решает | Сложность | Статус |
|---|------|-----------|-----------|--------|
| 0 | **Saga Orchestration** | Распределённые транзакции | ⭐⭐⭐ | ✅ Готово |
| 1 | **API Gateway** | Единая точка входа, JWT, rate limiting | ⭐⭐ | ✅ Готово |
| 2 | **Outbox Pattern** | Атомарность: БД + очередь | ⭐⭐ | ✅ Готово |
| 3 | **CQRS** | Разделение read/write моделей | ⭐⭐⭐ | ✅ Готово |
| 4 | **gRPC** | Типизированный бинарный протокол | ⭐⭐⭐ | ✅ Готово |
| 5 | **Temporal** | Durable саги с retry и историей | ⭐⭐⭐⭐ | ⬜ |
| 6 | **Event Sourcing** | Состояние как лента событий | ⭐⭐⭐⭐⭐ | ⬜ |

---

## Детали по темам

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

### ⬜ Temporal

> [!tip] Что решает
> Самописный оркестратор не переживает падения процесса и не имеет retry из коробки.

**Что строим:**
- Workflow: async/await код который durable (переживает падения процесса)
- Activity: отдельный шаг с retry-политикой
- Замена нашего saga-orchestrator на Temporal Workflow

---

### ⬜ Event Sourcing

> [!tip] Что решает
> При обычном подходе история изменений теряется — хранится только текущее состояние.

**Что строим:**
- Вместо `UPDATE SET status = 'cancelled'` → запись события `OrderCancelled`
- Текущее состояние = apply всех событий (reduce)
- Event store вместо обычной таблицы
- Temporal projection: восстановление состояния на любой момент
