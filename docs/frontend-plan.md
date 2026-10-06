# План реализации frontend

**Статус:** не начат.

Контекст: `docs/frontend.md` (архитектура, контракты, библиотеки),
`docs/ui.md` (блоки, состояния, форматы), `docs/api.md` (контракт данных),
`docs/domain.md` (бизнес-правила — только по ссылке),
`docs/specification.md` (требования).

Границы: frontend-приложение (Next.js App Router + TypeScript) — от
scaffolding'а до всех 11 блоков + тулбар + тосты. Backend и docker-обвязка —
вне плана (backend реализован, `docs/backend-plan.md`). Клиент ожидает
запущенный backend на `NEXT_PUBLIC_API_BASE_URL`.

Уровень детализации — средний: этапы в порядке зависимостей; сущности
перечислены по слоям; контракты — только публичные (то, что связывает этапы).
«Хитрые места» собраны одним списком в конце документа (заголовок + суть,
с указанием этапа).

---

## Этапы

### Этап 0. Каркас проекта

- `create-next-app` (App Router, TypeScript, Tailwind v4, без примеров).
- Скелет каталогов по `frontend.md` §2: `src/app`, `src/widgets`,
  `src/hooks/{app,ui,domain}`, `src/api`, `src/components/{ui,data,charts}`,
  `src/utils`, `src/types`, `src/interfaces`, `src/configuration`.
- Пустые `page.tsx` (client) + минимальный `layout.tsx`.
- Проверка зависимостей: `@tanstack/react-query`, `recharts`, `sonner`,
  `date-fns`, `motion`, `@floating-ui/react-dom` (версии — `frontend.md` §13).
- Настройка import-boundaries линтера (запреты §3) — сразу, на пустом
  проекте; на готовом коде это не приживётся.
- Паттерн запуска: `npm run dev` + прокси к backend (dev-окружение).

**Результат:** пустая страница, lint проверяет границы слоёв.

---

### Этап 1. Фундамент: типы, конфигурация, утилиты

Сущности (по одной в файле, правило «один файл — одна сущность»):

| Файл | Содержимое |
|---|---|
| `types/dto.ts` | DTO из `api.md`: `DashboardDto` + все вложенные, `DeltaDto`, `SeriesPointDto`, `ContributionDto`, `DatasetDto<T>`, числовые enum'ы (`Segment`, `DeltaUnit`, `ContributionUnit`, `SaleStatus` — как union числовых литералов) |
| `types/delta.ts` | `Delta` — `{ value, unit: 'percent' \| 'pp' }` (`ui.md`, «Формат данных и тип Delta») |
| `types/dataset.ts` | `Dataset<T>` — `{ name, items }` (`ui.md`, «Тип Dataset») |
| `types/contribution.ts` | `Contribution` — `{ valueAbsolute, valueRelative, valueRelativeUnit, valueNormalized }` (`ui.md`, «Тип Contribution») |
| `types/seriesPoint.ts` | `SeriesPoint` — `{ value, date: Date }` (sparkline, динамика) |
| `types/isoDate.ts` | `IsoDate` — типизированный псевдоним дня `YYYY-MM-DD` (URL-контракт) |
| `types/utcRange.ts` | `UtcRange` — `{ fromUtc: Date, toUtc: Date }` (результат `expandDayBoundaries`) |
| `types/periodPresetType.ts` | `PeriodPresetType` — union `'today' \| '7d' \| '30d' \| 'this-month' \| 'last-month'` |
| `types/customerSegment.ts` | `CustomerSegment` — `'enterprise' \| 'mid-market' \| 'smb'` |
| `configuration/dashboard.ts` | `DEFAULT_PERIOD_PRESET: PeriodPresetType = '30d'`, `DEFAULT_SEGMENT = null` |
| `configuration/dateLocale.ts` | `dateFnsLocale` — русская локаль `date-fns` для календаря DateRangePicker (константа) |
| `configuration/env.ts` | `API_BASE_URL` (из `NEXT_PUBLIC_API_BASE_URL`, с дефолтом для dev) |

