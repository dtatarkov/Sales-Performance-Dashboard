"use client";

import { useCallback, useState } from "react";

import type { Disclosure } from "../../interfaces/disclosure";

/**
 * Булево состояние «раскрыто/скрыто» (frontend-plan.md, этап 5;
 * frontend.md, раздел 5, ui/): состояние видимости всплывающих элементов UI
 * (DateRangePicker в тулбаре, Tooltip). По сути `useState` + удобные
 * обработчики.
 *
 * @param initialState начальное состояние (по умолчанию закрыто).
 * @returns контракт Disclosure.
 */
export function useDisclosure(initialState = false): Disclosure
{
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() =>
  {
    setIsOpen(true);
  }, []);

  const close = useCallback(() =>
  {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() =>
  {
    setIsOpen((previous) => !previous);
  }, []);

  return { isOpen, open, close, toggle };
}