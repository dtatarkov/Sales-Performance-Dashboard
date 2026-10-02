# Архитектура backend (backend.md)

Документ верхнего уровня: слои, классы/интерфейсы и связи между ними. Без деталей
реализации. Источник бизнес-правил — `domain.md`, схема данных — `db.md`, контракт —
`api.md`.

---

## 1. Принципы

- **Clean Architecture.** Зависимости направлены внутрь: `Api → Application → Domain`,
  `Infrastructure → Application/Domain`. Domain не знает ни о чём.
- **SOLID.** Один сервис — один блок дашборда (SRP); новый блок добавляется без
  правки существующих (OCP); порты чтения дробные (ISP); Application владеет
  абстракциями, Infrastructure их реализует (DIP).
- **Read-only домен.** Приложение только читает: у него нет бизнес-сущностей с
  поведением и write-операций. Domain — вычислительное ядро (Value Objects, enum,
  stateless-сервисы), а не модель хранения.
- **Три несмешиваемых семейства моделей.** Persistence entity ≠ Application read
  model ≠ API DTO. Границу `Application → Api` пересекает маппер; границу
  `Infrastructure → Application` — EF-проекция.
- **Простые решения.** 4 проекта, без CQRS-шины, без медиаторов, без «40 проектов»
  (`specification.md`, §7, §20).

### Семейства моделей и границы

| Семейство | Где живёт | Назначение | Во что переходит |
|---|---|---|---|
| **Persistence entity** | `Infrastructure` | Строки таблиц EF Core | query-row (EF-проекция, §4.3) |
| **Application read model** | `Application` | Результат сценария (готовые числа блоков) | API DTO (маппер в Api) |
| **API DTO** | `Api` | JSON-контракт `api.md` | — |

Domain не держит сущностей: stateless-сервисы работают над query-rows. Value Objects
не покидают Domain; enum'ы — общие типы-контракты, их числовые значения зафиксированы
`api.md`, поэтому DTO использует их напрямую, без дублирования и маппинга (§6.2). Правило: ни один слой не использует
модель «чужого» семейства напрямую — только через маппер или проекцию.

---

## 2. Проекты и зависимости

```
backend/
  SalesDashboard.sln
  SalesDashboard.Domain/            # ядро, 0 зависимостей
  SalesDashboard.Application/       # сценарии, порты, read models
  SalesDashboard.Infrastructure/    # EF Core, реализации портов чтения, seed
  SalesDashboard.Api/               # контроллер, DTO, валидация, api mappers, DI
  SalesDashboard.Domain.Tests/      # юнит-тесты домена
  SalesDashboard.Application.Tests/ # юнит-тесты builder'ов
  SalesDashboard.Api.Tests/         # интеграционные (WebApplicationFactory)
```

```
        ┌──────────────────────┐
        │      Api (Web)       │
        └───────┬───────┬──────┘
                │       │ (composition root)
                ▼       ▼
     ┌──────────────────┐  ┌────────────────────────┐
     │   Application    │◄─│    Infrastructure      │
     └────────┬─────────┘  └───────────┬────────────┘
              │                        │
              ▼                        ▼
        ┌──────────────────────────────────┐
        │              Domain              │
        └──────────────────────────────────┘
```

`Api` ссылается на `Infrastructure` только ради регистрации DI в `Program.cs`.
Прикладной код контроллера зависит исключительно от абстракций `Application`.

---

## 3. Domain — вычислительное ядро и правила

HTTP-контур read-only, поэтому домен не моделирует сущности и их жизненный цикл.
В нём остаётся только то, что не зависит от хранения: Value Objects, enum'ы и
stateless-сервисы, считающие метрики из query-rows. Данные в БД попадают из seed,
который работает напрямую с persistence entities (§5.4).

### 3.1 Value Objects и enum