**Тесты:** форматтеры (позитив/отрицательное/U+2212/`—` vs `0`/единицы,
плюрализация), `expandDayBoundaries` (края месяца, UTC),
`resolvePresetRange` (пресеты, фиксированный `now`) — юнит, без DOM.

---

### Этап 2. Слой api

Сущности:

| Файл | Содержимое |
|---|---|
| `api/client.ts` | HTTP-клиент на `fetch`: POST `DashboardRequest` (раскрытые границы, `segment` → число или отсутствие поля), `AbortSignal`, обработка статусов; при ошибке HTTP — разбор `ProblemDetails` и выброс `DashboardError` (парсер — одна функция в этом же файле: транспорт и его ошибка неразделимы) |
| `api/parsers/parseEnum.ts` | `parseEnum<T>(raw, source): T` — универсальный парсер числовых enum'ов: неизвестное значение → `DashboardError`, а не «тихий» default (баг-детектор рассинхрона с `api.md`) |
| `api/parsers/parseDate.ts` | `parseDate(raw): Date` — ISO 8601 UTC → `Date` |
| `api/mappers/enumMappers.ts` | словари числовых enum'ов → строковых union'ов (`Segment` → `'enterprise'`…); единственное место, где числа enum'ов известны |
| `api/mappers/dashboardMapper.ts` | `mapDashboard(dto): DashboardData` — корневой маппинг DTO → app-типы: enum'ы (через `parseEnum`), даты (через `parseDate`), `null`-семантика сохраняется как есть |
| `api/dashboardSource.ts` | queryFn для TanStack Query: сборка тела запроса из `DashboardQuery` + `client` + `mapDashboard`; функция без React |

**Тип ошибки** — `types/apiErrors.ts`: `DashboardError { status: number \| null; code: string \| null; message: string }` (внутренняя деталь границы `api → hooks`; в app-типы не идёт).

**Разложение ответственности:**

- **`client`** — транспорт (тело, статусы, abort) + разбор своей ошибки; знает `DashboardRequest`, не знает app-типы.
- **`parsers/`** — универсальные парсеры полей (enum, дата): защита границы — сервер присылает числа, TS-типы этого не проверяют.
- **`mappers/`** — доверенный DTO → app-типы (`ui.md`): enum-словари + перестройка структур. Здесь же правило хитрого места №2 (`null` ≠ `0`).
- **`dashboardSource`** — композиция транспорт+маппинг в одну функцию для `queryFn`. Не «конфигурация TanStack» — TanStack остаётся в `hooks/domain` (ключи, `keepPreviousData`, кэш); здесь только чистая функция «запрос → данные».

```ts
// маппинг enum'ов — единственный «словарь» между числами и union'ами;
// вне api числовые значения не известны
mapSegment(1) → 'enterprise'; mapDeltaUnit(2) → 'pp'; ...
```

**Тесты:** парсеры (ProblemDetails, битый enum — юнит), мапперы (юнит).

---

### Этап 3. hooks/app: URL-граница + контекст

Сущности:

| Файл | Содержимое |
|---|---|
| `hooks/app/useDashboardQuery.ts` | единственная граница `searchParams`: чтение (`useSearchParams` + нормализация к дефолтам, починка `from > to`) + запись (`setQuery` → `router.replace`, те же правила) |
| `contexts/dashboardQueryContext.tsx` | `DashboardQueryContext` (`createContext`) + `DashboardQueryProvider` + `useDashboardQueryContext()`; контракт — в `interfaces/dashboardQueryContext.ts` |

**Почему провайдер в `contexts/`, а не в `hooks/app/`:** контекст + провайдер —
не хук (там и JSX, и createContext — это инфраструктура React-контекста);
в `hooks/` остаются только потребители (`hooks/domain` через
`useDashboardQueryContext()`). `contexts/` — слой без зависимостей, как
`types/` и `interfaces/`: используется любым слоем, сам никого не импортирует
(кроме `types`/`interfaces`). В `frontend.md` §4 оставлена формулировка
«реализация провайдера — в `hooks/app`» из-за владения `searchParams` — после
введения `contexts/` владельцем остается `useDashboardQuery`, провайдер лишь
публикует значение.

**Контракты этапа:**

