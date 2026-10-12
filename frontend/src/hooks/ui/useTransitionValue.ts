"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Двухфазное обновление значения для CSS-transition (ui.md, «Анимации»):
 * при изменении target первый рендер остаётся на предыдущем отображаемом
 * значении, целевое подставляется кадром позже (requestAnimationFrame после
 * commit). Браузер гарантированно успевает зафиксировать prev-значение,
 * поэтому transition проигрывается ровно prev → current — без «прыжка» к
 * промежуточному состоянию при приходе новых данных (SWR-обновление, смена
 * датасета). Для новой строки (первый рендер) значение ставится сразу:
 * предыдущего нет, анимация не нужна.
 *
 * @param target целевое значение (например, длина бара, 0–100).
 * @returns значение для рендера (prev до старта перехода, далее target).
 */
export function useTransitionValue(target: number): number
{
  const [displayed, setDisplayed] = useState(target);

  // Актуальное отображаемое значение — в ref: rAF-кадр читает и пишет его
  // без пересоздания эффекта (тот же приём, что в useAnimatedCounter).
  const displayedRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() =>
  {
    // Изменения нет (в т.ч. первый рендер) — значение уже целевое.
    if (displayedRef.current === target)
    {
      return;
    }

    const frame = requestAnimationFrame(() =>
    {
      displayedRef.current = target;
      setDisplayed(target);
    });

    frameRef.current = frame;

    return () =>
    {
      if (frameRef.current !== null)
      {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [target]);

  return displayed;
}
