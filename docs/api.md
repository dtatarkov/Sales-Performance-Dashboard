# Sales Performance Dashboard — контракт API (api.md)

REST API дашборда аналитики продаж. Все вычисления метрик, Δ, долей и вкладов
выполняются на сервере; клиент получает готовые числа.

---

## Соглашения

### Формат и типы

- Базовый URL: **`/api/v1/dashboard`**.
- Ответы — `application/json`, именование полей **camelCase**.
- В схемах DTO используются такие типы JSON:

  | Тип | JSON | Пояснение |
  |---|---|---|
  | `datetime` | string, ISO 8601 UTC (`2026-09-17T00:00:00Z`) | Момент времени. Все даты — datetime, без исключений |
  | `number` | number | Число: денежное значение, количество, доля, кратность или счётчик |
  | `string` | string | Текст для отображения |
  | `uuid` | string | Идентификатор сущности (стабильный ключ) |
  | `enum` | number | Число из фиксированного набора значений (см. справочник ниже) |
  | `T[]` | array | Массив элементов типа `T` |
  | `X \| null` | value \| null | Поле опционально по смыслу: `null` — «не определено» |

- Денежные значения — числа без единиц (`4250000`); символ валюты и разделители
  добавляет клиент.
- Доли и кратность — числа в тех единицах, что описаны у поля (проценты как
  `26.2`, а не `0.262`; кратность как `1.7`).
- Ошибки — `application/problem+json` (RFC 7807, `ProblemDetails`).
- Авторизации нет (scope тестового задания).

### Конвенция `null` vs `0`

Сквозное правило «Неопределено ≠ реальный ноль» проводится через весь API:

- `null` — метрика не определена (пустой знаменатель, выборка ниже минимума, нет
  данных);
- `0` — реальный ноль (продаж не было → `0 ₽`, отмен нет → `0`);
- `delta: null` — Δ не вычисляется (базовый период пуст или данных недостаточно).

### Справочник enum-значений

Все enum-значения — числа. Текст в комментарии — пояснение для разработчика,
в JSON передаётся только число.

| Enum | Значение | Пояснение |
|---|:--:|---|
| `Segment` | `1` | `Enterprise` — крупный бизнес |
| | `2` | `Mid-market` — средний бизнес |
| | `3` | `SMB` — малый и средний бизнес (small and medium business) |
| `DeltaUnit` | `1` | `percent` — относительная Δ, суффикс `%` |
| | `2` | `pp` — дельта доли, суффикс `п.п.` |
| `ContributionUnit` | `1` | `gp` — «от ВП» |
| | `2` | `revenue` — «от выручки» |
| | `3` | `units` — «от объёма» |
| | `4` | `ac` — «× к СЧ» |
| `SaleStatus` | `1` | `paid` — оплачена |
| | `2` | `refunded` — возврат |
| | `3` | `cancelled` — отменена |

---

## POST /api/v1/dashboard

Один запрос — весь дашборд за выбранный период и сегмент.

Метод **POST** выбран потому, что запрос описывает не получение ресурса по
идентификатору, а **вычислительную операцию** над произвольным срезом данных.

### Тело запроса — `DashboardRequest`

```json
{
  "from": "2026-09-17T00:00:00Z",
  "to": "2026-09-24T00:00:00Z",
  "segment": 1
}
```

| Поле | Тип | Обязательный | Смысл |
|---|---|---|:--:|---|
| `from` | `datetime` | ✅ | Начало активного периода. Граница включается (`domain.md`, «Активный период») |
| `to` | `datetime` | ✅ | Конец активного периода. Граница **не включается** — период задан полуинтервалом `[from, to)` |
| `segment` | `enum Segment` | ➖ | Фильтр по сегменту клиента. Отсутствует или `null` = все сегменты |

**Валидация:** `from`, `to` — обязательные `datetime`, `from < to`; `segment` — только
значения enum (`1`, `2`, `3`), значение вне набора — `400` (`SEGMENT_INVALID`). Пустой
(`from >= to`) или невалидный период **не допускается** — сервер отвечает `400` с `ProblemDetails`
(см. «Ошибки»).

**Предыдущий сопоставимый период вычисляется сервером** по правилам `domain.md` из
`from`/`to` и в запросе не передаётся.

### Схема ответа — `DashboardDto` (корень)

