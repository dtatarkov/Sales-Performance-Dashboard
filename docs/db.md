# Схема базы данных

PostgreSQL. ORM — Entity Framework Core (Code First, миграции). Все идентификаторы — UUID. Денежные значения — `numeric(18,2)`. Даты — `timestamptz` (UTC).

---

## ER-диаграмма

```
┌────────────┐       ┌────────────┐       ┌──────────────┐
│  managers  │──1:N──│   sales    │──1:N──│  sale_items  │
└────────────┘       └────────────┘       └──────┬───────┘
                          │                       │
                         N:1                     N:1
                          │                       │
                     ┌────┴─────┐           ┌─────┴────┐
                     │customers │           │ products │
                     └──────────┘           └─────┬────┘
                                                  │ N:1
                                            ┌─────┴─────┐
                                            │ categories│
                                            └───────────┘
```

---

## Таблицы

### managers

Менеджер отдела продаж — субъект, чья результативность оценивается дашбордом.

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `uuid` | PK | Уникальный идентификатор |
| `name` | `varchar(200)` | NOT NULL | Полное имя менеджера |
| `team` | `varchar(100)` | NOT NULL | Команда (группировка/фильтрация) |
| `position` | `varchar(100)` | NOT NULL | Должность |
| `active` | `boolean` | NOT NULL, DEFAULT `true` | Признак активности |
| `avatar` | `varchar(500)` | NULL | Ссылка на аватар |
| `initials` | `varchar(10)` | NOT NULL | Инициалы (фолбэк для аватара) |

**Индексы:** нет.

> Менеджеров 15–25 строк — планировщик в любом случае выберет seq scan, индекс на булевом `active` (два значения) использоваться не будет. Метрики по менеджерам агрегируются из `sales`, а не сканированием `managers`.

---

### customers

Клиент — покупатель товаров.

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `uuid` | PK | Уникальный идентификатор |
| `name` | `varchar(200)` | NOT NULL | Название клиента |
| `company` | `varchar(200)` | NOT NULL | Компания |
| `segment` | `smallint` | NOT NULL | Сегмент: `1` = Enterprise, `2` = Mid-market, `3` = SMB (small and medium business, малый и средний бизнес) |
| `since` | `smallint` | NOT NULL | Год начала работы с клиентом |

**Индексы:**
- `ix_customers_segment` на `(segment)` — глобальный фильтр по сегменту применяется к каждому запросу дашборда.

> При 50–100 клиентах планировщик, скорее всего, просканирует `customers` целиком и сделает hash join — индекс начнёт работать только с ростом таблицы. Оставлен как дешёвый задел: `segment` — реальный фильтр каждого запроса, так что у индекса есть раскрывающийся смысл, а редкие записи делают его бесплатным.

---

### categories

Категория товаров — верхний уровень товарной классификации.

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `uuid` | PK | Уникальный идентификатор |
| `name` | `varchar(100)` | NOT NULL, UNIQUE | Название категории |

---

### products

Товар — позиция каталога, участвующая в продажах.

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `uuid` | PK | Уникальный идентификатор |
| `name` | `varchar(300)` | NOT NULL | Маркетинговое название товара |
| `sku` | `varchar(50)` | NOT NULL, UNIQUE | Артикул (Stock Keeping Unit) |
| `category_id` | `uuid` | FK → categories.id, NOT NULL | Принадлежность категории |
| `price` | `numeric(18,2)` | NOT NULL | Текущая цена продажи (справочник) |
| `cost` | `numeric(18,2)` | NOT NULL | Текущая закупочная цена (справочник) |

> **Примечание.** `price` и `cost` — справочные значения каталога. Метрики дашборда считаются исключительно из замороженных `sale_items.sale_price` / `sale_items.unit_cost`.

**Индексы:**
- `ix_products_sku` UNIQUE на `(sku)` — уникальность артикула (обеспечивается самим ограничением, не опционален).

> Индекс на `category_id` не нужен: товаров несколько десятков строк, в запросах дашборда `products` — мелкая сторона hash join (обогащение позиций категорией), а не driving-таблица с поиском по категории.

---

### sales

Продажа — головной документ сделки. Статус является производной величиной от дат событий и **не хранится** в БД (вычисляется на уровне приложения).

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `uuid` | PK | Уникальный идентификатор |
| `manager_id` | `uuid` | FK → managers.id, NOT NULL | Ответственный менеджер |
| `customer_id` | `uuid` | FK → customers.id, NOT NULL | Покупатель |
| `created_at` | `timestamptz` | NOT NULL | Дата создания сделки менеджером |
| `paid_at` | `timestamptz` | NULL | Дата оплаты |
| `refunded_at` | `timestamptz` | NULL | Дата возврата |
| `cancelled_at` | `timestamptz` | NULL | Дата отмены |

**Производный статус (не колонка):**

| `paid_at` | `refunded_at` | `cancelled_at` | Статус |
|---|---|---|---|
| NOT NULL | NULL | NULL | `Paid` |
| NOT NULL | NOT NULL | NULL | `Refunded` |
| NULL | NULL | NOT NULL | `Cancelled` |

**Индексы:**

