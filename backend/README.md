# Backend

Sales Performance Dashboard — ASP.NET Core API, который по POST-запросу считает все 11 блоков дашборда продаж (KPI, рейтинги менеджеров, клиенты, временные ряды, категории, товары, лента сделок, потери) и отдаёт их одним JSON-ответом из PostgreSQL.

Данные read-only: HTTP-контур ничего не пишет, справочные и транзакционные данные генерирует seed при старте.

> **Документация.** Бизнес-правила и формулы — [domain.md](../docs/domain.md). Этот README самодостаточен для работы: контракт API, схема БД и архитектура слоёв описаны здесь.

## Технологический стек

| Компонент | Выбор |
|---|---|
| Рантайм / язык | .NET 8, C# |
| Веб-фреймворк | ASP.NET Core (Web API) + Swashbuckle (Swagger UI) |
| ORM | EF Core 8 (Code First, миграции) + Npgsql |
| БД | PostgreSQL 16 (`timestamptz` — UTC, `numeric(18,2)` — деньги, UUID — ключи) |
| Тесты | xUnit, `WebApplicationFactory`, Testcontainers.PostgreSql (реальный Postgres в Docker) |
| Docker | Compose: сервисы `postgres` + `backend` |

## Структура решения

```
backend/
  SalesDashboard.slnx
  SalesDashboard.Domain/            # вычислительное ядро, 0 зависимостей
  SalesDashboard.Application/       # сценарий дашборда, порты чтения, read models
  SalesDashboard.Infrastructure/    # EF Core, реализации портов, миграции, seed
  SalesDashboard.Api/               # контроллер, DTO, валидация, мапперы, DI
  *.Tests/                          # по проекту тестов на каждый слой
```

Clean Architecture, зависимости направлены внутрь: `Api → Application → Domain`, `Infrastructure → Application/Domain`. Три семейства моделей не смешиваются: persistence entity ≠ application read model ≠ API DTO.

### Ключевые элементы и где их искать

| Что | Где | Ответственность |
|---|---|---|
| `DashboardController` | `Api/Controllers/` | Единственный эндпоинт `POST /api/v1/dashboard`. Тонкий: валидирует запрос, передаёт его мапперу запроса, вызывает use case и отдаёт результат мапперу ответа — своей логики не содержит |
| `DashboardRequestValidator` | `Api/Validation/` | Правила периода и сегмента; ошибки формата `PERIOD_INVALID_ORDER` / `PERIOD_NOT_DAY_ALIGNED` → `400 ProblemDetails` |
| `DashboardRequest` / `DashboardDto` + вложенные | `Api/Dtos/` | JSON-контракт (см. «Контракт API»); enum'ы сериализуются числами |
| `IApiMapper<,>` и мапперы | `Api/Mapping/` | Пересечение границы `Application → Api`: маппер запроса превращает DTO запроса в `DashboardQuery`, маппер каждого блока превращает свою read model в DTO, `DashboardResponseMapper` собирает из них весь ответ |
| `GlobalExceptionHandler` | `Api/Errors/` | Непредвиденные ошибки → `500 ProblemDetails`; `OperationCanceledException` пропускает |
| `IGetDashboardUseCase` / `GetDashboardUseCase` | `Application/UseCases/` | Оркестрация 8 builder'ов; единственное место, знающее состав дашборда |
| Builder'ы блоков (`KpiBuilder`, `ManagerBuilder`, …) | `Application/Builders/` | По одному на блок ответа (см. «Контракт API»). Читает сырые агрегаты (query-rows) через порт чтения, метрики и Δ считает доменными калькуляторами, собирает результат в read model блока |
| Query-rows (`PeriodTotalsRow`, `ManagerAggregateRow`, …) | `Application/Abstractions/Queries/` | Сырые агрегаты, приходящие из SQL |
| `SeriesBuckets` | `Application/Abstractions/Queries/` | Сетка бакетов временных рядов: выбор шага-делителя, перечисление бакетов, ключ строки (см. «Сетка бакетов серий») |
| Порты (`IKpiReadPort`, `IManagerReadPort`, …) | `Application/Abstractions/` | Дробные интерфейсы чтения; builder видит только свои |
| `SalesDbContext`, `*Entity`, `*Configuration` | `Infrastructure/Persistence/` | Маппинг шести таблиц, индексы (см. «Схема данных»), миграции в `Migrations/`. Конфигурации подключаются в `OnModelCreating` сканированием сборки (`ApplyConfigurationsFromAssembly`) — новая `*Configuration` подхватывается без правки контекста |
| `Ef*ReadPort` | `Infrastructure/ReadPorts/` | LINQ-агрегаты (`GroupBy`/`Sum`/`Count`) с `AsNoTracking` → один `GROUP BY`-запрос на порт; ключ бакета серий пересобирается в памяти (`SeriesBuckets`, см. раздел ниже) |
| `SaleQueryExtensions` | `Infrastructure/Extensions/` | Общие фрагменты запросов портов: сегментный фильтр и окна дат (`InPaidCohort`, `InRefundedWindow`, `InCancelledWindow`) |
| `ServiceCollectionExtensions`, `WebApplicationExtensions` | `Extensions/` каждого проекта | Регистрация DI по слоям; стартовый хук инициализации БД |
| `DatabaseInitializer` → `DatabaseSeeder` → `SeedDataFactory` | `Infrastructure/Seed/` | Цепочка инициализации при старте: `DatabaseInitializer` применяет миграции, `DatabaseSeeder` решает, нужно ли сеять (пропускает, если таблица `sales` непуста), `SeedDataFactory` детерминированно генерирует данные |
| `DateRange`, `CustomerSegment`, `MetricThresholds` | `Domain/` | Value Objects и константы внимания (пороги малой выборки) |
| Калькуляторы (`ResultMetricsCalculator`, `DeltaCalculator`, …) | `Domain/Services/` | Формулы `domain.md`: метрики, Δ, вклады, статус сделки, предыдущий период, ранжирование |
| Composition root | `Api/Program.cs` | Регистрация: домен-калькуляторы — singleton, builder'ы/порты/DbContext — scoped |

