# План реализации backend

**Статус:** на проверке — реализация не начата.

Контекст: `docs/backend.md` (архитектура), `docs/domain.md` (бизнес-правила),
`docs/db.md` (схема и индексы), `docs/api.md` (контракт), `docs/specification.md`
(требования задания).

Границы: backend (`backend/` со solution и всеми проектами, включая тестовые
`SalesDashboard.*.Tests`) и docker-обвязка его запуска (`postgres` + `backend`).
Frontend и его контейнер — вне плана.

---

## Шаги

1. **Solution и проекты.** `backend/SalesDashboard.sln` (.NET 8): проекты Domain,
   Application, Infrastructure, Api и тестовые `SalesDashboard.Domain.Tests`,
   `SalesDashboard.Application.Tests`, `SalesDashboard.Api.Tests` (xUnit) — все в
   корне `backend/`; ссылки по `backend.md` §2 (Api → Infrastructure только ради
   DI).
2. **Domain: типы-контракты.** Value Objects `Money`, `DateRange` (guard
   `From ≤ To`), `MetricThresholds`; enum'ы `CustomerSegment`, `SaleStatus`,
   `RankingMetric`, `ContributionBasis`. Числовые значения enum'ов — часть
   wire-контракта: `ContributionBasis` — `GrossProfit = 1`, `Revenue = 2`,
   `Units = 3`, `AverageCheck = 4` (`backend.md` §3.1, `api.md`).
3. **Domain: сервисы.** `SaleStatusResolver`, `PeriodResolver`,
   `ResultMetricsCalculator`, `LossRateCalculator`, `DeltaCalculator`,
   `ContributionCalculator`, `DatasetRankingPolicy` (tie-break: менеджеры —
   Revenue, затем имя; остальные — имя A→Я).
4. **Application: модели.** `DashboardQuery`, read models (`DashboardModel`,
   11 блоков, `DatasetModel<T>`, `DeltaModel` + `DeltaUnit`, `SeriesPointModel`,
   `ContributionModel`, `LossTailModel`) и query-rows (`PeriodTotalsRow`,
   `DailyAggregateRow`, `ManagerAggregateRow`, `CustomerAggregateRow`,
   `ProductAggregateRow`, `CategoryAggregateRow`, `SaleFeedRow`,
   `LossAggregateRow`).
5. **Application: порты и builder'ы.** Дробные порты чтения (`IKpiReadPort`,
   `IManagerReadPort`, `ICustomerReadPort`, `IProductReadPort`, `ICategoryReadPort`,
   `ISaleFeedReadPort`, `ILossReadPort`), 11 builder'ов и `GetDashboardUseCase` —
   последовательная оркестрация на scoped `DbContext`,
   `ThrowIfCancellationRequested` перед каждым шагом.
6. **Infrastructure: персистентность.** 6 persistence entities, `SalesDbContext`,
   конфигурации с типами и индексами строго по `db.md` (покрывающие/частичные:
   `ix_sales_paid_at`, `ix_sales_manager_paid`, `ix_sales_customer_paid`,
   `ix_sales_refunded_at`, `ix_sales_cancelled_at`, `ix_sale_items_sale_id`,
   `ix_sale_items_product_id`, `ix_customers_segment`, `ix_products_sku`).
7. **Infrastructure: EF-адаптеры портов.** `EfKpiReadPort`, `EfManagerReadPort`,
   `EfCustomerReadPort`, `EfProductReadPort`, `EfCategoryReadPort`,
   `EfSaleFeedReadPort`, `EfLossReadPort` — `AsNoTracking`, проекция сразу в
   query-row, один `GROUP BY`-запрос на порт, без N+1; проверка генерируемого
   SQL по логам.
8. **Infrastructure: seed.** `DatabaseInitializer` (миграции + вызов seeder),
   `IDataSeeder`/`DatabaseSeeder` (идемпотентность по наличию продаж),
   `SeedDataFactory` (детерминированный seed: 15–25 менеджеров, 50–100 клиентов,
   категории, десятки товаров, 2–5k продаж за 12 месяцев, сезонность, сильные и
   слабые менеджеры, отмены/возвраты, периоды без продаж).
9. **Миграция.** Создать initial EF Core миграцию и сверить схему с `db.md`
   (типы, FK, индексы).
10. **Api: DTO и мапперы.** DTO строго по `api.md` (`DashboardRequest`,
    `DashboardDto` и вложенные, общие `DeltaDto`, `SeriesPointDto`,
    `ContributionDto`, `DatasetDto<T>`, `CategoryDatasetDto`) и мапперы
    (`DashboardRequestMapper`, `DashboardResponseMapper`, вложенные).
11. **Api: валидация и ошибки.** `DashboardRequestValidator` (обязательность
    `from`/`to` → `PERIOD_REQUIRED`, `from ≤ to` → `PERIOD_INVALID_ORDER`,
    `segment ∈ enum` → `SEGMENT_INVALID`), `ProblemDetails` 400 с `errors[]`,
    обработка невалидного JSON, `GlobalExceptionHandler` (500 без деталей,
    пропускает `OperationCanceledException`), тонкий `DashboardController`.
12. **Api: composition root.** `Program.cs`, `AddApplication` /
    `AddInfrastructure` / `AddApi`, OpenAPI + Swagger UI
    (`Swashbuckle.AspNetCore`) на `/swagger`, строка подключения к PostgreSQL,
    сквозной `CancellationToken` из `HttpContext.RequestAborted`.
13. **Тесты.** Domain.Tests (статус, формулы, предыдущий период, tie-break, Δ,
    пороги, границы дат); Application.Tests (builder'ы на fake-портах: KPI,
    рейтинг, `null` vs `0`, пустой период, отмена CT без частичного результата);
    Api.Tests (`WebApplicationFactory` + PostgreSQL-контейнер: контракт
    `POST /api/v1/dashboard`, 400/`ProblemDetails`, числовые enum,
    согласованность seed-дат).
14. **Docker.** `Dockerfile` backend (multi-stage, .NET 8) и `docker-compose.yml`
    (postgres + backend, healthcheck БД, depends_on) с автоприменением миграций
    и seed при старте.
15. **End-to-end.** `docker compose up --build`, вызов `POST /api/v1/dashboard`
    и сверка ответа с `api.md`; edge cases — пустой период, границы `from`/`to`,
    segment-фильтр, период только с отменами, возврат по заказу прошлого
    периода.

---

## Согласованные решения

- **`ContributionBasis` / `ContributionUnit`.** Числовые значения — по
  `backend.md` §3.1: `GrossProfit = 1`, `Revenue = 2`, `Units = 3`,
  `AverageCheck = 4`; `api.md` приведён в соответствие. Имена элементов не
  меняются, в JSON передаются только числа.
- **`segment` вне enum → `400`.** Значение вне `1..3` отвергается
  (`SEGMENT_INVALID`); из `api.md` удалена формулировка о приравнивании
  невалидного значения к `null`.
- **`from`/`to` отсутствуют, `null` или невалидны → `PERIOD_REQUIRED`.**
  Код добавлен в `api.md` (колонка `code` в таблице ошибок) и `backend.md` §6.3.
- **Отмена** — кооперативная и сквозная: `CancellationToken` идёт от
  `HttpContext.RequestAborted` до EF Core; частичный `DashboardModel` не
  возвращается.