| Тип | Вид | Смысл |
|---|---|---|
| `Money` | value object (`decimal Amount`) | Денежное значение `numeric(18,2)`, арифметика |
| `DateRange` | value object (`From`, `To`, границы включительно) | Активный период; инвариант `From ≤ To` держит guard clause в конструкторе |
| `CustomerSegment` | enum | `Enterprise = 1`, `MidMarket = 2`, `Smb = 3` |
| `SaleStatus` | enum | `Paid = 1`, `Refunded = 2`, `Cancelled = 3` |
| `RankingMetric` | enum | `GrossProfit`, `AverageCheck` (внутренний, в JSON не выходит) |
| `ContributionBasis` | enum | `GrossProfit = 1`, `Revenue = 2`, `Units = 3`, `AverageCheck = 4` |
| `MetricThresholds` | value object | константы `domain.md`: `RefundMinSample`, `CancellationMinSample`, `DynMinBaseOrders`, `DynTopN`, пороги внимания |

Числовые значения enum'ов, попадающих в JSON, — часть контракта `api.md`. Они заданы
явно (`= 1, = 2, …`), чтобы перестановка членов не сломала wire-формат, и закреплены
контрактным тестом (§9).

### 3.2 Доменные сервисы (stateless, чистые)

Формулы `domain.md` реализованы один раз в домене и используются сборкой
дашборда. SQL/EF считает только **сырые суммы и счётчики**; отношения, Δ и вклады
считает домен.

| Интерфейс | Ответственность |
|---|---|
| `ISaleStatusResolver` | Статус по трём датам (единственный источник правил) |
| `IPeriodResolver` | Предыдущий сопоставимый период по `DateRange` |
| `IResultMetricsCalculator` | Метрики результата по когорте оплаты: `GrossProfit`, `Margin`, `AverageCheck` |
| `ILossRateCalculator` | Доли потерь: `RefundRate` (когорта), `CancellationRate` (событие); правило `null` при пустом знаменателе |
| `IDeltaCalculator` | `Δ%` и `Δ п.п.`, правило `prev = 0 → null` |
| `IContributionCalculator` | `absolute` / `relative` / `normalized` для датасетов |
| `IDatasetRankingPolicy` | Единое ранжирование всех датасетов: по метрике датасета по убыванию + детерминированный tie-break (менеджеры — Revenue, затем имя; остальные — имя A→Я) |

Реализации: `SaleStatusResolver`, `PeriodResolver`, `ResultMetricsCalculator`,
`LossRateCalculator`, `DeltaCalculator`, `ContributionCalculator`,
`DatasetRankingPolicy` (в Domain).

Политика ранжирования — одна на все датасеты (`api.md`, блоки 2, 3, 4, 5, 7, 8 и
топы потерь 10, 11): правило «по активной метрике по убыванию, при равенстве —
детерминированный порядок» сквозное. Различается лишь ключ метрики и tie-break — их
передаёт builder.

### 3.3 Исключения

Доменных исключений нет. Невалидный период отсекается на границе API
(`DashboardRequestValidator` → `400`, `api.md`) и до домена не доходит. Дополнительно
`DateRange` защищён guard clause в конструкторе: попытка создать его с `From > To`
бросает стандартное `ArgumentException`. Это техническая защита от ошибочного
вызова, а не доменное исключение, поэтому `GlobalExceptionHandler` её не
обрабатывает (такой вызов — баг, а не пользовательский ввод). Для read-only
вычислительного ядра иных ошибочных состояний не существует — отдельный тип
исключения и его базовый класс были бы неиспользуемой абстракцией.

---

## 4. Application — сценарии и порты

### 4.1 Входная модель сценария

```csharp
public sealed record DashboardQuery(DateRange Period, CustomerSegment? Segment);
```

### 4.2 Use case (точка входа)

```csharp
public interface IGetDashboardUseCase
{
    Task<DashboardModel> ExecuteAsync(DashboardQuery query, CancellationToken ct);
}

public sealed class GetDashboardUseCase : IGetDashboardUseCase { /* оркестрация builder'ов */ }
```

`GetDashboardUseCase` не считает сам — он вызывает builder'ы блоков и складывает
результат в `DashboardModel`. Это единственное место, знающее состав дашборда.