## Схема данных

Шесть таблиц; связи `managers 1—N sales N—1 customers` и `sales 1—N sale_items N—1 products N—1 categories`. Денежные значения — `numeric(18,2)`, даты — `timestamptz` (UTC), ключи — UUID. Две детали, которые легко потерять:

- **Замороженные цены.** Метрики считаются только из `sale_items.sale_price` / `unit_cost` на момент сделки; справочные `products.price` / `cost` в расчётах не участвуют — история неизменна при обновлении прайса.
- **Статус не хранится** (см. «Неочевидные нюансы» ниже).

Индексы — по разрезу каждого блока (колонки и обоснования):

| Таблица | Индекс | Обслуживает |
|---|---|---|
| customers | `ix_customers_segment (segment)` | Глобальный фильтр по сегменту |
| products | `ix_products_sku (sku) UNIQUE` | Уникальность артикула |
| sales | `ix_sales_paid_at (paid_at) INCLUDE (manager_id, customer_id, refunded_at)` | KPI, ряды, рейтинги, топы клиентов, лента, знаменатель доли отмен |
| sales | `ix_sales_manager_paid (manager_id, paid_at)` | Метрики и Δ одного менеджера |
| sales | `ix_sales_customer_paid (customer_id, paid_at)` | Метрики одного клиента |
| sales | `ix_sales_refunded_at … WHERE NOT NULL` | Блок «Возвраты» |
| sales | `ix_sales_cancelled_at … WHERE NOT NULL` | Блок «Отмены» |
| sale_items | `ix_sale_items_sale_id INCLUDE (product_id, quantity, sale_price, unit_cost)` | Все денежные агрегации (index-only scan) |
| sale_items | `ix_sale_items_product_id (product_id)` | Топ продуктов, возвраты по товарам |

Принципы: покрывающие (`INCLUDE`) — ради index-only scan по фиксированному набору колонок; композитные `(fk, paid_at)` вместо одиночных FK-индексов (одиночный — префикс, дубль не нужен); частичные под потери (большинство строк `Paid` — NULL в этих колонках); на справочниках (`managers`, `categories`) индексов нет — таблицы штучные, планировщик их не использует. Исключение — конвенционный `IX_products_category_id` от EF (см. «Неочевидные нюансы»).