| Поле | Тип | Смысл |
|---|---|---|
| `kpi` | `KpiDto` | Блок 1 — KPI-карточки |
| `managerRating` | `ManagerRatingDto` | Блок 2 — Рейтинг менеджеров |
| `managerComparison` | `ManagerComparisonDto` | Блок 3 — Сравнение менеджеров |
| `topCustomers` | `CustomerTopDto` | Блок 4 — Клиенты — Топ-10 |
| `customerDynamics` | `CustomerDynamicsDto` | Блок 5 — Динамика клиентов |
| `timeSeries` | `TimeSeriesDto` | Блок 6 — Динамика во времени |
| `categories` | `CategoriesDto` | Блок 7 — Продажи по категориям |
| `topProducts` | `ProductsDto` | Блок 8 — Лучшие продукты |
| `recentSales` | `RecentSalesDto` | Блок 9 — Последние продажи |
| `refunds` | `RefundsDto` | Блок 10 — Возвраты |
| `cancellations` | `CancellationsDto` | Блок 11 — Отмены |

Поля присутствуют всегда; при отсутствии данных блоки возвращают свои пустые
значения (`null`-метрики, пустые массивы) — структура ответа стабильна, клиент не
проверяет наличие секций.

---

## Общие (переиспользуемые) DTO

### `DeltaDto`

Изменение метрики к предыдущему сопоставимому периоду (`domain.md`, «Изменение к
предыдущему периоду»). Всё поле `delta` равно `null`, если Δ не вычисляется (базовый
период пуст или данных недостаточно).

| Поле | Тип | Смысл |
|---|---|---|
| `value` | `number` | Величина Δ. Знак задаёт направление (отрицательная = вниз) |
| `unit` | `enum DeltaUnit` | `1` → суффикс `%` (относительная Δ); `2` → `п.п.` (дельта доли-процента) |

### `SeriesPointDto`

Точка временного ряда.

| Поле | Тип | Смысл |
|---|---|---|
| `value` | `number` | Значение метрики в точке (день) |
| `date` | `datetime` | Дата точки |

### `ContributionDto`

Вклад элемента в результат периода — три формы одного значения.

| Поле | Тип | Смысл |
|---|---|---|
| `valueAbsolute` | `number` | Абсолютное значение метрики |
| `valueRelative` | `number` | Относительный вклад: доля (`26.2`) или кратность (`1.7`) |
| `valueRelativeUnit` | `enum ContributionUnit` | Единица измерения `valueRelative` |
| `valueNormalized` | `number` | Нормализованное значение, 0–100 (масштабировано к максимуму группы, не доля) |

### `DatasetDto<T>`

Именованный датасет — набор элементов, отсортированных по метрике датасета.

| Поле | Тип | Смысл |
|---|---|---|
| `name` | `string` | Название метрики датасета |
| `items` | `T[]` | Элементы, отсортированы по метрике датасета (по убыванию) |

---

## Блок 1. `KpiDto` — KPI-карточки

| Поле | Тип | Смысл |
|---|---|---|
| `revenue` | `KpiCardDto` | Выручка |
| `gp` | `KpiCardDto` | Валовая прибыль |
| `margin` | `KpiCardDto` | Маржинальность |
| `salesCount` | `KpiCardDto` | Количество продаж |
| `avgCheck` | `KpiCardDto` | Средний чек |
| `bestManager` | `BestManagerDto \| null` | Лидер по валовой прибыли за период; `null` — за период не было продаж |

### `KpiCardDto`

| Поле | Тип | Смысл |
|---|---|---|
| `value` | `number \| null` | Значение метрики за период; `null` — не определено (пустой знаменатель, напр. маржа при нулевой выручке) |
| `delta` | `DeltaDto \| null` | Δ к предыдущему периоду; для `margin` — в `pp` |
| `series` | `SeriesPointDto[]` | Дневная динамика метрики за активный период |

### `BestManagerDto`

Лидер по валовой прибыли за период.

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор менеджера-лидера |
| `name` | `string` | Имя менеджера |
| `avatar` | `string \| null` | Ссылка на аватар; `null` — аватар отсутствует |
| `initials` | `string` | Инициалы менеджера |
| `gp` | `number` | Валовая прибыль лидера за период |
| `salesCount` | `number` | Число продаж лидера за период |
| `delta` | `DeltaDto \| null` | Δ ВП лидера к предыдущему периоду |
| `series` | `SeriesPointDto[]` | Дневной ряд выручки лидера за период |

