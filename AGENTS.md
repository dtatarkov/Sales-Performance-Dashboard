# AGENTS.md

Правила и договорённости проекта. Читать перед изменениями.

## Организация кода (frontend)

Каждый файл относится ровно в одну категорию по назначению:

| Папка | Что живёт | Примеры |
|---|---|---|
| `utils/` | Утилиты — чистые хелперы без React и домена | `formatDate`, `parseDate`, `clamp` |
| `types/` | Типы **только данных** | DTO ответов, формы метрик |
| `interfaces/` | **Публичные контракты** — границы модулей, экспортируемые API | `DashboardQuerySource`, `ContributionStrategy` |
| `api/` | Детали API — клиент, эндпоинты, маппинг запрос/ответ | `client.ts`, `endpoints.ts`, `mappers.ts` |
| `configuration/` | Конфигурация и константы — дефолты, пресеты, env-настройки | `dashboard.ts` (дефолты периода/сегмента), `env.ts` |

Запрещено:

- держать константы и дефолты в `utils/` или `lib/` — это `configuration/`;
- смешивать типы данных (`types/`) с контрактами модулей (`interfaces/`);
- прятать детали API в слоях, которые их только потребляют.

Доменные дефолты (например, какой экран видит пользователь при пустом URL) —
конфигурация, не утилита.

## Стиль кода

- Не смешивать несколько вызовов в одном выражении. Результат каждого вызова
  сохраняется в отдельную переменную и передаётся дальше уже она.

  ```cs
  // Плохо
  return Ok(responseMapper.Map(model));

  // Хорошо
  var dto = responseMapper.Map(model);
  return Ok(dto);
  ```

- Многострочные блоки отделяются от остальных пустой строкой.

  ```cs
  // Плохо
  var cur = metrics.Calculate(row.Revenue, row.Cost, row.SalesCount);
  var prev = metrics.Calculate(
      previous?.Revenue ?? 0m,
      previous?.SalesCount ?? 0);
  return new CategoryRow(
      Id: row.Id,
      Name: row.Name);

  // Хорошо
  var cur = metrics.Calculate(row.Revenue, row.Cost, row.SalesCount);

  var prev = metrics.Calculate(
      previous?.Revenue ?? 0m,
      previous?.SalesCount ?? 0);

  return new CategoryRow(
      Id: row.Id,
      Name: row.Name);
  ```

- Использовать полные имена переменных, никаких сокращений (`cur`, `prev`,
  `tmp`, `res`, ...).

  ```cs
  // Плохо
  var cur = metrics.Calculate(row.Revenue, row.Cost, row.SalesCount);
  var prev = metrics.Calculate(previous.Revenue, previous.Cost, previous.SalesCount);

  // Хорошо
  var currentMetrics = metrics.Calculate(row.Revenue, row.Cost, row.SalesCount);
  var previousMetrics = metrics.Calculate(previous.Revenue, previous.Cost, previous.SalesCount);
  ```

- `return` всегда отделяется от остального кода пустой строкой (кроме
  однострочных лямбд и expression-bodied членов).

  ```cs
  // Плохо
  var sale = CreateSale(random, date, context);
  sales.Add(sale);
  return sales;
  ```

  ```cs
  // Хорошо
  var sale = CreateSale(random, date, context);
  sales.Add(sale);

  return sales;
  ```

  ```cs
  // Допустимо: однострочная лямбда / expression-bodied член
  var names = managers.Select(manager => manager.Name).ToList();

  private static DateTime Min(DateTime value, DateTime ceiling)
      => value > ceiling ? ceiling : value;
  ```

- Комментарии к коду — на русском языке, для каждой функции, метода и
  класса. Минимум: назначение + описание каждого аргумента. Если логика
  «хитрая» — объяснить её; если она реализует правило домена (`domain.md`,
  `api.md`) или UI-архитектуры (`ui.md`, `frontend.md`) — добавить ссылку на
  соответствующий раздел. Публичные контракты — только JSDoc-блоки (`/** */`).
  Полные правила и примеры — `docs/frontend.md`, §11.1.