## Как вычисляются метрики

Разделение труда строгое — одна и та же величина нигде не считается дважды:

| Слой | Что считает | Пример |
|---|---|---|
| SQL / EF Core | Только сырые суммы и счётчики | `sum(sale_price * quantity)`, `count(*)`, дневные группировки |
| Domain | Отношения, Δ, вклады, статусы | `Margin = ВП / Revenue`, `Δ% = (cur − prev) / prev × 100` |
| Builder | Композиция блока | Пороги малой выборки (значение → `null`), порядок через `IDatasetRankingPolicy` |
| Api | Только сериализация | read model → DTO |

Пример пути величины: `Revenue` приходит из SQL суммой по `sale_items`; `GrossProfit = Revenue − Cost` и `Margin` считает `ResultMetricsCalculator`; `Δ к предыдущему периоду` — `DeltaCalculator` (при `prev = 0` → `null`, не `+∞`). Все формулы — в [domain.md](../docs/domain.md), раздел «Метрики».

Ранжирование датасетов — общая `IDatasetRankingPolicy`: по метрике датасета по убыванию, при равенстве — детерминированный tie-break (менеджеры — по Revenue, затем по имени; остальные — по имени А→Я), поэтому позиции не «прыгают» между запросами.

Периоды — полуинтервалы `[from, to)`: `from` включается, `to` — нет, поэтому активный и предыдущий периоды примыкают без зазора и пересечения. Предыдущий период всегда той же длительности, непосредственно перед активным: `previous = [from − (to − from), from)` — пресеты меняют выбор активного периода, но не это правило.

Поток одного запроса:

```
POST /api/v1/dashboard
  → валидатор (400 при ошибке) → DashboardQuery
  → GetDashboardUseCase: 8 builder'ов ПОСЛЕДОВАТЕЛЬНО на одном scoped DbContext
  → каждый builder: Ef*ReadPort (SQL-агрегат) + доменные калькуляторы
  → DashboardModel → маппер → DashboardDto (200)
```

Builder'ы последовательные, потому что `DbContext` не потокобезопасен и владеет одним соединением; параллелизация потребовала бы `IDbContextFactory` на задачу — сейчас запросы длятся доли секунды, выигрыша нет. `CancellationToken` проходит весь путь до Npgsql — при разрыве соединения клиентом запрос прерывается на стороне PostgreSQL, частичный ответ не возвращается.

## Контракт API (кратко)

Здесь — то, что нужно постоянно: запрос, ошибки валидации, enum-значения и состав ответа.

**Запрос** — `POST /api/v1/dashboard`:

| Поле | Тип | Смысл |
|---|---|---|
| `from` / `to` | `datetime` | Активный период — полуинтервал `[from, to)`, оба конца — полночь UTC |
| `segment` | enum `Segment` | Отсутствует или `null` — все сегменты |

Валидатор отвечает `400 ProblemDetails` с массивом `errors[]` (`field`, `code`); `detail` — человекочитаемое описание первой ошибки:

| Код | Условие |
|---|---|
| `PERIOD_REQUIRED` | `from`/`to` отсутствуют, `null` или невалидны |
| `PERIOD_INVALID_ORDER` | `from >= to` |
| `PERIOD_NOT_DAY_ALIGNED` | граница периода не в полночь UTC |
| `SEGMENT_INVALID` | `segment` вне набора enum |

**Сквозное правило «null ≠ 0»:** `null` — метрика не определена (пустой знаменатель, выборка ниже порога, нет данных); `0` — реальный ноль (продаж не было → `0 ₽`); `delta: null` — Δ не вычисляется. Клиент по этому правилу различает `—` и `0 ₽`.

**Enum-значения** — числа (wire-формат), значения зафиксированы явно и закреплены контрактным тестом:

| Enum | Значения |
|---|---|
| `Segment` | `1` Enterprise, `2` Mid-market, `3` SMB |
| `DeltaUnit` | `1` percent (`%`), `2` pp (`п.п.`) |
| `ContributionUnit` | `1` gp (от ВП), `2` revenue (от выручки), `3` units (от объёма), `4` ac (× к СЧ) |
| `SaleStatus` | `1` paid, `2` refunded, `3` cancelled |

