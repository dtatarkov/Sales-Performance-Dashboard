# AGENTS.md

Правила и договорённости проекта. Читать перед изменениями.

## Проверки

- Frontend: после выполнения задачи — `npx tsc --noEmit` → `npm run lint` →
  целевые `vitest` → `curl localhost:3000`.
- Backend: `dotnet build` → `dotnet test` на `backend/SalesDashboard.slnx`;
  **перед сдачей правок бэка — пересборка контейнера**
  (`docker compose up -d --build backend`).

## Организация кода (frontend)

Каждый файл относится ровно в одну категорию по назначению:

| Папка | Что живёт | Примеры |
|---|---|---|
| `app/` | Каркас Next.js — маршрутизация, композиция виджетов | `layout.tsx`, `page.tsx` |
| `widgets/` | Блоки дашборда (1 блок = 1 виджет) и инфраструктурные виджеты страницы | `KpiWidget`, `DashboardToolbarWidget`, `ToastsWidget` |
| `components/` | Переиспользуемые UI-элементы: графики, элементы данных, базовый UI | `charts/` (TimeAreaChart), `data/` (DeltaBadge), `ui/` (Avatar) |
| `contexts/` | React-контексты и провайдеры | `dashboardQueryContext.tsx`, `queryProvider.tsx` |
| `hooks/` | Хуки: `app/` — граница URL, `domain/` — доступ к данным, `ui/` — логика представления | `useDashboardQuery`, `useDashboard`, `useDisclosure` |
| `services/` | Оркестрация запроса — сборка тела, вызов клиента, маппинг ответа | `dashboardService.ts` |
| `api/` | Детали API — HTTP-клиент и выполнение запросов | `client.ts`, `request.ts` |
| `mappers/` | Маппинг DTO → app-типы | `mapDashboard`, `dataset`, `enumMappers` |
| `parsers/` | Парсинг сырых значений — даты, числа, enum (с сообщениями об ошибках) | `parseDate`, `parseIsoDate`, `parseNumber`, `parseEnum` |
| `formatters/` | Форматирование значений для показа: деньги, проценты, даты, Δ | `formatMoney`, `formatDelta`, `formatDate` |
| `errors/` | Типы ошибок API, их парсинг и форматирование | `apiError`, `parseError`, `formatError` |
| `mocks/` | Мок-данные для тестов и стендов | `dashboardMocks` |
| `types/` | Типы **только данных** | DTO ответов, формы метрик |
| `interfaces/` | **Публичные контракты** — границы модулей, экспортируемые API | `DashboardQuery`, `DashboardQueryContextValue`, `DashboardStatus` |
| `utils/` | Утилиты — чистые хелперы без React и домена | `asUtcWallClock`, `expandDayBoundaries`, `plural` |
| `configuration/` | Конфигурация и константы — дефолты, пресеты, env-настройки | `dashboard.ts` (дефолты периода/сегмента), `colorPalette.ts`, `env.ts` |

Запрещено:

- держать константы и дефолты в `utils/` или `lib/` — это `configuration/`;
- держать форматтеры (`format*`) в `utils/` — это `formatters/`, а парсеры
  (`parse*`) — это `parsers/`;
- смешивать типы данных (`types/`) с контрактами модулей (`interfaces/`);
- прятать детали API в слоях, которые их только потребляют;
- держать в `hooks/` JSX и импорты `widgets`/`components` — хуки это чистый
  TypeScript без разметки;
- писать компоненты внутри `app/` — страница только компонует готовые виджеты;
  локальный JSX в `page.tsx` неявно связывает страницы с UI-компонентами.

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

- Однострочные операторы, наоборот, группируются по смыслу: этапы одного
  процесса вычисления держатся вместе без пустых строк, а разные логические
  группы разделяются пустой строкой — так код воспринимается легче.

  ```cs
  // Хорошо: этапы одного вычисления — вместе
  var currentMetrics = metrics.Calculate(row.Revenue, row.Cost, row.SalesCount);
  var previousMetrics = metrics.Calculate(previous.Revenue, previous.Cost, previous.SalesCount);
  var growth = CalculateGrowth(currentMetrics, previousMetrics);

  // Хорошо: разные группы (данные пользователя, даты) — раздельно
  var userName = user.Name;
  var userEmail = user.Email;
  var userOrders = orders.Count(order => order.UserId == user.Id);

  var periodFrom = period.Start.Date;
  var periodTo = period.End.Date;
  var periodDays = (periodTo - periodFrom).Days;
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
  `specification.md`) или UI-архитектуры (`ui.md`, `frontend.md`, `api.md`
  — архив `docs/archive/`) — добавить ссылку на соответствующий раздел.
  Публичные контракты — только JSDoc-блоки (`/** */`).
  Полные правила и примеры — `docs/archive/frontend.md`, §11.1.