Builder'ы выполняются **последовательно** на одном scoped `SalesDbContext`. Дело не
в изменяемости данных — запросы read-only и `AsNoTracking` — а в самом экземпляре
контекста: `DbContext` не потокобезопасен, он владеет соединением ADO.NET (одно
соединение не выполняет два запроса одновременно) и разделяемым мутабельным
состоянием (`StateManager`, connection/transaction state). `AsNoTracking` отключает
трекинг только у результатов и контекст потокобезопасным не делает. Параллельные
builder'ы потребовали бы отдельного `DbContext` на задачу через
`IDbContextFactory<SalesDbContext>` — это осознанно не вводится: запросы длятся
доли секунды, а жизненный цикл, пул соединений и сложность выросли бы без выигрыша.

`ct` проверяется перед каждым шагом (`ThrowIfCancellationRequested`) и
пробрасывается в каждый запрос порта.

### 4.3 Порты чтения (query side)

Дробные интерфейсы (ISP): каждый builder зависит только от нужных. Возвращают
**сырые агрегаты** (суммы, счётчики, даты), без готовых метрик и Δ.

| Интерфейс | Возвращает (query-row) |
|---|---|
| `IKpiReadPort` | `PeriodTotalsRow` (Revenue, Cost, SalesCount, RefundCount, CancelCount), дневной ряд, лидер по ВП |
| `IManagerReadPort` | агрегаты по менеджерам за период + предыдущий, дневной ряд менеджера |
| `ICustomerReadPort` | агрегаты по клиентам за период + предыдущий |
| `IProductReadPort` | агрегаты по товарам (выручка, ВП, units, возвраты) |
| `ICategoryReadPort` | агрегаты по категориям |
| `ISaleFeedReadPort` | последние сделки (три даты, клиент, менеджер, позиции, сумма) |
| `ILossReadPort` | суммы/ряды/топы возвратов (`refundedAt`) и отмен (`cancelledAt`) |

Query-rows (в `Application.Abstractions.Queries`): `PeriodTotalsRow`,
`DailyAggregateRow`, `ManagerAggregateRow`, `CustomerAggregateRow`,
`ProductAggregateRow`, `CategoryAggregateRow`, `SaleFeedRow`, `LossAggregateRow`.

Портов записи нет: HTTP-контур read-only, а seed — инфраструктурная
инициализация, которая пишет в БД напрямую (§5.4).

### 4.4 Builder'ы блоков (по одному на блок `api.md`)

Каждый builder: получает query-rows → применяет доменные калькуляторы → отдаёт
read model. Пороги, `null` vs `0` и Δ делает builder, а ранжирование — общая
`IDatasetRankingPolicy`; в SQL сортировки нет (кроме ленты сделок).

| Интерфейс | Блок |
|---|---|
| `IKpiBuilder` | 1. KPI + Лучший менеджер |
| `IManagerRatingBuilder` | 2. Рейтинг менеджеров |
| `IManagerComparisonBuilder` | 3. Сравнение менеджеров |
| `ICustomerTopBuilder` | 4. Клиенты — Топ-10 |
| `ICustomerDynamicsBuilder` | 5. Динамика клиентов |
| `ITimeSeriesBuilder` | 6. Динамика во времени |
| `ICategoryBuilder` | 7. Категории |
| `IProductBuilder` | 8. Лучшие продукты |
| `IRecentSalesBuilder` | 9. Последние продажи |
| `IRefundBuilder` | 10. Возвраты |
| `ICancellationBuilder` | 11. Отмены |

### 4.5 Application read models

Корень и общие типы:

```
DashboardModel
├─ KpiModel                       (KpiCardModel ×5, BestManagerModel?)
├─ ManagerRatingModel             (DatasetModel<ManagerRatingItemModel>[])
├─ ManagerComparisonModel         (DatasetModel<ManagerComparisonItemModel>[])
├─ CustomerTopModel               (DatasetModel<CustomerTopItemModel>[])
├─ CustomerDynamicsModel          (DatasetModel<CustomerDynamicsItemModel>[])
├─ TimeSeriesModel                (DatasetModel<TimeSeriesPointModel>[])
├─ CategoriesModel                (DatasetModel<CategoryItemModel>[])
├─ ProductsModel                  (DatasetModel<ProductItemModel>[])
├─ RecentSalesModel               (SaleFeedItemModel[])
├─ RefundsModel                   (LossItemModel[], LossTailModel?, series)
└─ CancellationsModel             (LossItemModel[], LossTailModel?, series)

Общие: DatasetModel<T>(Name, Items), DeltaModel(Value, Unit),
       SeriesPointModel(Date, Value), ContributionModel(...), LossTailModel(...)
```

`DeltaModel.Unit` — `DeltaUnit { Percent = 1, Pp = 2 }` (прикладной enum; сериализуется
как число `1`/`2`).

---

## 5. Infrastructure — персистентность

### 5.1 Persistence entities (БД-сущности)

Единственные entity-классы в системе: повторяют таблицы `db.md`, статус не хранится,
справочные `price/cost` отделены от замороженных. Их создаёт seed и сохраняет через
EF Core; в read-путь они не попадают — порты читают сразу в query-rows.
Суффикс `Entity` выбран, а не `Record`: эти классы — изменяемые EF Core-сущности, а
`record` в C# означает неизменяемый тип и вводил бы в заблуждение.

`ManagerEntity`, `CustomerEntity`, `CategoryEntity`, `ProductEntity`,
`SaleEntity`, `SaleItemEntity`.

### 5.2 DbContext и конфигурации

| Класс | Ответственность |
|---|---|
| `SalesDbContext : DbContext` | `DbSet<>` по таблицам, применение конфигураций |
| `ManagerConfiguration` | маппинг + `ix_customers_segment` и пр. |
| `CustomerConfiguration`, `CategoryConfiguration`, `ProductConfiguration` | маппинг, `ix_products_sku` |
| `SaleConfiguration` | маппинг, покрывающие/частичные индексы `sales` |
| `SaleItemConfiguration` | маппинг, покрывающий индекс `sale_items` |

Все конфигурации реализуют `IEntityTypeConfiguration<TEntity>`. Индексы и типы —
строго по `db.md`.

### 5.3 Реализации портов чтения

Адаптеры к портам чтения Application. Реализаций записи нет (§4.3).

| Класс | Реализует |
|---|---|
| `EfKpiReadPort` | `IKpiReadPort` |
| `EfManagerReadPort` | `IManagerReadPort` |
| `EfCustomerReadPort` | `ICustomerReadPort` |
| `EfProductReadPort` | `IProductReadPort` |
| `EfCategoryReadPort` | `ICategoryReadPort` |
| `EfSaleFeedReadPort` | `ISaleFeedReadPort` |
| `EfLossReadPort` | `ILossReadPort` |

Агрегаты выполняются только через EF Core: LINQ `GroupBy` + `Sum`/`Count`/`Count(predicate)`
с `AsNoTracking`, проекцией сразу в query-row. Все выборки `db.md` (фильтр по дате,
группировка по менеджеру/клиенту/товару/категории/дню, условные счётчики, top-N)
выражаются LINQ и транслируются в один `GROUP BY`-запрос на порт.

### 5.4 Seed

Три класса с раздельными ролями: инициализация (когда), наполнение (что и как
сохранить), генерация (какие данные).

```
Startup (Program.cs)
   │
   ▼
DatabaseInitializer        # «когда»: миграции + точка входа в seed
   │  1. db.Database.MigrateAsync()
   │  2. await _seeder.SeedAsync()
   ▼
DatabaseSeeder : IDataSeeder   # «что и как сохранить»: идемпотентность + персистенция
   │  1. если продажи уже есть → выход (идемпотентность)
   │  2. var graph = _factory.Create()
   │  3. db.AddRange(graph); await db.SaveChangesAsync()
   ▼
SeedDataFactory            # «какие данные»: чистая детерминированная генерация
      Create() → граф persistence entities (без БД)
```