```ts
// interfaces/dashboardQueryContext.ts
const DashboardQueryContext = createContext<DashboardQuery | null>(null);
function useDashboardQueryContext(): DashboardQuery; // null → ошибка (провайдер не установлен)
```

**Тесты:** round-trip parse/serialize/normalize (юнит — чистая часть хука
вынесена в функции без hooks-окружения), интеграционный на смену периода.

---

### Этап 4. hooks/domain: кэш, BlockState, DashboardStatus

Сущности:

| Файл | Содержимое |
|---|---|
| `hooks/domain/useDashboard.ts` | базовый хук: один `useQuery` на всё приложение, ключ `[from, to, segment]` (читается из контекста), `placeholderData: keepPreviousData`, отдаёт `DashboardStatus` + сырой маппед ответ (не наружу — внутрь слоя) |
| `hooks/domain/useBlockState.ts` | хук-обёртка: принимает ключ блока и селектор, возвращает `BlockState<T>` = `{ data, isEmpty, isRefreshing }`; `isEmpty` — по правилам блока (`ui.md`), вычисление memo-зировано |
| `hooks/domain/useKpi.ts`, `useManagerRating.ts`, `useManagerComparison.ts`, `useTopCustomers.ts`, `useCustomerDynamics.ts`, `useTimeSeries.ts`, `useCategories.ts`, `useTopProducts.ts`, `useRecentSales.ts`, `useRefunds.ts`, `useCancellations.ts` | по хуку на блок; контракт `BlockState<XxxData>` (см. этап 5 — типы срезов) |

**Разложение ответственности:** `useDashboard` — владелец запроса и статуса;
`useBlockState` — единая механика среза (что общее у всех блоков); блочные
хуки — конфигурация: свой селектор + свои правила `isEmpty`, без логики.
«Срез» и «вычисление isEmpty» — не свободные функции, а часть хука, потому
что живут от состояния запроса (реактивность) и memo-зируются — это
hooks-логика по определению.

**Контракты этапа:** `BlockState<T>` (этап 1) + `DashboardStatus` (этап 1);
`useDashboard` — единственный владелец запроса, блочные хуки — тонкие
селекторы поверх него (данные = свой срез, флаги — общие).

**Тесты:** блочные срезы + `isEmpty` (юнит через `useBlockState` с фикстурами
DTO), `DashboardStatus` (юнит), интеграционный SWR-сценарий (кэш/hold/refresh,
мок сети).

---

### Этап 5. hooks/ui: логика представления

Сущности:

| Файл | Содержимое |
|---|---|
| `hooks/ui/useDisclosure.ts` | булево состояние «раскрыто/скрыто»: `{ isOpen, open, close, toggle }` — состояние видимости всплывающих элементов UI (DateRangePicker в тулбаре, Tooltip); по сути `useState` + удобные обработчики |
| `hooks/ui/useAnimatedCounter.ts` | анимация числа к новому значению (KPI, суммы потерь) |
| `hooks/ui/useHoverGroup.ts` | группа взаимной hover-подсветки (донат ↔ легенда) |

Контракты — параметры/возвраты простые; в `interfaces/` не выносятся
(приватные для UI-слоёв) — см. запреты §3.

---

### Этап 6. components/ui: примитивы

Сущности (по одной в файле, props-тип — в файле компонента):

