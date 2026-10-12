"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { DashboardQuery } from "../../interfaces/dashboardQuery";
import type { DashboardQueryContextValue } from "../../interfaces/dashboardQueryContextValue";
import
{
  DEFAULT_PERIOD_PRESET,
  DEFAULT_SEGMENT,
} from "../../configuration/dashboard";
import { resolvePresetRange } from "../../utils/resolvePresetRange";
import { toIsoDate } from "../../utils/toIsoDate";
import type { IsoDate } from "../../types/isoDate";
import type { CustomerSegment } from "../../types/customerSegment";

/**
 * Валидирует сегмент: одно из трёх значений enum или отсутствие параметра.
 *
 * @param value сырое значение параметра segment.
 * @returns сегмент или null — параметра нет/невалиден.
 */
function parseSegment(value: string | undefined): CustomerSegment | null
{
  if (value !== "enterprise" && value !== "mid-market" && value !== "smb")
  {
    return null;
  }

  return value;
}

/**
 * Нормализует прочитанные фильтры к дефолтам и починке `from > to`
 * (frontend.md, раздел 4; frontend-plan.md, этап 3).
 *
 * Экспортирована для юнит-тестов нормализации (§11 frontend.md); в рантайме
 * вызывается только parseDashboardQuery.
 *
 * Правила:
 * - отсутствующий/невалидный параметр → дефолт (пресет «30 дней», все сегменты);
 * - `from > to` — период невалиден, оба дня приводятся к дефолтному диапазону
 *   пресета (дни не «меняются местами»: это единственный случай, когда
 *   дефолтный пресет вычислим без участия пользователя);
 * - дефолтное состояние (пустой URL) — диапазон дефолтного пресета.
 *
 * @param from день из URL или null.
 * @param to день из URL или null.
 * @param segment сегмент из URL или null.
 * @param now момент нормализации (сегодня в UTC).
 * @returns валидный DashboardQuery.
 */
export function normalizeQuery(
  from: IsoDate | null,
  to: IsoDate | null,
  segment: CustomerSegment | null,
  now: Date,
): DashboardQuery
{
  const defaultRange = resolvePresetRange(DEFAULT_PERIOD_PRESET, now);

  // Оба параметра валидны — проверяем порядок; один валиден или оба невалидны —
  // дефолтный диапазон (частично валидный URL не надёжен: намерение неизвестно).
  if (from !== null && to !== null)
  {
    if (from <= to)
    {
      return { from, to, segment: segment ?? DEFAULT_SEGMENT };
    }

    return {
      from: defaultRange.from,
      to: defaultRange.to,
      segment: segment ?? DEFAULT_SEGMENT,
    };
  }

  return { from: defaultRange.from, to: defaultRange.to, segment: segment ?? DEFAULT_SEGMENT };
}

/**
 * Сериализует фильтры в строку searchParams: `?from=…&to=…` и `&segment=…`
 * только когда сегмент выбран (null — параметр отсутствует, все сегменты).
 *
 * Экспортирована для round-trip теста (parse ↔ write, §11 frontend.md);
 * вне hooks/app формат URL не известен.
 *
 * @param query фильтры дашборда.
 * @returns строка запроса с ведущим `?`.
 */
export function serializeQuery(query: DashboardQuery): string
{
  const params = new URLSearchParams();

  params.set("from", query.from);
  params.set("to", query.to);

  if (query.segment !== null)
  {
    params.set("segment", query.segment);
  }

  return `?${params.toString()}`;
}
/**
 * Читает и нормализует фильтры из searchParams (без React — чистая функция,
 * тестируется юнитом; frontend-plan.md, этап 3: «чистая часть хука вынесена
 * в функции без hooks-окружения»).
 *
 * @param searchParams параметры текущего URL.
 * @param now момент нормализации (сегодня в UTC).
 * @returns валидный DashboardQuery.
 */
export function parseDashboardQuery(
  searchParams: URLSearchParams,
  now: Date,
): DashboardQuery
{
  const from = toIsoDate(searchParams.get("from") ?? "");
  const to = toIsoDate(searchParams.get("to") ?? "");
  const segment = parseSegment(searchParams.get("segment") ?? undefined);

  return normalizeQuery(from, to, segment, now);
}

/**
 * App-level хук — единственная граница `searchParams` (frontend.md, раздел 4):
 * чтение (`useSearchParams` + нормализация) и запись (`setQuery` →
 * `window.history.replaceState`). Вне хука формат URL не известен (хитрое
 * место №3 frontend-plan.md).
 *
 * Запись — нативный history API, не `router.replace`: навигация Next на
 * каждую смену фильтров запрашивала у сервера RSC-снимок страницы (запрос
 * index), данные же меняются прямым обращением к API. replaceState меняет
 * URL без сетевого запроса; Next (с 14.1) синхронизирует `useSearchParams`
 * с нативным history — подписчики перерендерятся как прежде.
 *
 * @returns контракт DashboardQueryContextValue.
 */
export function useDashboardQuery(): DashboardQueryContextValue
{
  const searchParams = useSearchParams();
  const now = useMemo(() => new Date(), []);

  // Query пересчитывается только при смене URL: now фиксируется при первом
  // рендере, автообновление при переходе суток (пересчитать пресеты/дефолт)
  // не требуется — пользователь сам меняет фильтры.
  const query = useMemo(
    () => parseDashboardQuery(searchParams, now),
    [searchParams, now],
  );

  const setQuery = useCallback(
    (next: DashboardQuery) =>
    {
      // Строка запроса с ведущим `?` меняет только search — путь сохраняется;
      // запись в текущую запись истории, как у router.replace ранее.
      window.history.replaceState(null, "", serializeQuery(next));
    },
    [],
  );

  return { query, setQuery };
}