| Класс | Роль | Делает | Не делает |
|---|---|---|---|
| `DatabaseInitializer` | Startup-хук | применяет миграции, вызывает seeder | не генерирует и не сохраняет данные |
| `IDataSeeder` / `DatabaseSeeder` | Оркестратор наполнения | проверяет пустоту БД, вызывает фабрику, сохраняет через `SalesDbContext` | не знает, как устроены данные |
| `SeedDataFactory` | Генератор | детерминированно (фиксированный seed) строит граф entities: менеджеры, клиенты, категории, товары, 2–5k продаж, сезонность, отмены/возвраты | не обращается к БД, не решает «нужно ли» |

---

## 6. Api — представление

### 6.1 Контроллер

```csharp
[ApiController]
[Route("api/v1/dashboard")]
[Produces("application/json")]
public sealed class DashboardController : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<DashboardDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public Task<ActionResult<DashboardDto>> GetDashboard(
        [FromBody] DashboardRequest request,
        CancellationToken cancellationToken);   // привязывается к HttpContext.RequestAborted
}
```

Контроллер тонкий: валидация → маппинг в `DashboardQuery` → `IGetDashboardUseCase`
→ маппинг в `DashboardDto`. Никакой бизнес-логики.

`CancellationToken` — специальный параметр, который ASP.NET Core привязывает
автоматически из `HttpContext.RequestAborted`; он пробрасывается через use case в
EF Core (`ToListAsync(cancellationToken)`) и отменяет работу при разрыве соединения
клиентом.

Возвращаемые коды объявлены атрибутами `[ProducesResponseType]` (и служат
OpenAPI-документацией): `200` — `DashboardDto`, `400` — `ProblemDetails` при
невалидном запросе, `500` — `ProblemDetails` при непредвиденной ошибке. Набор
строго по `api.md`; отдельных кодов (`404`, `401`) нет — ресурс один, авторизации нет.

### 6.2 API DTO

Набор строго по `api.md`: `DashboardRequest`; `DashboardDto` и вложенные
`KpiDto`, `KpiCardDto`, `BestManagerDto`, `ManagerRatingDto`,
`ManagerComparisonDto`, `CustomerTopDto`, `CustomerDynamicsDto`, `TimeSeriesDto`,
`CategoriesDto`, `ProductsDto`, `RecentSalesDto`, `RefundsDto`, `CancellationsDto`;
общие `DeltaDto`, `SeriesPointDto`, `ContributionDto`, `DatasetDto<T>`,
`CategoryDatasetDto`.

**Enum'ы в DTO — прикладные, без дублирования.** `CustomerSegment`, `SaleStatus`,
`DeltaUnit`, `ContributionBasis` используются в DTO как есть: `System.Text.Json`
сериализует их числами, а числа в запросе биндит обратно в enum — отдельные
`*Dto`-enum'ы и маппер не нужны. Единственное, что нельзя доверить сериализатору:
при десериализации числа он не проверяет, что значение определено в enum
(`"segment": 4` → `(CustomerSegment)4`), поэтому валидатор проверяет
`Enum.IsDefined` (§6.3). `JsonStringEnumConverter` не подключается — контракт
`api.md` числовой.

### 6.3 Валидация

Валидация выполняется вручную — небольшим классом `DashboardRequestValidator`, без
внешней библиотеки. Обоснование: правил всего четыре, а контракт `api.md` требует
собственного `ProblemDetails` с массивом `errors[]` (`field`, `code` вида
`PERIOD_INVALID_ORDER`). FluentValidation/DataAnnotations отдают собственную форму
ошибок, поэтому маппинг в нужный контракт пришлось бы писать вручную в любом случае
— библиотека не убрала бы работу, а добавила зависимость и слой (против
`specification.md`, §7, §20).