---

## Блок 2. `ManagerRatingDto` — рейтинг менеджеров

| Поле | Тип | Смысл |
|---|---|---|
| `datasets` | `DatasetDto<ManagerRatingItemDto>[]` | Два датасета: `Валовая прибыль` (items отсортированы по ВП), `Средний чек` (по СЧ) |

Сортировка — по убыванию активной метрики, при равенстве — детерминированный
tie-break (`domain.md`, «Рейтинг менеджеров»). Менеджеры без продаж включаются с
нулями.

### `ManagerRatingItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор менеджера |
| `name` | `string` | Имя менеджера |
| `avatar` | `string \| null` | Ссылка на аватар; `null` — аватар отсутствует |
| `initials` | `string` | Инициалы менеджера |
| `team` | `string` | Команда |
| `salesCount` | `number` | Число продаж (`Sales Count`) |
| `revenue` | `number` | Выручка |
| `revenueDelta` | `DeltaDto \| null` | Δ выручки |
| `gp` | `number` | Валовая прибыль |
| `gpDelta` | `DeltaDto \| null` | Δ валовой прибыли |
| `ac` | `number` | Средний чек (`Average Check`) |
| `acDelta` | `DeltaDto \| null` | Δ среднего чека |
| `margin` | `number \| null` | Маржинальность, %; `null` — пустой знаменатель (нулевая выручка) |
| `marginDelta` | `DeltaDto \| null` | Δ маржинальности, в `pp` |
| `cancelRate` | `number \| null` | Доля отмен, %; `null` — выборка ниже `Cancellation Min Sample` |
| `cancelRateDelta` | `DeltaDto \| null` | Δ доли отмен, в `pp` |
| `contribution` | `ContributionDto` | Вклад по метрике датасета: `gp` → доля от общей ВП; `ac` → `× к СЧ` |

---

## Блок 3. `ManagerComparisonDto` — сравнение менеджеров

| Поле | Тип | Смысл |
|---|---|---|
| `datasets` | `DatasetDto<ManagerComparisonItemDto>[]` | Два датасета: `Валовая прибыль` (топ-10 по ВП), `Средний чек` (топ-10 по СЧ) |

Состав и порядок строк у каждого датасета свои (свой топ-10 по активной метрике).

### `ManagerComparisonItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор менеджера |
| `name` | `string` | Имя менеджера |
| `value` | `number` | Значение метрики датасета: ВП или СЧ |
| `delta` | `DeltaDto \| null` | Δ метрики датасета |

---

## Блок 4. `CustomerTopDto` — топ-10 клиентов

| Поле | Тип | Смысл |
|---|---|---|
| `datasets` | `DatasetDto<CustomerTopItemDto>[]` | Два датасета: `Валовая прибыль` (по ВП), `Средний чек` (по СЧ) |

### `CustomerTopItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор клиента |
| `name` | `string` | Имя клиента |
| `since` | `number` | Год начала работы с клиентом |
| `orderCount` | `number` | Число заказов |
| `revenue` | `number` | Выручка |
| `revenueDelta` | `DeltaDto \| null` | Δ выручки |
| `gp` | `number` | Валовая прибыль |
| `gpDelta` | `DeltaDto \| null` | Δ валовой прибыли |
| `ac` | `number` | Средний чек |
| `acDelta` | `DeltaDto \| null` | Δ среднего чека |
| `margin` | `number \| null` | Маржинальность, %; `null` — не определено |
| `marginDelta` | `DeltaDto \| null` | Δ маржинальности, в `pp` |
| `refundRate` | `number \| null` | Доля возвратов, %; `null` — выборка ниже `Refund Min Sample` |
| `refundRateDelta` | `DeltaDto \| null` | Δ доли возвратов, в `pp` |
| `cancelRate` | `number \| null` | Доля отмен, %; `null` — выборка ниже `Cancellation Min Sample` |
| `cancelRateDelta` | `DeltaDto \| null` | Δ доли отмен, в `pp` |
| `contribution` | `ContributionDto` | Вклад клиента по метрике датасета |

---

## Блок 5. `CustomerDynamicsDto` — динамика клиентов

| Поле | Тип | Смысл |
|---|---|---|
| `datasets` | `DatasetDto<CustomerDynamicsItemDto>[]` | Два датасета: `Валовая прибыль` (по Δ ВП), `Средний чек` (по Δ СЧ) |