**Состав ответа** — 11 блоков: `kpi`, `managerRating`, `managerComparison`, `topCustomers`, `customerDynamics`, `timeSeries`, `categories`, `topProducts`, `recentSales`, `refunds`, `cancellations`. Поля присутствуют всегда: при отсутствии данных блоки возвращают `null`-метрики и пустые массивы — структура стабильна, клиент не проверяет наличие секций.

## Сетка бакетов серий

Все временные ряды (спарклайны KPI и лидера, «Динамика во времени», ряды потерь) строятся на единой сетке бакетов — `SeriesBuckets`. Период делится на равные диапазоны: шаг — делитель длительности в целых часах, ближайший к «длительность / 30» (при равном удалении — мельче); число точек удерживается в полосе **[24, 36]**. Сетка якорится на `period.From`, все бакеты равной ширины и стыкуются без зазоров; точка серии несёт полуинтервал `dateFrom`/`dateTo`.

**Чтение — двухфазное.** SQL группирует события по паре (календарный день, час) — оба поля транслируются EF на любом провайдере; группировка сразу по индексу бакета (`floor((paid_at − from) / step)`) при переменном шаге и якоре в статическое SQL-выражение не транслируется, поэтому `SeriesBuckets.KeyOf` пересобирает ключ в памяти рид-порта. Объём памяти ограничен числом пар (день, час) с событиями — максимум 24 × дней строк по 3–4 поля **независимо от числа сделок**; на выходе билдеры получают ≤ 36 строк `DailyAggregateRow` на серию.

**Периоды только целодневные** (полночь UTC в обоих концах): сетка якорится на полночь, нецелая граница молча отрезала бы крайние часы периода от всех метрик. Это закрепляет валидатор — `400 PERIOD_NOT_DAY_ALIGNED` (тест — точный кейс границы `04:25:31` в `DashboardEndpointTests`).

Лестница масштабирования под нагрузкой — в «Точках улучшения производительности».

## Кэширование

Каждый POST-запрос пересчитывает весь дашборд с нуля: никакого `IMemoryCache`, `ResponseCache`, materialized views. На текущем масштабе (несколько тысяч сделок, агрегаты покрыты индексами) ответ формируется за доли секунды, и кэш не окупил бы усложнение. Точка пересмотра и первые кандидаты — в «Точках улучшения производительности» ниже.

## Запуск

```bash
# Вариант 1: всё в Docker
docker compose up --build          # API на http://localhost:8080, Swagger: /swagger

# Вариант 2: БД в Docker, API на хосте
docker compose up -d postgres
cd backend/SalesDashboard.Api
dotnet run
```

Для варианта 2 нужно создать `appsettings.Development.json` (**не в git**, в `.gitignore`):

```json
{
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Port=5432;Database=sales_dashboard;Username=postgres;Password=postgres"
  }
}
```

Значения совпадают с `docker-compose.yml`. Альтернатива файлу — переменная окружения `ConnectionStrings__Postgres`. В `appsettings.json` строка подключения пуста намеренно: в git попадает только ключ, значения задаются по окружениям. Внутри docker-сети БД адресуется по имени сервиса (`Host=postgres`), а не `localhost`.

При старте `Program.cs` вызывает `InitializeDatabaseAsync`: применяются миграции, затем `DatabaseSeeder` проверяет таблицу `sales` — если она непуста, seed пропускается (идемпотентность). Иначе `SeedDataFactory` детерминированно (фиксированный якорь `2026-10-03` UTC, ~12 месяцев истории, несколько тысяч сделок с сезонностью, ростом, отменами и возвратами) генерирует и сохраняет весь граф.

### Тесты

```bash
dotnet test backend/SalesDashboard.slnx
```

182 теста: Domain (формулы, Δ, tie-break, пороги, периоды), Application (builder'ы на fake-портах, сетка бакетов — свип длительностей на полосу [24, 36], отмена, `null` vs `0`), Api (контракт, валидация — включая `PERIOD_NOT_DAY_ALIGNED` на границе `04:25:31`, соответствие enum'ов контракту). Api-тесты поднимают реальный PostgreSQL через Testcontainers — нужен запущенный Docker.

