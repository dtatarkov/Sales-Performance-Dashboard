"use client";

import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { dateFnsLocale } from "../../configuration/dateLocale";
import { asUtcWallClock } from "../../utils/asUtcWallClock";
import { parseIsoDateToLocal } from "../../parsers/parseIsoDateToLocal";
import { formatToIsoDate } from "../../formatters/formatToIsoDate";
import { Popover } from "./Popover";
import type { IsoDate } from "../../types/isoDate";

/**
 * Тип props DateRangePicker — пикер диапазона (frontend-plan.md, этап 6):
 * наш Popover + `<DayPicker mode="range">`; render-only, наружу только
 * `{ from, to, onPeriodChange }`.
 */
type DateRangePickerProps = {
  /** Текущее начало периода (YYYY-MM-DD). */
  from: IsoDate;
  /** Текущий конец периода (YYYY-MM-DD, включительно). */
  to: IsoDate;
  /** Завершение выбора диапазона (оба конца валидны — mode="range" required). */
  onPeriodChange: (from: IsoDate, to: IsoDate) => void;
  /** Содержимое триггера (подпись диапазона на кнопке тулбара). */
  triggerContent: React.ReactNode;
};

/*
 * Классы DayPicker (ui.md): v9 ЗАМЕНЯЕТ дефолтный класс ячейки кастомным
 * (не добавляет), поэтому rdp-* классы модификаторов возвращены в строки —
 * на них навешен CSS ленты/кругов today/disabled в globals.css; здесь —
 * только дополнение (скругления концов ленты, текст, курсор).
 */
const DAY_PICKER_CLASS_NAMES = {
  today: "rdp-today font-semibold",
  range_start: "rdp-range_start rounded-l-full",
  range_end: "rdp-range_end rounded-r-full",
  disabled: "rdp-disabled cursor-default",
} as const;

/** Акцентный цвет календаря — токен globals.css. */
const ACCENT_COLOR_STYLE = { ["--rdp-accent-color" as string]: "var(--accent)" } as const;

/**
 * Сегодняшний день для календаря: UTC-день момента now в виде локальной
 * псевдо-даты (asUtcWallClock — локальные компоненты совпадают с UTC).
 * Пресеты тулбара считаются в UTC (frontend.md, раздел 4) — «сегодня» в
 * пикере тот же день, иначе в вечерние часы UTC+ граница disabled уезжала
 * бы на день вперёд от пресетного «today».
 *
 * @returns псевдо-Date сегодняшнего UTC-дня (полночь локальных компонентов).
 */
function utcTodayOf(): Date {
  const now = new Date();

  return asUtcWallClock(now);
}