Правила: `from`/`to` обязательны и валидны (`PERIOD_REQUIRED`); `from <= to`
(`PERIOD_INVALID_ORDER`); `segment` входит в enum (`SEGMENT_INVALID`) — проверка
через `Enum.IsDefined`, т.к. сериализатор числа не валидирует (§6.2). Валидатор
возвращает список ошибок
`(field, code, message)`, контроллер на их основе формирует `400` с `ProblemDetails`
(`api.md`, «Ошибки»). Невалидный JSON отсекает input formatter до валидатора
(`Request body is not valid JSON`).

### 6.4 Мапперы API

| Интерфейс / класс | Направление |
|---|---|
| `IApiMapper<TSource, TTarget>` | контракт |
| `DashboardRequestMapper` | `DashboardRequest` → `DashboardQuery` |
| `DashboardResponseMapper` | `DashboardModel` → `DashboardDto` |
| `KpiDtoMapper`, `ManagerRatingDtoMapper`, `LossDtoMapper` и др. | read model → вложенный DTO |

Маппера для enum'ов нет — они переносятся как есть и сериализуются числами (§6.2).

### 6.5 Обработка ошибок

`400` формируется контроллером по результату валидатора (§6.3) — исключение для
этого не бросается. `GlobalExceptionHandler : IExceptionHandler` отвечает только за
непредвиденные ошибки: `500` с `ProblemDetails` (RFC 7807) без деталей. Формат —
по `api.md`. Доменных исключений нет (§3.3).

`OperationCanceledException` (в т.ч. `TaskCanceledException`) handler **пропускает**
и не превращает в `ProblemDetails` — это штатное завершение по отмене (§6.6).

### 6.6 Политика отмены

Отмена **кооперативная и сквозная**: `CancellationToken` идёт от
`HttpContext.RequestAborted` через `GetDashboardUseCase` и builder'ы в каждый вызов
порта, а затем в EF Core (`ToListAsync(ct)`, `CountAsync(ct)`). Npgsql регистрирует
отмену и отправляет в PostgreSQL сигнал прерывания запроса — вычисление
останавливается на сервере БД, а не после получения всего результата.

| Событие | Поведение |
|---|---|
| Клиент разорвал соединение | `RequestAborted` отменяется → генерация останавливается; ответ не отправляется (отправлять некому); частичный `DashboardModel` не возвращается |
| `OperationCanceledException` | Пропускается `GlobalExceptionHandler`, не маппится в `400`/`500`; логируется уровнем `Debug`, не `Error` |
| Отмена между builder'ами | `ThrowIfCancellationRequested` перед очередным шагом не даёт начать следующий блок |
| Отмена внутри запроса | CT уходит в EF Core/Npgsql, запрос прерывается на стороне PostgreSQL |

**Правила реализации.** CT передаётся во все async-вызовы;

**Серверного таймаута нет.** Генерация ограничена стоимостью запросов к БД (доли
секунды, §5.3); клиент, переставший ждать, отменяется собственным `RequestAborted`.
Отдельный лимит времени потребовал бы ответа `504`, которого нет в контракте
`api.md` (там только `400`/`500`) — вводить его ради тестового сценария не
оправдано. Решение можно добавить позже через встроенный `RequestTimeouts`
middleware, синхронно расширив `api.md`.

### 6.7 Composition root

`Program.cs` + extension-методы `AddApplication()`, `AddInfrastructure(config)`,
`AddApi()`; регистрация use case, builder'ов, реализаций портов, мапперов. OpenAPI
генерируется из `[ProducesResponseType]`/DTO и отдаётся интерактивным Swagger UI
(`Swashbuckle.AspNetCore`, `/swagger`) для ручной проверки контракта `api.md`.

---

## 7. Поток выполнения запроса