## Неочевидные нюансы

- **`DateTime` обязан быть `Kind=Utc`.** Все даты в БД — `timestamptz`; Npgsql отказывается писать `Kind=Unspecified`. В seed-фабрике якорь создан как `new DateTime(2026, 10, 3, 0, 0, 0, DateTimeKind.Utc)` — арифметика `AddDays`/`AddTicks` Kind сохраняет. Новые поля дат — то же правило.
- **Статус сделки не хранится в БД.** Он выводится из трёх дат (`paidAt`, `refundedAt`, `cancelledAt`) единственным источником правил — `SaleStatusResolver`. Порядок событий и допустимые комбинации — [domain.md](../docs/domain.md), «Жизненный цикл сделки».
- **Enum'ы API числовые.** `CustomerSegment`, `SaleStatus` и др. сериализуются числами без конвертера; значения зафиксированы явно и закреплены контрактным тестом. Десериализатор числа не проверяет принадлежность enum'у, поэтому валидатор делает `Enum.IsDefined` (`segment: 4` иначе прошёл бы как `(CustomerSegment)4`).
- **Сортировка в SQL почти отсутствует.** `ORDER BY` — только в ленте «Последние продажи» (`paidAt DESC LIMIT N`). Ранжирование датасетов по производным метрикам (маржа, средний чек) нельзя выполнить в SQL — его делает общая `IDatasetRankingPolicy` в домене, с детерминированным tie-break.
- **Индексы под каждый разрез.** Покрывающий индекс по `sale_items(sale_id) INCLUDE (...)` — под самое горячее соединение; частичные индексы по `refunded_at`/`cancelled_at` (`WHERE ... IS NOT NULL`) — под блок потерь; `ix_customers_segment` — под глобальный фильтр сегмента. Полный список и обоснования — в разделе «Схема данных».
- **EF добавляет индекс на FK сам.** Для `products.category_id` создается конвенционный `IX_products_category_id`, которого нет в списке выше; он признан безвредным и не подавляется (комментарий в `ProductConfiguration`).
- **Валидация — своя, без FluentValidation.** Ответ — стандартный `ProblemDetails` (RFC 7807) из ASP.NET Core, но с контрактным расширением `errors[]` (`field`, `code`) — фреймворковый дефолт даёт словарь «поле → строки» без машиночитаемых кодов. Библиотека не убрала бы маппинг в этот формат, а зависимость добавила. Невалидный JSON отсекается фреймворком до валидатора — стандартный `400`.
- **Серверного таймаута нет.** Контракт знает только `400`/`500`; медленного клиента отсекает его собственный `RequestAborted`. Добавляется позже через `RequestTimeouts` middleware с синхронной правкой контракта.

## Типовые правки: с чего начать

**Новый блок дашборда** (пример: «Средний чек по командам»):

1. Порт (если нужны новые данные): интерфейс в `Application/Abstractions/`, query-row в `Abstractions/Queries`, реализация `Ef*ReadPort` в `Infrastructure/ReadPorts/` + регистрация в `Infrastructure/Extensions/ServiceCollectionExtensions.cs`.
2. Builder: интерфейс и реализация в `Application/Builders/`, метрики через доменные калькуляторы, ранжирование через `IDatasetRankingPolicy`; регистрация в `Application/Extensions/ServiceCollectionExtensions.cs`.
3. Read model: `Application/Models/` + поле в `DashboardModel`.
4. Точка композиции: вызов builder'а в `GetDashboardUseCase.ExecuteAsync` — единственное место, правящее существующий код (сами builder'ы и порты не трогаются).
5. API: DTO в `Api/Dtos/`, маппер в `Api/Mapping/`, сборка в `DashboardResponseMapper`, регистрация в `Api/Extensions/ServiceCollectionExtensions.cs`, обновление раздела «Контракт API» и контрактных тестов.

**Новая метрика или формула:** калькулятор в `Domain/Services/` (stateless, только там формулы), при необходимости порог в `MetricThresholds`. Формулу зафиксировать в `domain.md`, покрыть тестами Domain.

