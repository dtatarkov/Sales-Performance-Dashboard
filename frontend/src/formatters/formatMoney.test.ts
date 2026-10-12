import { describe, expect, it } from "vitest";

import { formatMoney } from "./formatMoney";

describe("formatMoney", () =>
{
  it("печатает реальный ноль как «0 ₽»", () =>
  {
    expect(formatMoney(0)).toBe("0 ₽");
  });

  it("форматирует малые суммы без дробной части", () =>
  {
    expect(formatMoney(450)).toBe("450 ₽");
  });

  it("округляет тысячи до целого", () =>
  {
    expect(formatMoney(385000)).toBe("385 тыс ₽");
  });

  it("форматирует миллионы с запятой и отбрасывает нули", () =>
  {
    expect(formatMoney(12400000)).toBe("12,4 млн ₽");
    expect(formatMoney(1000000)).toBe("1 млн ₽");
    expect(formatMoney(1050000)).toBe("1,05 млн ₽");
  });

  it("использует U+2212 для отрицательных значений", () =>
  {
    expect(formatMoney(-385000)).toBe("\u2212385 тыс ₽");
    expect(formatMoney(-12400000)).toBe("\u221212,4 млн ₽");
  });

  it("округляет значения чуть выше порога тысяч", () =>
  {
    expect(formatMoney(1000)).toBe("1 тыс ₽");
    expect(formatMoney(999999)).toBe("1000 тыс ₽");
  });
});