| Компонент | Назначение |
|---|---|
| `Card.tsx` | карточка блока; три типоразмера (компактный/стандартный/уменьшенный), высота задаётся типоразмером, скролл внутри, fade внизу — только когда контент скроллится и прокрутка не в конце (`scrollTop + clientHeight < scrollHeight`) |
| `Skeleton.tsx` | скелетон по форме контента (примитив + композиция) |
| `Badge.tsx` | статус-бейдж, Δ-бейдж — база |
| `Avatar.tsx` | аватар с фолбэком на инициалы |
| `SegmentedControl.tsx` | сегментированный контрол: radio-семантика, roving tabindex, стрелки; вариант «повторный клик снимает выбор» (сегмент) |
| `Tooltip.tsx` | hover/focus → позиционирование через `@floating-ui/react-dom` (flip/shift/offset, `autoUpdate` — следит за скроллом внутри списков) |
| `Toaster.tsx` | точка настройки `<Toaster>` sonner (позиция, тема) — единственный импорт sonner вне `widgets/toasts` |
| `PeriodPresetToolbar.tsx` | тулбар-компонент (см. этап 7) — собран из SegmentedControl + DateRangePicker |
| `Popover.tsx` | поповер: открытие/закрытие (`useDisclosure`), позиционирование `@floating-ui/react-dom` (flip/shift), клик-вне + Escape → закрыть; база для `DateRangePicker` |
| `DateRangePicker.tsx` | пикер диапазона = наш `Popover` + `<DayPicker mode="range">` из `react-day-picker` (выбор библиотеки — §13 `frontend.md`); render-only, наружу `{ from, to, onPeriodChange }` |
| `BlockShell.tsx` | каркас блока: три сло́та skeleton/empty/content + модификатор isRefreshing (dimming); errors-сло́та нет |
| `EmptyState.tsx` | пустое состояние: иконка + заголовок + подсказка (вариант для «Потерь») |

**`DateRangePicker.tsx` — что настраиваем у DayPicker:** `mode="range"`,
`required` (диапазон нельзя снять — период есть всегда), `numberOfMonths={2}`,
`locale={dateFnsLocale}` (ru, из `configuration/dateLocale.ts`); стилизация —
`classNames` + CSS-переменные (`--rdp-accent-color`…) под наши токены.
Внутри `DateRangePicker` — только обвязка: адаптация `DateRange` ↔ `IsoDate`
и закрытие поповера по завершению выбора. Сетка, навигация, hover-превью,
a11y — у библиотеки.

```tsx
import { useState } from "react";

import { DayPicker } from "react-day-picker";
import { parseISO, formatISO } from "date-fns";

import { dateFnsLocale } from "@/configuration/dateLocale";
import { Popover } from "@/components/ui/Popover";

type DateRangePickerProps = {
  from: IsoDate;
  to: IsoDate;
  onPeriodChange: (from: IsoDate, to: IsoDate) => void;
};

function DateRangePicker({ from, to, onPeriodChange }: DateRangePickerProps) {
  const [selected, setSelected] = useState<{ from?: Date; to?: Date }>({
    from: parseISO(from),
    to: parseISO(to),
  });

  return (
    <Popover>
      <DayPicker
        mode="range"
        required
        numberOfMonths={2}
        locale={dateFnsLocale}
        selected={selected}
        onSelect={(range) => {
          if (!range) return;

          // библиотека гарантирует валидный диапазон:
          // клик на дату раньше from → она становится новым from
          setSelected(range);

          const nextFrom = range.from;
          const nextTo = range.to;
          if (nextFrom && nextTo) {
            onPeriodChange(
              formatISO(nextFrom, { representation: "date" }) as IsoDate,
              formatISO(nextTo, { representation: "date" }) as IsoDate,
            );
          }
        }}
        classNames={{
          // Tailwind v4 — полный контроль над стилями
          today: "border border-blue-400",
          selected: "bg-blue-500 text-white",
          range_start: "bg-blue-500 text-white rounded-l-full",
          range_end: "bg-blue-500 text-white rounded-r-full",
          range_middle: "bg-blue-100",
        }}
      />
    </Popover>
  );
}
```

Реализационные ловушки:

- **Граница `IsoDate` ↔ `Date`:** `parseISO` (вход), `formatISO(...,
  { representation: 'date' })` (выход, `YYYY-MM-DD`); при сдвиге локальной
  таймзоны — `timeZone="UTC"` у DayPicker (согласовано с `domain.md`).
- **Синхронизация props → `selected`:** смена пресета или нормализация URL
  не обновляют локальное состояние — пересоздавать при открытии поповера
  (`key={`${from}:${to}`}` на содержимом или effect на open).
- **Проверка `nextFrom && nextTo`** — страховка типом: `required`
  гарантирует оба конца в `onSelect`.