API возвращает **полный отсортированный список** клиентов, прошедших порог
`Dyn Min Base Orders` (минимум заказов в базовом периоде), по убыванию Δ.

### `CustomerDynamicsItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор клиента |
| `name` | `string` | Имя клиента |
| `value` | `number` | Нормализованная Δ, диапазон −100…100. Знак = рост (+) / падение (−) |
| `delta` | `DeltaDto \| null` | Относительная Δ; `null` при пустой базовой метрике |

---

## Блок 6. `TimeSeriesDto` — динамика во времени

| Поле | Тип | Смысл |
|---|---|---|
| `datasets` | `DatasetDto<TimeSeriesPointDto>[]` | Три датасета: `Выручка`, `Валовая прибыль`, `Кол-во продаж` |

### `TimeSeriesPointDto` (по одной точке на каждый день периода)

| Поле | Тип | Смысл |
|---|---|---|
| `date` | `datetime` | Дата точки |
| `valueCurrent` | `number` | Значение метрики за день активного периода (сплошная линия) |
| `valuePrevious` | `number \| null` | Значение за соответствующий день предыдущего сопоставимого периода (пунктир); периоды всегда равны по длительности (`domain.md`, «Предыдущий сопоставимый период»), поэтому поле всегда содержит число |

Дни без продаж включаются как `valueCurrent: 0` — ряд непрерывен по всем дням периода.

---

## Блок 7. `CategoriesDto` — продажи по категориям

| Поле | Тип | Смысл |
|---|---|---|
| `datasets` | `CategoryDatasetDto[]` | Два датасета: `Выручка`, `Валовая прибыль` |

### `CategoryDatasetDto` (расширяет `DatasetDto<CategoryItemDto>`)

| Поле | Тип | Смысл |
|---|---|---|
| `name` | `string` | Название метрики датасета (наследуется) |
| `items` | `CategoryItemDto[]` | Категории, отсортированы по метрике датасета (наследуется) |
| `total` | `number` | Сумма метрики датасета по всем категориям |

### `CategoryItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор категории |
| `name` | `string` | Название категории |
| `revenue` | `number` | Выручка категории |
| `revenueDelta` | `DeltaDto \| null` | Δ выручки |
| `gp` | `number` | Валовая прибыль категории |
| `gpDelta` | `DeltaDto \| null` | Δ валовой прибыли |
| `margin` | `number \| null` | Маржинальность, %; `null` — не определено |
| `marginDelta` | `DeltaDto \| null` | Δ маржинальности, в `pp` |
| `salesCount` | `number` | Число продаж категории |
| `salesCountDelta` | `DeltaDto \| null` | Δ числа продаж |
| `share` | `number` | Доля категории в метрике датасета, 0–100 |

Возвратов по категориям нет намеренно — данные по возвратам доступны только в
блоках `topProducts` и `refunds`.

---

## Блок 8. `ProductsDto` — топ-10 продуктов

| Поле | Тип | Смысл |
|---|---|---|
| `datasets` | `DatasetDto<ProductItemDto>[]` | Три датасета: `Выручка` (по выручке), `Валовая прибыль` (по ВП), `Продано шт` (по количеству) |

### `ProductItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор товара |
| `name` | `string` | Название товара |
| `sku` | `string` | Артикул товара |
| `category` | `string` | Название категории |
| `revenue` | `number` | Выручка |
| `revenueDelta` | `DeltaDto \| null` | Δ выручки |
| `gp` | `number` | Валовая прибыль; может быть отрицательной — печатается как есть |
| `gpDelta` | `DeltaDto \| null` | Δ валовой прибыли |
| `units` | `number` | Продано штук (сумма `quantity`) |
| `unitsDelta` | `DeltaDto \| null` | Δ продано |
| `margin` | `number \| null` | Маржинальность, %; `null` — не определено |
| `marginDelta` | `DeltaDto \| null` | Δ маржинальности, в `pp` |
| `refundRate` | `number \| null` | Доля возвратов, %; `null` — выборка ниже `Refund Min Sample` |
| `refundRateDelta` | `DeltaDto \| null` | Δ доли возвратов, в `pp` |
| `contribution` | `ContributionDto` | Вклад товара по метрике датасета; `valueRelativeUnit`: `revenue` \| `gp` \| `units` |

