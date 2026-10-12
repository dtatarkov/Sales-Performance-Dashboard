import { describe, expect, it } from "vitest";

import { moneyScaleOf, formatScaledMoney, formatScaledMoneyAmount } from "./moneyScale";

describe("moneyScaleOf", () =>
{
  it("миллионы — одна десятичная", () =>
  {
    const scale = moneyScaleOf(12_400_000);

    expect(scale.divisor).toBe(1_000_000);
    expect(scale.unit).toBe("млн ₽");
    expect(scale.fractionDigits).toBe(1);
  });

  it("тысячи — целые", () =>
  {
    const scale = moneyScaleOf(385_000);

    expect(scale.divisor).toBe(1_000);
    expect(scale.unit).toBe("тыс ₽");
    expect(scale.fractionDigits).toBe(0);
  });

  it("малые суммы — рубли", () =>
  {
    const scale = moneyScaleOf(450);

    expect(scale.divisor).toBe(1);
    expect(scale.unit).toBe("₽");
    expect(scale.fractionDigits).toBe(0);
  });

  it("пороговые значения 1 млн и 1 тыс", () =>
  {
    expect(moneyScaleOf(1_000_000).unit).toBe("млн ₽");
    expect(moneyScaleOf(999_999).unit).toBe("тыс ₽");
    expect(moneyScaleOf(1_000).unit).toBe("тыс ₽");
    expect(moneyScaleOf(999).unit).toBe("₽");
  });

  it("отрицательный максимум — масштаб по модулю", () =>
  {
    expect(moneyScaleOf(-12_400_000).unit).toBe("млн ₽");
  });

  it("ноль — рубли", () =>
  {
    expect(moneyScaleOf(0).unit).toBe("₽");
  });
});

describe("formatScaledMoneyAmount", () =>
{
  it("делит на делитель, округляет до знаков масштаба и отбрасывает нули", () =>
  {
    const scale = moneyScaleOf(12_400_000);

    expect(formatScaledMoneyAmount(12_400_000, scale)).toBe("12,4");
    expect(formatScaledMoneyAmount(1_000_000, scale)).toBe("1");
    expect(formatScaledMoneyAmount(1_500_000, scale)).toBe("1,5");
  });

  it("тысячи — целые числа", () =>
  {
    const scale = moneyScaleOf(385_000);

    expect(formatScaledMoneyAmount(385_000, scale)).toBe("385");
    expect(formatScaledMoneyAmount(999_999, scale)).toBe("1000");
  });

  it("ноль — «0»", () =>
  {
    const scale = moneyScaleOf(385_000);

    expect(formatScaledMoneyAmount(0, scale)).toBe("0");
  });

  it("отрицательное — U+2212 перед числом", () =>
  {
    const scale = moneyScaleOf(12_400_000);

    expect(formatScaledMoneyAmount(-12_400_000, scale)).toBe("\u221212,4");
  });
});

describe("formatScaledMoney", () =>
{
  it("число плюс подпись единицы", () =>
  {
    const scale = moneyScaleOf(12_400_000);

    expect(formatScaledMoney(12_400_000, scale)).toBe("12,4 млн ₽");
    expect(formatScaledMoney(1_000_000, scale)).toBe("1 млн ₽");
  });

  it("реальный ноль — «0 ₽» в рублёвом масштабе", () =>
  {
    const scale = moneyScaleOf(0);

    expect(formatScaledMoney(0, scale)).toBe("0 ₽");
  });

  it("отрицательное — U+2212", () =>
  {
    const scale = moneyScaleOf(385_000);

    expect(formatScaledMoney(-385_000, scale)).toBe("\u2212385 тыс ₽");
  });
});