**Хитрое место — fade в `Card`:** по `ui.md` («Скролл внутри карточки») fade —
маркер продолжения списка. Показывается **только** когда контент скроллится
и прокрутка не в конце: `scrollTop + clientHeight < scrollHeight` (без
порога-запаса, строго). Реализация — слушатель `scroll` на контейнере +
пересчёт на `ResizeObserver` (высота карточки и данные меняются при смене
периода); состояние булево, перерисовка только при смене значения. Fade —
поверх контента (overlay-градиент), место под него в потоке не резервируется.

**Механика fade в `Card` — по событиям:**

| Событие | Пересчёт | Результат |
|---|---|---|
| смонтировался контент | размеры после первого рендера | fade виден, если список скроллится |
| пользователь скроллит | `scroll` → `scrollTop + clientHeight < scrollHeight` | доскроллил до конца — fade исчезает |
| данные/содержимое изменились (смена периода, skeleton → content) | `ResizeObserver` на контент-элементе | fade пересчитался без скролла |
| ресайз окна / сетки | `ResizeObserver` на контейнере карточки | fade пересчитался (влезло больше строк — исчез) |

Тонкости: подписки ставятся после первого рендера (размеры уже известны);
начальное значение — `false`, первый расчёт происходит в effect и почти
всегда мгновенно переключает в `true` (один кадр без fade — незаметен).
Сравнение строгое: при равенстве (прокрутка ровно в конце) fade скрывается.
Согласование с типоразмером: высота карточки фиксирована (`ui.md`, типоразмеры),
`ResizeObserver` на контенте достаточно — высоту контейнера никто не меняет
динамически, кроме ресайза окна.

---

### Этап 7. widgets/toolbar + компонент тулбара

**Компонент** `components/ui/PeriodPresetToolbar.tsx` — render-only, наружу
только события (`frontend.md` §4):

```ts
type PeriodPresetToolbarProps = {
  activePreset: PeriodPresetType | null;  // null — режим «произвольный период»
  from: IsoDate;
  to: IsoDate;
  segment: CustomerSegment | null;

  onPresetSelect: (preset: PeriodPresetType) => void;
  onSegmentSelect: (segment: CustomerSegment | null) => void;
  onPeriodChange: (from: IsoDate, to: IsoDate) => void;
};
```

**Виджет** `widgets/toolbar/` — собирает `DashboardQuery` из событий и зовёт
`setQuery`. DateRangePicker не даёт завершить выбор невалидного диапазона —
правило на уровне компонента (этап 6), виджету проверять нечего.

**Контракт виджета:** props `query`/`setQuery` (из `useDashboardQuery` в
`page.tsx`); наружу ничего не отдаёт.

---

### Этап 8. widgets/toasts

- Подписка на `useDashboard().status` (`DashboardStatus`).
- Конвертация статуса в тосты — **чистая функция** в файле виджета:

```ts
// isRefreshing → toast.loading('Обновление данных…', { id: 'dashboard' })
// hasError && hasData → toast.error('Не удалось обновить данные. Показаны данные за предыдущий период', { action: retry })
// hasError && !hasData → toast.error('Не удалось загрузить данные', { action: retry })
// иначе — dismiss(id)
```

- **Все вызовы `toast.*` — только здесь** (правило «императивная граница —
  в одном месте»); рендер — `<Toaster>` из примитивов.
- Дедупликация — единый `id` тоста; замена loading→error не плодит новые.

---

### Этап 9. Блочные виджеты (11 блоков `ui.md`)

Порядок в пределах этапа — по нарастанию сложности типов:

1. **KPI** (компактный типоразмер): 6 карточек, Δ-бейдж, sparkline,
   «Лучший менеджер» (аватар/инициалы).
2. **Последние продажи** (лента): строки 2 уровней, статус-бейдж + tooltip
   «как посчитано», без агрегатов.
3. **Потери** (2 виджета: Возвраты/Отмены): крупное число, доля + Δ в п.п.,
   sparkline, топ + хвост «Остальные N» (сумма долей → 100%).
4. **Рейтинг менеджеров**: датасеты, переключение без перезапроса, бар из
   `contribution.valueNormalized`, уровень 2 (сетка метрик), скролл.
5. **Клиенты — Топ-10**: как рейтинг + `since`/`orderCount`, возвраты/отмены
   в уровне 2.
