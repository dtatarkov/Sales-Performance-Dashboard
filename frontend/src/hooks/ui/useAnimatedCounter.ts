"use client";

import { useEffect, useRef, useState } from "react";

import { CHART_ANIMATION } from "../../configuration/charts";

/**
 * Анимация числа к новому значению (frontend-plan.md, этап 5; KPI-карточки,
 * суммы потерь): при смене целевого значения число плавно «докручивается» от
 * текущего к новому за CHART_ANIMATION.durationMs (ui.md, «контент плавно
 * обновится»; длительность единая с CSS-transition чартов).
 *
 * Логика: rAF-цикл интерполирует по easing (ease-out cubic); при смене target
 * анимация стартует от текущего отображаемого значения. После размонтирования
 * кадры отменяются.
 *
 * @param target целевое значение (любое конечное число).
 * @returns текущее отображаемое значение (дробное — округляет отображение).
 */
export function useAnimatedCounter(target: number): number
{
  const [displayed, setDisplayed] = useState(target);

  // Текущее значение хранится в ref: rAF-цикл читает актуальное число без
  // пересоздания эффекта, а целевое значение меняет только эффект.
  const displayedRef = useRef(target);
  const frameRef = useRef<number | null>(null);

  useEffect(() =>
  {
    const startTime = performance.now();
    const startValue = displayedRef.current;

    // Нет изменения — анимация не нужна (в т.ч. первый рендер).
    if (startValue === target)
    {
      setDisplayed(target);

      return;
    }

    const step = (now: number) =>
    {
      const progress = Math.min((now - startTime) / CHART_ANIMATION.durationMs, 1);

      // ease-out cubic: быстрый старт, плавное замедление.
      const eased = 1 - (1 - progress) ** 3;
      const value = startValue + (target - startValue) * eased;

      displayedRef.current = value;
      setDisplayed(value);

      if (progress < 1)
      {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

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