- `ix_sales_paid_at` на `(paid_at) INCLUDE (manager_id, customer_id, refunded_at)` — основная когорта оплаты. Покрывает большинство блоков: KPI, динамику во времени, рейтинг и сравнение менеджеров, топы клиентов, знаменатель Cancellation Rate, когорту Refund Rate. Покрывающий индекс даёт index-only scan: фильтр по периоду, группировки по менеджеру/клиенту и признак возврата читаются из индекса без обращения к таблице.
- `ix_sales_manager_paid` на `(manager_id, paid_at)` — метрики одного менеджера за период: карточка «Лучший менеджер» и её sparkline, доля отмен менеджера, Δ по менеджеру. Отдельный индекс на `manager_id` не нужен — он префикс этого.
- `ix_sales_customer_paid` на `(customer_id, paid_at)` — метрики одного клиента за период: топ клиентов, динамика клиентов. Отдельный индекс на `customer_id` не нужен — префикс этого.
- `ix_sales_refunded_at` на `(refunded_at) INCLUDE (id) WHERE refunded_at IS NOT NULL` — событийный блок «Возвраты»: сумма, дневной ряд, когорты Refund Rate по товарам/клиентам (join к `sale_items` по `id`).
- `ix_sales_cancelled_at` на `(cancelled_at) INCLUDE (id, manager_id) WHERE cancelled_at IS NOT NULL` — событийный блок «Отмены»: сумма, дневной ряд, топ менеджеров, числитель Cancellation Rate.

> «Последние продажи» (`WHERE paid_at ∈ [from, to] ORDER BY paid_at DESC LIMIT ~20`) используют обратный скан `ix_sales_paid_at` — отдельный индекс не нужен.

---

### sale_items

Позиция продажи — атомарная единица суммирования всех денежных метрик.

| Колонка | Тип | Ограничения | Описание |
|---|---|---|---|
| `id` | `uuid` | PK | Уникальный идентификатор позиции |
| `sale_id` | `uuid` | FK → sales.id, NOT NULL | Принадлежность продаже |
| `product_id` | `uuid` | FK → products.id, NOT NULL | Товар |
| `quantity` | `integer` | NOT NULL, CHECK > 0 | Количество единиц |
| `sale_price` | `numeric(18,2)` | NOT NULL | Замороженная цена продажи за единицу |
| `unit_cost` | `numeric(18,2)` | NOT NULL | Замороженная себестоимость единицы |

> **Примечание.** `sale_price` и `unit_cost` — замороженные значения на момент сделки. Именно из них считаются Revenue, Cost, Gross Profit. Справочные `products.price`/`cost` в расчётах не участвуют.

**Индексы:**
- `ix_sale_items_sale_id` на `(sale_id) INCLUDE (product_id, quantity, sale_price, unit_cost)` — самый горячий join дашборда (`sales` → позиции). Покрывающий: все денежные агрегации — Revenue, Cost, GP, проданные штуки, суммы возвратов и отмен — считаются из индекса (index-only scan), без чтения самой таблицы.
- `ix_sale_items_product_id` на `(product_id)` — агрегации по товарам, когда driving-таблица — `products`: topProducts по количеству, возвраты по товарам.

---

## Итоговая сводка индексов

| Таблица | Индекс | Колонки | Покрываемые запросы |
|---|---|---|---|
| customers | `ix_customers_segment` | `(segment)` | Глобальный фильтр по сегменту (задел на рост) |
| products | `ix_products_sku` | `(sku)` UNIQUE | Уникальность артикула (ограничение) |
| sales | `ix_sales_paid_at` | `(paid_at) INCLUDE (manager_id, customer_id, refunded_at)` | KPI, timeSeries, рейтинг/сравнение, топы клиентов, feed, знаменатель Cancellation Rate, когорта Refund Rate |
| sales | `ix_sales_manager_paid` | `(manager_id, paid_at)` | Лучший менеджер, метрики и Δ одного менеджера |
| sales | `ix_sales_customer_paid` | `(customer_id, paid_at)` | Топ клиентов, динамика клиентов |
| sales | `ix_sales_refunded_at` | `(refunded_at) INCLUDE (id) WHERE NOT NULL` | Блок «Возвраты»: сумма, ряд, топ товаров |
| sales | `ix_sales_cancelled_at` | `(cancelled_at) INCLUDE (id, manager_id) WHERE NOT NULL` | Блок «Отмены»: сумма, ряд, топ менеджеров |
| sale_items | `ix_sale_items_sale_id` | `(sale_id) INCLUDE (product_id, quantity, sale_price, unit_cost)` | Все денежные агрегации (Revenue, Cost, GP, units) |
| sale_items | `ix_sale_items_product_id` | `(product_id)` | Топ продуктов, возвраты по товарам |

### Запросы дашборда → индексы

Каждый блок API отфильтровывает `sales` по одной из дат и группирует по измерению; ниже — какой индекс обслуживает какой запрос (`api.md`, блоки 1–11).