---

## Блок 9. `RecentSalesDto` — последние продажи

| Поле | Тип | Смысл |
|---|---|---|
| `sales` | `SaleFeedItemDto[]` | Последние сделки периода, по убыванию даты (~20 записей) |

### `SaleFeedItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор сделки |
| `client` | `string` | Название клиента |
| `manager` | `string` | Имя менеджера |
| `date` | `datetime` | Дата сделки |
| `itemsCount` | `number` | Количество позиций в сделке |
| `status` | `enum SaleStatus` | Статус, производный от дат (`domain.md`, «Жизненный цикл сделки») |
| `revenue` | `number` | Сумма сделки |
| `gp` | `number \| null` | Валовая прибыль; `null` для `refunded`/`cancelled` — ВП не имеет смысла для потерянных сумм |

Итоговой агрегатной строки в ответе нет намеренно (`ui.md`).

---

## Блок 10. `RefundsDto` — возвраты за период

Возвраты — независимый блок без сводного итога (`domain.md`, «Главное правило»).
Разрез — товары (по `refundedAt`).

| Поле | Тип | Смысл |
|---|---|---|
| `value` | `number` | Сумма возвратов за период (по `refundedAt`) |
| `rate` | `number \| null` | Доля возвратов (`Refund Rate`), %; `null` — пустой знаменатель → `—` |
| `rateDelta` | `DeltaDto \| null` | Δ доли возвратов, в `pp` |
| `series` | `SeriesPointDto[]` | Дневной ряд возвратов активного периода |
| `top` | `RefundTopItemDto[]` | Топ товаров по сумме возвратов, по убыванию (без порога входа) |
| `tail` | `RefundTailDto \| null` | Хвост «Остальные N»; `null` — за топом никого не осталось |

### `RefundTopItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор товара |
| `name` | `string` | Название товара |
| `category` | `string` | Категория товара |
| `valueAbsolute` | `number` | Сумма возвратов товара |
| `valueRelative` | `number` | Доля товара от суммы возвратов, 0–100 |
| `valueNormalized` | `number` | Длина бара товара, 0–100 |

### `RefundTailDto`

| Поле | Тип | Смысл |
|---|---|---|
| `count` | `number` | N товаров за топом |
| `valueAbsolute` | `number` | Сумма возвратов хвоста |
| `valueRelative` | `number` | Доля хвоста от суммы возвратов, 0–100 |

Контрактный инвариант: доли строк `top` + `tail.valueRelative` = 100% группы (с
точностью округления).

---

## Блок 11. `CancellationsDto` — отмены за период

Отмены — независимый блок без сводного итога (`domain.md`, «Главное правило»).
Разрез — менеджеры (по `cancelledAt`).

| Поле | Тип | Смысл |
|---|---|---|
| `value` | `number` | Сумма отмен за период (по `cancelledAt`) |
| `rate` | `number \| null` | Доля отмен (`Cancellation Rate`), %; `null` — пустой знаменатель → `—` |
| `rateDelta` | `DeltaDto \| null` | Δ доли отмен, в `pp` |
| `series` | `SeriesPointDto[]` | Дневной ряд отмен активного периода |
| `top` | `CancellationTopItemDto[]` | Топ менеджеров по сумме отмен, по убыванию (без порога входа) |
| `tail` | `CancellationTailDto \| null` | Хвост «Остальные N»; `null` — за топом никого не осталось |

### `CancellationTopItemDto`

| Поле | Тип | Смысл |
|---|---|---|
| `id` | `uuid` | Идентификатор менеджера |
| `name` | `string` | Имя менеджера |
| `valueAbsolute` | `number` | Сумма отмен менеджера |
| `valueRelative` | `number` | Доля менеджера от суммы отмен, 0–100 |
| `valueNormalized` | `number` | Длина бара менеджера, 0–100 |

### `CancellationTailDto`

| Поле | Тип | Смысл |
|---|---|---|
| `count` | `number` | N менеджеров за топом |
| `valueAbsolute` | `number` | Сумма отмен хвоста |
| `valueRelative` | `number` | Доля хвоста от суммы отмен, 0–100 |

Контрактный инвариант: доли строк `top` + `tail.valueRelative` = 100% группы (с
точностью округления).

---

## Пример ответа