/** Ключ календарного месяца «YYYY-MM» из локальных компонентов даты. */
function monthKeyOf(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

/**
 * Начальный месяц вида пикера: месяц левой границы диапазона; если он
 * текущий или будущий (в первом view есть disabled-даты — дни после today),
 * сдвигается на месяц назад: view 1 — предыдущий месяц, view 2 — текущий
 * (docs/archive/datepicker-mockup.html). Выбор в прошлом месяце показывается как есть.
 *
 * @param from левая граница текущего периода (YYYY-MM-DD).
 * @param today сегодняшний UTC-день (граница disabled-дат).
 * @returns месяц, с которого начинается двухмесячный вид (локальная дата).
 */
function initialMonthOf(from: IsoDate, today: Date): Date {
  const base = parseIsoDateToLocal(from);

  // Сравнение календарных месяцев — по локальным компонентам обеих дат:
  // toISOString() у локальной полуночи в UTC+ даёт предыдущий день и ломал
  // сравнение на 1-м числе месяца.
  const isShifted = monthKeyOf(base) >= monthKeyOf(today);

  const defaultMonth = isShifted
    ? new Date(base.getFullYear(), base.getMonth() - 1, 1)
    : base;

  return defaultMonth;
}

/**
 * DateRangePicker — пикер диапазона (frontend-plan.md, этап 6): Popover +
 * DayPicker mode="range" required (диапазон нельзя снять — период есть
 * всегда), numberOfMonths=2, локаль ru. Завершение выбора — когда выбраны
 * оба конца; невалидный диапазон незавершаем (правило на уровне компонента).
 * Все константы и обработчики — вне JSX (AGENTS.md, «Стиль JSX»).
 *
 * Контракт дат — UTC: props и onPeriodChange работают днями YYYY-MM-DD
 * (IsoDate, тот же UTC-день, что в URL и запросе), внутри компонент
 * переводит их в локальные календарные даты DayPicker (parseIsoDateToLocal
 * / formatToIsoDate по клику) — конвертация деталь пикера.
 *
 * Синхронизация props → selected: пересоздание содержимого по ключу
 * `${from}:${to}` — смена пресета/нормализация URL обновляют календарь.
 *
 * @param props текущий период, событие завершения выбора, триггер.
 * @returns кнопка-триггер с календарём в поповере.
 */
export function DateRangePicker({
  from,
  to,
  onPeriodChange,
  triggerContent,
}: DateRangePickerProps) {
  // Незавершённый выбор (механика «два клика», макет docs/archive/datepicker-mockup.html):
  // первый клик фиксирует левую границу, период меняется только вторым.
  // periodKey при клике привязывает границу к текущему периоду: смена
  // пресета/URL инвалидирует её без сброса через effect.
  const [pending, setPending] = useState<{ periodKey: string; from: Date } | null>(null);

  const periodKey = `${from}:${to}`;

  const pendingFrom =
    pending !== null && pending.periodKey === periodKey ? pending.from : null;

  const handleSelect = (range: DateRange | undefined, clickedDate: Date) => {
    if (range === undefined) {
      return;
    }

    // Первый клик — только граница: день подсвечивается, период не трогается.
    if (pendingFrom === null) {
      setPending({ periodKey, from: clickedDate });

      return;
    }

    // Второй клик — вторая граница: диапазон нормализуется (мин/макс),
    // порядок кликов не важен; одиночный день — from == to.
    const isForward = pendingFrom < clickedDate;

    const nextFrom = isForward ? pendingFrom : clickedDate;

    const nextTo = isForward ? clickedDate : pendingFrom;

    setPending(null);

    onPeriodChange(formatToIsoDate(nextFrom), formatToIsoDate(nextTo));
  };

  // Подсветка календаря: незавершённый выбор — одиночный день (первая
  // граница); иначе текущий период из props. Дни периода — локальные
  // псевдо-даты: DayPicker работает в локальных датах, UTC-полночь в
  // UTC− таймзонах выделяла бы соседний день.
  const selected: DateRange = pendingFrom !== null
    ? { from: pendingFrom, to: pendingFrom }
    : { from: parseIsoDateToLocal(from), to: parseIsoDateToLocal(to) };

  return (
    <Popover
      trigger={triggerContent}
      panelWidth="auto"
      onOpenChange={(open) => {
        if (!open) {
          // Закрытие без второго клика — незавершённый выбор отменяется.
          setPending(null);
        }
      }}
    >
      {/* Padding панели со всех сторон (макет docs/archive/datepicker-mockup.html);
          select-none — текст календаря не выделяется мышью. Ключ — период:
          смена пресета/URL пересоздаёт календарь (defaultMonth/selected). */}
      <div key={periodKey} className="p-4 select-none">
        <DayPicker
          mode="range"
          required
          numberOfMonths={2}
          defaultMonth={initialMonthOf(from, utcTodayOf())}
          locale={dateFnsLocale}
          selected={selected}
          onSelect={handleSelect}
          disabled={{ after: utcTodayOf() }}
          classNames={DAY_PICKER_CLASS_NAMES}
          style={ACCENT_COLOR_STYLE}
        />
      </div>
    </Popover>
  );
}