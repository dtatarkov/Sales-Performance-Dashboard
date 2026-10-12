import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useDisclosure } from "./useDisclosure";

describe("useDisclosure", () =>
{
  it("по умолчанию закрыто", () =>
  {
    const { result } = renderHook(() => useDisclosure());

    expect(result.current.isOpen).toBe(false);
  });

  it("open/close/toggle переключают состояние", () =>
  {
    const { result } = renderHook(() => useDisclosure());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it("начальное состояние true задаётся параметром", () =>
  {
    const { result } = renderHook(() => useDisclosure(true));

    expect(result.current.isOpen).toBe(true);
  });
});
