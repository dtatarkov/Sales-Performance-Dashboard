import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useAnimatedCounter } from "./useAnimatedCounter";

describe("useAnimatedCounter", () => {
  it("первый рендер возвращает target без анимации", () => {
    const { result } = renderHook(() => useAnimatedCounter(42));

    expect(result.current).toBe(42);
  });

  it("по завершении анимации значение равно target", async () => {
    // Подменить rAF на мгновенное исполнение (progress >= 1 за один кадр).
    vi.stubGlobal(
      "requestAnimationFrame",
      (callback: (now: number) => void) => {
        callback(performance.now() + 10_000);

        return 1;
      },
    );

    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useAnimatedCounter(value),
      { initialProps: { value: 100 } },
    );

    rerender({ value: 200 });

    // Анимация «мгновенная» (rAF подменён) — сразу после rerender значение
    // докручивается к target. Даём микротаскам исполниться.
    await Promise.resolve();

    expect(result.current).toBe(200);

    vi.unstubAllGlobals();
  });

  it("одинаковое значение не запускает анимацию", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useAnimatedCounter(value),
      { initialProps: { value: 7 } },
    );

    rerender({ value: 7 });

    expect(result.current).toBe(7);
  });
});