6. **Сравнение менеджеров**: горизонтальный bar-chart (recharts), топ-10 по
   активной метрике, свой состав/порядок у каждого датасета.
7. **Динамика клиентов**: диверджентный bar-chart (± ), секции «Рост»/«Падение»,
   `barValue` −100…100.
8. **Динамика во времени**: area/line (recharts), активная метрика + пунктир
   предыдущего периода, одна точка (период = сегодня).
9. **Продажи по категориям**: донат + легенда-таблица, hover-подсветка
   (useHoverGroup), центр доната — активная метрика + сумма.
10. **Лучшие продукты**: топ-10, точка категории, contribution, доля возвратов.

Общая структура каждого виджета (без различий):

```tsx
function Kpi() {
  const { data, isEmpty, isRefreshing } = useKpi();

  return (
    <BlockShell
      state={data === null ? 'skeleton' : isEmpty ? 'empty' : 'content'}
      isRefreshing={isRefreshing}
      skeleton={<KpiSkeleton />}
      empty={<EmptyState ... />}
    >
      {/* content: композиция data/ + components/ */}
    </BlockShell>
  );
}
```

---

### Этап 10. page.tsx: композиция

- Провайдер `DashboardQueryContext` (значение из `useDashboardQuery`).
- Провайдер TanStack Query — **не напрямую**: `<QueryProvider>` из
  `contexts/` оборачивает `QueryClientProvider` + создание `QueryClient`
  (см. «TanStack — за собственным контекстом»).
- `<Toaster>` (sonner через примитив).
- Композиция виджетов по макету `ui.md` (сетка 12 колонок, KPI-ряд, пары
  рядов 1–5), виджеты не communicate между собой.
- `<Suspense>` вокруг содержимого (требование Next.js для `useSearchParams`).

**TanStack — за собственным контекстом (`contexts/queryProvider.tsx`):**
`page.tsx` не знает, что данные обслуживает TanStack: импортирует только наш
`<QueryProvider>`. Внутри — единственное место, где создаётся `QueryClient`
(с дефолтами кэша) и рендерится `QueryClientProvider` + dev-tools (dev-only).
Зачем: зависимость от TanStack ограничена слоем `hooks/domain` + этот файл
(«меняем кэш-движок — трогаем два файла, не страницу»); `page.tsx` как
composition root остаётся без деталей инфраструктуры. Цена: одна обёртка
(~15 строк). Если бы TanStack был единственным потребителем — обёртка
не окупалась бы, но их как минимум два (провайдер + хуки domain).

---

### Этап 11. Прогон по состояниям и приёмка

Прогон по «Глобальным состояниям» `ui.md` на реальном backend:

| Проверка | Ожидание |
|---|---|
| Initial loading | skeleton по форме каждого блока; сетка не прыгает |
| Смена периода (кэш есть) | мгновенно из кэша; фон — `isRefreshing` |
| Смена периода (кэша нет) | старый контент остаётся + toast «Обновление данных…»; затем плавная замена |
| Возврат к недавнему периоду | мгновенно из кэша |
| Ошибка при первом запросе (3A) | skeleton'ы остаются + красный toast + «Обновить» → повтор |
| Ошибка при обновлении (3B) | старые данные остаются + красный toast + «Обновить» |
| Пустой период | все блоки — «За выбранный период данных нет»; «Потери» — свои заглушки (`0 ₽`, «Возвратов нет») |
| Частично пустой период | блоки независимы: заполненные — контент, пустые — заглушки |
| Сегмент без данных | все блоки — свои empty-состояния |
| Round-trip URL | нормализация `from > to`, дефолт пустого/битого URL |
| Тулбар | sticky, DateRangePicker не завершает выбор невалидного диапазона |
| Гидрация | 0 ошибок в консоли на каждой странице состояний |

Приёмка — по чек-листу блоков `ui.md` (последний раздел).

---

## Зависимости этапов