**Новый фильтр запроса** (например, по команде): правило в `DashboardRequestValidator` + код ошибки, поле в `DashboardRequest` → `DashboardQuery` → в фильтры портов (`SaleQueryExtensions`). Контракт — раздел «Контракт API».

**Изменение схемы БД:** сначала правка раздела «Схема данных», затем entity + `*Configuration` в `Infrastructure/Persistence/`, миграция (`dotnet ef migrations add`), при необходимости — индексы под новые разрезы. `dotnet ef` работает без Api-хоста: `SalesDbContextFactory` в `Infrastructure/Persistence/` — design-time фабрика, которая строит контекст со строкой подключения из `appsettings.json`/окружения; при `migrations add` соединение с БД не открывается (строка нужна только чтобы вписать её в сгенерированную миграцию).

**Доработка seed-данных:** `Infrastructure/Seed/SeedDataFactory.cs` — детерминированная генерация (роли менеджеров, сезонность, сегментные факторы клиентов, ценовые факторы возвратов). Якорь фиксированный: правки изменят датасет целиком, интеграционные тесты на согласованность seed-дат покажут расхождения.

## Точки улучшения производительности

По возрастанию сложности внедрения:

1. **Кэш ответа** — `IMemoryCache` вокруг `IGetDashboardUseCase` с ключом `(from, to, segment)` и TTL в минуты. Наибольший выигрыш при повторных запросах, минимальная правка (декоратор над use case).
2. **Параллельные builder'ы** — `IDbContextFactory<SalesDbContext>` + отдельный контекст на блок. Сейчас осознанно не делается; имеет смысл, когда суммарное время запроса вырастет заметно.
3. **Серверная группировка бакетов серий** — один raw-SQL-запрос с inline-выражением индекса (`GROUP BY (extract(epoch from paid_at - @from)::bigint / @step)`) вместо двухфазной схемы «GROUP BY (день, час) + пересборка в памяти», плюс BRIN-индекс по `paid_at` под append-only поток. Имеет смысл, когда скан окна станет заметным; локализация — три рид-порта через общий хелпер.
4. **Материализованная почасовая свёртка** — `MATERIALIZED VIEW` по паре (день, час) с инкрементальным обновлением: стоимость запроса перестаёт зависеть от объёма истории (чтение ≤ 8 760 готовых строк на год независимо от числа событий). Цена — механизм рефреша и окно устаревания. Единственный этап, реально снимающий рост с объёмом данных; актуален при росте сделок на порядки. Сюда же — summary-таблицы по менеджерам.
5. **Разбиение ответа** — сейчас дашборд отдаётся одним JSON; ленту сделок и тяжёлые ряды можно вынести в отдельные эндпоинты с пагинацией, если размер ответа станет проблемой.

Любая из этих правок не требует пересмотра слоёв: кэш и параллелизация — внутри Application/Infrastructure, серверная группировка и агрегаты — Infrastructure, новые эндпоинты — по рецепту «новый блок» выше.

## Частые проблемы

- `dotnet run` с хоста падает при первом обращении к БД — не создан `appsettings.Development.json` (см. «Запуск»).
- В контейнере backend не подключается к БД — в строке подключения должен быть `Host=postgres` (имя сервиса), не `localhost`.
- `ConnectionStrings__Postgres` не переопределяет файл — в env var нужен `__` (два underscore), не `:`.
- Порт 5432 занят — `docker compose ps`, затем `netstat -ano | findstr :5432` (Windows) / `lsof -i :5432` (Linux/macOS).
- Api-тесты не стартуют — Testcontainers требует запущенный Docker.

## Сознательно не делаем

- CQRS-шину, медиаторы, Event Sourcing, Dapper и второй стек доступа — EF Core покрывает все агрегаты, задачи для остального нет.
- Write-операции и CRUD сделок — контур read-only, данные приходят из seed.
- Авторизацию/JWT — вне scope.
- Кэш и серверный таймаут — см. «Кэширование» и «Неочевидные нюансы»; точки пересмотра — в «Точках улучшения производительности».

## Ссылки

- [domain.md](../docs/domain.md) — глоссарий, формулы метрик, константы внимания
- [Docker Compose docs](https://docs.docker.com/compose/)