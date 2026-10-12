"use client";

import { useCallback, useState } from "react";

import type { HoverGroup } from "../../interfaces/hoverGroup";

/**
 * Группа взаимной hover-подсветки (frontend-plan.md, этап 5; ui.md, блок 7
 * «Продажи по категориям»: hover сегмента подсвечивает строку легенды и
 * наоборот). Один ключ на группу — id категории в донате и в легенде.
 *
 * Состояние — одна строка id или null (ничего не подсвечено): два элемента
 * с одинаковым id подсвечиваются одновременно, уход курсора с любого из них
 * сбрасывает подсветку всей группы.
 *
 * @returns контракт HoverGroup.
 */
export function useHoverGroup(): HoverGroup
{
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const highlight = useCallback((id: string) =>
  {
    setHighlightedId(id);
  }, []);

  const clearHighlight = useCallback(() =>
  {
    setHighlightedId(null);
  }, []);

  return { highlightedId, highlight, clearHighlight };
}