```
Этап 0 (каркас)
  └─ Этап 1 (типы, конфиг, utils) ──── тесты
       ├─ Этап 2 (api) ──── тесты
       │    └─ Этап 4 (hooks/domain) ──── тесты
       ├─ Этап 3 (hooks/app, URL) ──── тесты
       ├─ Этап 5 (hooks/ui)
       └─ Этап 6 (components/ui)
            ├─ Этап 7 (toolbar)
            ├─ Этап 8 (toasts)
            └─ Этап 9 (11 блоков)
                 └─ Этап 10 (page.tsx)
                      └─ Этап 11 (приёмка)
```

Этапы 2, 3, 5, 6 независимы между собой (после этапа 1) — можно вести
параллельно. Этап 4 требует 2 и 3 (кэш + URL). Этапы 7–9 требуют 4, 5, 6.

---

## Сводка сущностей по слоям

| Слой | Сущности |
|---|---|
| `types` | `dto.ts` (вся схема `api.md` — один DTO-файл по одному эндпоинту), `delta.ts`, `dataset.ts`, `contribution.ts`, `seriesPoint.ts`, `isoDate.ts`, `utcRange.ts`, `periodPresetType.ts`, `customerSegment.ts` |
| `interfaces` | `dashboardQuery.ts`, `blockState.ts`, `dashboardStatus.ts`, `dashboardQueryContext.ts` |
| `configuration` | `dashboard.ts` (дефолты), `env.ts` (API_BASE_URL), `dateLocale.ts` (ru-локаль календаря) |
| `utils` | `formatNumber.ts`, `formatDelta.ts`, `formatContributionLabel.ts`, `formatMoney.ts`, `formatDate.ts`, `formatDayCount.ts`, `expandDayBoundaries.ts`, `resolvePresetRange.ts` |
| `api` | `client.ts`, `parsers/` (`problemDetails.ts`, `dtoParsers.ts`), `mappers/` (`enumMappers.ts`, `dashboardMapper.ts`), `dashboardSource.ts` |
| `contexts` | `dashboardQueryContext.tsx` (контекст + провайдер + consumer-хук), `queryProvider.tsx` (обёртка `QueryClientProvider` TanStack) |
| `hooks/app` | `useDashboardQuery.ts` |
| `hooks/domain` | `useDashboard.ts`, `useBlockState.ts` + 11 блочных хуков |
| `hooks/ui` | `useDisclosure.ts` (open/close/toggle), `useAnimatedCounter.ts`, `useHoverGroup.ts` |
| `components/ui` | `Card`, `Skeleton`, `Badge`, `Avatar`, `SegmentedControl`, `Tooltip`, `Popover`, `DateRangePicker`, `Toaster`, `PeriodPresetToolbar`, `BlockShell`, `EmptyState` |
| `components/data` | `DeltaBadge`, `ContributionBar`, `Sparkline`, строки списков |
| `components/charts` | обёртки recharts: area/line, горизонтальный bar-chart, диверджентный bar, донат |
| `widgets` | 11 блоков + `toolbar/` + `toasts/`; у каждого блока — свой skeleton |
| `pages` (`app/`) | `layout.tsx`, `page.tsx` (composition root: провайдеры + сетка) |

## Тестовые уровни (§11)

| Уровень | Что проверяется |
|---|---|
| `utils` | форматирование, раскрытие границ, пресеты |
| `api` | мапперы, ProblemDetails, подстановка границ |
| `hooks/app` | round-trip URL, нормализация |
| `hooks/domain` | срезы BlockState, isEmpty, DashboardStatus, SWR-сценарии |
| интеграционные | смена периода → навигация + запрос (мок сети) |

Компоненты и виджеты не тестируются — ручная приёмка по состояниям (этап 11).

## Хитрые места (сводно)