```
POST /api/v1/dashboard  (DashboardRequest)
        │
        ▼
DashboardController
        │  1. DashboardRequestValidator      → 400 при ошибке
        │  2. DashboardRequestMapper         (API DTO → DashboardQuery)
        ▼
GetDashboardUseCase  (Application)
        │
        ├─ KpiBuilder ────────────┐
        ├─ ManagerRatingBuilder   │  доменные калькуляторы:
        ├─ ManagerComparisonBuilder│  ISaleStatusResolver, IPeriodResolver,
        ├─ CustomerTopBuilder     │  IResultMetricsCalculator, ILossRateCalculator,
        ├─ CustomerDynamicsBuilder│  IDeltaCalculator,
        ├─ TimeSeriesBuilder      │  IContributionCalculator, IDatasetRankingPolicy
        ├─ CategoryBuilder        │  порты чтения (query-rows):
        ├─ ProductBuilder         │  IKpiReadPort, IManagerReadPort, ...
        ├─ RecentSalesBuilder     │
        ├─ RefundBuilder          │        │
        └─ CancellationBuilder ───┘        ▼
                                   Ef*ReadPort → SalesDbContext → PostgreSQL
        │
        ▼
DashboardModel  (Application read model)
        │  3. DashboardResponseMapper       (read model → API DTO)
        ▼
200 OK  DashboardDto
```

Разделение обязанностей по вычислениям:

| Где | Что считается |
|---|---|
| SQL / EF Core | только сырые суммы и счётчики (Revenue, Cost, count, refund/cancel count, дневные суммы) |
| Domain-калькуляторы | отношения (Margin, AC, доли), Δ, вклады, статус, предыдущий период, сортировка |
| Builder | композиция блока, пороги, `null` vs `0`, формат датасетов, ранжирование через `IDatasetRankingPolicy` |
| Api | только сериализация в контракт `api.md` |

`ORDER BY` в SQL — только для ленты «Последние продажи» (`paidAt DESC` + `LIMIT`);
сортировка датасетов по производным метрикам выполняется в домене (обоснование —
§3.2).

`ct` пробрасывается через весь путь (Controller → UseCase → Builder → Ef*ReadPort →
EF Core) и проверяется перед каждым builder'ом; при отмене путь обрывается на любом
шаге без возврата частичного результата (§6.6).

---

## 8. SOLID

- **SRP** — builder на блок; маппер на одну пару моделей; адаптер на один порт.
- **OCP** — новый блок дашборда = новый read-порт + builder + read model + DTO +
  маппер. Существующие классы не меняются.
- **LSP** — `Ef*ReadPort` полностью заменяемы на in-memory/fake в тестах.
- **ISP** — порты чтения дробные; builder видит только свои методы.
- **DIP** — Application объявляет `IKpiReadPort` и т.п.; Infrastructure реализует;
  Api и builder'ы зависят от абстракций, не от EF Core.

---

## 9. Тестируемость

| Уровень | Что проверяется (`specification.md`, §12) |
|---|---|
| Domain.Tests | статус (`ISaleStatusResolver`), формулы метрик, предыдущий период, tie-break, Δ и пороги |
| Application.Tests | builder'ы на fake-портах: KPI, рейтинг, фильтр периода, `null` vs `0`, пустой период; отмена по CT не отдаёт частичный результат |
| Api.Tests | контракт `POST /api/v1/dashboard`, валидация → `400`, формат `ProblemDetails`, числовые значения enum соответствуют `api.md`, согласованность seed-дат |

Домен и builder'ы тестируются без БД; EF-запросы — на `WebApplicationFactory` с
PostgreSQL-контейнером или на seed-данных.

---

## 10. Сознательно не делаем

- CQRS-шину, медиаторы, Event Sourcing — нет задачи.
- Параллельные builder'ы через `IDbContextFactory` — последовательных запросов
  достаточно, `DbContext` не потокобезопасен (§4.2).
- Серверный таймаут запроса — контракт `api.md` знает только `400`/`500` (§6.6).
- Dapper и второй стек доступа к данным — EF Core покрывает все агрегаты (§5.3).
- Write-операции и CRUD сделок — контур read-only, данные приходят из seed.
- Отдельные DTO-проекты и «слои ради слоёв» (`specification.md`, §20).
- Авторизацию/JWT (`specification.md`, §13).
- Кэш и распределённые вычисления — вне scope.