```json
{
  "kpi": {
    "revenue": { "value": 12400000, "delta": { "value": 12.4, "unit": 1 },
      "series": [{ "value": 1800000, "date": "2026-09-17T00:00:00Z" }] },
    "gp": { "value": 4200000, "delta": { "value": 8.7, "unit": 1 },
      "series": [{ "value": 600000, "date": "2026-09-17T00:00:00Z" }] },
    "margin": { "value": 33.9, "delta": { "value": 1.2, "unit": 2 },
      "series": [{ "value": 33.5, "date": "2026-09-17T00:00:00Z" }] },
    "salesCount": { "value": 186, "delta": { "value": 5.1, "unit": 1 },
      "series": [{ "value": 28, "date": "2026-09-17T00:00:00Z" }] },
    "avgCheck": { "value": 66700, "delta": { "value": -3.1, "unit": 1 },
      "series": [{ "value": 64300, "date": "2026-09-17T00:00:00Z" }] },
    "bestManager": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "Иванов И.",
      "avatar": null, "initials": "ИИ",
      "gp": 1840000, "salesCount": 24,
      "delta": { "value": 12.0, "unit": 1 },
      "series": [{ "value": 280000, "date": "2026-09-17T00:00:00Z" }]
    }
  },
  "managerRating": { "datasets": [] },
  "managerComparison": { "datasets": [] },
  "topCustomers": { "datasets": [] },
  "customerDynamics": { "datasets": [] },
  "timeSeries": { "datasets": [] },
  "categories": { "datasets": [] },
  "topProducts": { "datasets": [] },
  "recentSales": {
    "sales": [
      {
        "id": "6b7f1c2e-0a3d-4e5f-8a9b-1c2d3e4f5a6b", "client": "ООО Вектор",
        "manager": "Иван Петров", "date": "2026-09-23T14:32:00Z", "itemsCount": 3,
        "status": 1, "revenue": 385000, "gp": 119000
      }
    ]
  },
  "refunds": {
    "value": 180000,
    "rate": 4.2,
    "rateDelta": { "value": -0.4, "unit": 2 },
    "series": [{ "value": 25000, "date": "2026-09-17T00:00:00Z" }],
    "top": [
      { "id": "9c8b7a6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d", "name": "DJI Mini 4 Pro",
        "category": "Дроны", "valueAbsolute": 95000, "valueRelative": 52.8,
        "valueNormalized": 100 }
    ],
    "tail": { "count": 3, "valueAbsolute": 40000, "valueRelative": 22.2 }
  },
  "cancellations": {
    "value": 0, "rate": 0.0, "rateDelta": null,
    "series": [], "top": [], "tail": null
  }
}
```

---

## Ошибки

Ошибка — ответ с `Content-Type: application/problem+json` (RFC 7807). Пустой или
невалидный период **не допускается**: такой запрос — `400`, а не пустой дашборд.

| Статус | Когда |
|---|---|
| `400` | Невалидный запрос (см. таблицу ниже) |
| `500` | Непредвиденная ошибка сервера |

### `400` — невалидный запрос

| Случай | `code` в `errors[]` | `detail` |
|---|---|---|
| `from`/`to` отсутствуют, `null` или невалидны | `PERIOD_REQUIRED` | `Field 'from' is required` |
| `from >= to` | `PERIOD_INVALID_ORDER` | `'from' must be earlier than 'to'` |
| `segment` вне enum | `SEGMENT_INVALID` | `Field 'segment' must be one of: 1, 2, 3` |

```json
{
  "title": "Validation failed",
  "status": 400,
  "detail": "'from' must be earlier than or equal to 'to'",
  "errors": [
    { "field": "from", "code": "PERIOD_INVALID_ORDER" }
  ]
}
```

Массив `errors` присутствует только для ошибок валидации полей; `detail` —
человекочитаемое описание первой ошибки. Поле `type` не передаётся — по RFC 7807
это означает значение по умолчанию `about:blank`.

Тело запроса, которое не удаётся десериализовать как JSON, отклоняется с `400` до
выполнения обработчика. Формат такого ответа — стандартный `ValidationProblemDetails`
(RFC 7807) фреймворка; его тело контрактом не определяется.

### `500` — внутренняя ошибка

```json
{
  "title": "Internal server error",
  "status": 500,
  "detail": "An unexpected error occurred"
}
```

Тело `500` не раскрывает деталей сервера.
