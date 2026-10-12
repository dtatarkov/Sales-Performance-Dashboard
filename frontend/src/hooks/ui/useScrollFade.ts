"use client";

import { useEffect, useState } from "react";

/** Допуск «докрутил до конца», px. */
const BOTTOM_TOLERANCE_PX = 1;

/**
 * Механика fade карточки (frontend-plan.md, «Хитрое место — fade в Card»):
 * fade виден, только когда контент скроллится и прокрутка не в конце —
 * строгое сравнение `scrollTop + clientHeight < scrollHeight`.
 *
 * Слушатели ставятся после первого рендера (размеры известны): `scroll` на
 * контенте, `ResizeObserver` на контенте (данные сменились). Состояние
 * булево — перерисовка только при смене.
 *
 * @param containerRef скроллящийся элемент контента.
 * @param updateKey ключ пересчёта: смена значения (смена датасета/данных)
 *   пересчитывает fade заново, даже если размеры контейнера не изменились.
 * @returns показывать ли fade.
 */
export function useScrollFade(
  containerRef: React.RefObject<HTMLDivElement | null>,
  updateKey: unknown,
): boolean
{
  const [fadeVisible, setFadeVisible] = useState(false);

  useEffect(() =>
  {
    const container = containerRef.current;

    if (container === null)
    {
      return;
    }

    // Пересчёт: сравнение с допуском 1px — scrollHeight округляется вверх,
    // максимум scrollTop вниз, строгое равенство в крайнем нижнем положении
    // не достигается и fade «залипал» (правка: градиент не скрывался при
    // скролле таблицы в самый низ).
    const recalculate = () =>
    {
      const scrollBottomGap = container.scrollHeight - container.clientHeight -
        container.scrollTop;

      const canScroll = scrollBottomGap > BOTTOM_TOLERANCE_PX;

      setFadeVisible((previous) =>
        previous === canScroll ? previous : canScroll,
      );
    };

    recalculate();

    container.addEventListener("scroll", recalculate, { passive: true });

    // ResizeObserver на контенте: смена данных/skeleton→content меняет
    // scrollHeight без скролла.
    const contentObserver = new ResizeObserver(recalculate);
    contentObserver.observe(container);

    return () =>
    {
      container.removeEventListener("scroll", recalculate);
      contentObserver.disconnect();
    };
  }, [containerRef, updateKey]);

  return fadeVisible;
}