| Запрос | Фильтр | Группировка | Индекс |
|---|---|---|---|
| KPI-карточки, sparkline | `paid_at ∈ [from, to]` | день | `ix_sales_paid_at` |
| Динамика во времени (текущ. и пред. период) | `paid_at ∈ [from, to]` | день | `ix_sales_paid_at` |
| Рейтинг / сравнение менеджеров | `paid_at ∈ [from, to]` | `manager_id` | `ix_sales_paid_at` (index-only) |
| Лучший менеджер, Δ менеджера | `manager_id` + период | день | `ix_sales_manager_paid` |
| Топ клиентов, динамика клиентов | `customer_id` + период | `customer_id` | `ix_sales_customer_paid` |
| Refund Rate (когорта оплаты) | `paid_at ∈ [from, to] AND refunded_at IS NOT NULL` | товар/клиент/итог | `ix_sales_paid_at` (INCLUDE `refunded_at`) |
| Cancellation Rate | `cancelled_at ∈ [from, to]` / `paid_at ∈ [from, to]` | менеджер/итог | `ix_sales_cancelled_at` + `ix_sales_paid_at` |
| Возвраты: сумма, ряд, топ товаров | `refunded_at ∈ [from, to]` → `sale_items` | товар | `ix_sales_refunded_at` + `ix_sale_items_sale_id` |
| Отмены: сумма, ряд, топ менеджеров | `cancelled_at ∈ [from, to]` → `sale_items` | менеджер | `ix_sales_cancelled_at` + `ix_sale_items_sale_id` |
| Категории | когорта оплаты → `sale_items` → `products` | `category_id` | `ix_sales_paid_at` + `ix_sale_items_sale_id` |
| Лучшие продукты | когорта оплаты → `sale_items` | `product_id` | `ix_sale_items_sale_id` / `ix_sale_items_product_id` |
| Последние продажи | `paid_at ∈ [from, to]`, `ORDER BY paid_at DESC LIMIT 20` | — | обратный скан `ix_sales_paid_at` |

### Намеренно не заведены

| Кандидат | Почему нет |
|---|---|
| `ix_managers_active` | 15–25 строк, два значения — seq scan быстрее индекса |
| `ix_sales_manager_id`, `ix_sales_customer_id` | префиксы композитных `(manager_id, paid_at)` / `(customer_id, paid_at)` — дубли |
| `ix_products_category_id` | десятки строк, `products` — мелкая сторона hash join |
| Индекс на `created_at` | `created_at` не участвует ни в одном фильтре метрик (`domain.md`, «Роли дат»), в feed сортировка по дате сделки идёт по когорте |

---

## Решения и обоснования

| Решение | Обоснование |
|---|---|
| UUID вместо serial | Стабильные внешние ключи, совместимость с seed, отсутствие коллизий при репликации |
| `timestamptz` (UTC) | Все метрики работают в UTC, нет DST-проблем |
| Статус не хранится | Исключает рассинхронизацию; выводится из дат — единственный источник правды |
| `numeric(18,2)` для денег | Точность без ошибок float; 18 знаков покрывают любые B2B-суммы |
| Замороженные цены в `sale_items` | Метрики не меняются при обновлении прайса; история неизменна |
| ENUM-сегмент как `smallint` | EF Core маппит enum на smallint; компактно, читаемо в SQL |
| Инварианты в доменном слое | Матрица статусов, порядок дат и правила жизненного цикла обеспечиваются методами `Sale` и юнит-тестами; явные `CHECK`-ограничения отсутствуют, чтобы избежать дублирования бизнес-логики и накладных расходов на миграции при изменении правил |
| Покрывающие индексы (`INCLUDE`) | Агрегатные запросы дашборда читают небольшой фиксированный набор колонок; INCLUDE даёт index-only scan и снимает нагрузку с heap |
| Композитные `(id_fk, paid_at)` вместо одиночных FK-индексов | Один индекс обслуживает и «все сделки менеджера/клиента», и «сделки менеджера/клиента за период»; одиночный FK-индекс — его префикс, дубль не нужен |
| Частичные индексы на `refunded_at`/`cancelled_at` | Большинство строк — `Paid` (NULL в этих колонках); частичный индекс компактнее полного |
| Нет индексов на `managers`, `categories` и `products.category_id` | Таблицы штучных/десятков строк — планировщик их не использует; индекс только там, где есть отбор (`specification.md`, §8: «индексы там, где они действительно нужны») |

### Маппинг в EF Core

Покрывающие и частичные индексы настраиваются во Fluent API:

```csharp
modelBuilder.Entity<Sale>().HasIndex(s => s.PaidAt)
    .HasDatabaseName("ix_sales_paid_at")
    .IncludeProperties(s => new { s.ManagerId, s.CustomerId, s.RefundedAt });

modelBuilder.Entity<Sale>().HasIndex(s => s.RefundedAt)
    .HasDatabaseName("ix_sales_refunded_at")
    .HasFilter("refunded_at IS NOT NULL")
    .IncludeProperties(s => s.Id);

modelBuilder.Entity<SaleItem>().HasIndex(i => i.SaleId)
    .HasDatabaseName("ix_sale_items_sale_id")
    .IncludeProperties(i => new { i.ProductId, i.Quantity, i.SalePrice, i.UnitCost });
```
