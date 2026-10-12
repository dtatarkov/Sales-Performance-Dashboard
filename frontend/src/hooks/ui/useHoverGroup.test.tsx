import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useHoverGroup } from "./useHoverGroup";

describe("useHoverGroup", () =>
{
  it("изначально ничего не подсвечено", () =>
  {
    const { result } = renderHook(() => useHoverGroup());

    expect(result.current.highlightedId).toBeNull();
  });

  it("highlight включает подсветку, clear сбрасывает", () =>
  {
    const { result } = renderHook(() => useHoverGroup());

    act(() => result.current.highlight("cat-1"));
    expect(result.current.highlightedId).toBe("cat-1");

    // Смена подсветки на другой элемент группы.
    act(() => result.current.highlight("cat-2"));
    expect(result.current.highlightedId).toBe("cat-2");

    act(() => result.current.clearHighlight());
    expect(result.current.highlightedId).toBeNull();
  });
});