| # | Заголовок | Что важно |
|---|---|---|
| 1 | `NEXT_PUBLIC_` — build-time (этап 1) | Значение инлайнится в бандл при сборке, после build URL не сменить («один образ — одно окружение»). Достаточно из-за scope тестового задания; production-альтернатива — относительный `/api/v1` + `rewrites`-прокси в `next.config.ts` (URL при запуске). `process.env` — только в `configuration/env.ts` |
| 2 | `null` ≠ `0` (этап 2) | Сквозная конвенция `api.md`: мапперы не «чинят» `null` дефолтами — `null` доходит до компонента и рендерится `—`. Проверять на каждом маппере |
| 3 | Формат `searchParams` — в одном модуле (этап 3) | Парсинг, сериализация, нормализация живут только в `useDashboardQuery`; вне хука формат URL не известен. Запись — только `router.replace`. Тест round-trip parse ↔ write |
| 4 | `useSearchParams` требует Suspense (этапы 3, 10) | Без `<Suspense>`-обёртки в `page.tsx` Next.js падает на билде |
| 5 | Один запрос — 11 подписчиков (этап 4) | Блочные хуки — memo-селекторы поверх одного `useQuery`; без референсной стабильности селекторов перерисовка одного блока тянет остальные |
| 6 | `keepPreviousData` ≠ skeleton (этап 4) | `data === null` — только до первого успешного ответа; при смене периода `placeholderData` удерживает прошлые данные с `isRefreshing` — блоки не мигают. Тест обязателен |
| 7 | Ошибки не выходят из domain (этапы 4, 8) | `query.error` конвертируется в `hasError` внутри domain; виджеты и toasts видят только boolean. Различение 3A/3B — по `hasData + hasError`; `retry` — только из toasts, мимо карточек |
| 8 | `isEmpty` — правила блока в одном месте (этап 4) | «Что считать пустым» решает срез по `ui.md`; виджет данные не анализирует |
| 9 | SegmentedControl — a11y руками (этап 6) | Единственное рукописное a11y-поведение: radio-семантика, roving tabindex, стрелки, «повторный клик снимает выбор» (~40 строк). Оба контрола тулбара на нём |
| 10 | Fade в `Card` — условный (этап 6) | Только когда контент скроллится и прокрутка не в конце (`scrollTop + clientHeight < scrollHeight`, строгое); `scroll` + `ResizeObserver` (смена периода/ресайз меняют контент без скролла); булево состояние — перерисовка только при смене значения; overlay-градиент поверх контента; начальное `false` до первого effect |
| 11 | Подпись диапазона в тулбаре (этап 7) | `17 сент 2026 — 23 сент 2026 · 7 дней` — форматирует компонент, длительность считает компонент, не виджет |
| 12 | Императивная граница toasts (этап 8) | Все вызовы `toast.*` — только в `widgets/toasts/`; единый `id` тоста — замена loading→error без дублирования |
| 13 | Skeleton по форме контента (этап 9) | Отдельный skeleton-компонент на каждый блок (строки, sparkline-зоны, зона доната); высота = типоразмер карточки — состояния не двигают сетку |
| 14 | Датасеты — переключение без запроса (этап 9) | Все датасеты приходят сразу; активный — `useState` виджета; смена меняет бар/число/вклад, но не вёрстку строки |
| 15 | Цвета серий и Δ (этап 9) | Серии — по позиции датасета (1-й синий, 2-й зелёный, 3-й оранжевый, одинаково для всех карточек); цвет Δ — по семантике метрики (рост «плохой» метрики — красный). Конфиг блока — в файле виджета |
| 16 | Tooltip на статус-бейдже (этап 9) | Объясняет «как посчитано» (`domain.md`, матрица статусов); текст готовым или собирается в виджете из кода статуса |
| 17 | Хвост «Остальные N» (этап 9) | Печатается без бара, доля — с ним; сумма долей строк + хвоста = 100% группы; появляется только если за топом остались объекты |
| 18 | page.tsx — composition root (этап 10) | Единственный создатель провайдеров и связи `useDashboardQuery` → toolbar; не импортирует `components/*` и `hooks/domain/*` |

## Сквозные требования ко всем этапам

- **Комментарии — русский**, каждая функция/класс: назначение + каждый
  аргумент; хитрая логика + ссылки на `domain.md`/`api.md`/`ui.md`/`frontend.md`
  — §11.1 `frontend.md` (правило также в `AGENTS.md`).
- **Один файл — одна сущность**; props-тип компонента — в файле компонента.
- **Именование:** компоненты/виджеты — CamelCase, хуки/утилиты/типы — camelCase;
  `layout`/`page` — исключение фреймворка.
- **JSDoc-блоки (`/** */`)** — только публичные контракты.
