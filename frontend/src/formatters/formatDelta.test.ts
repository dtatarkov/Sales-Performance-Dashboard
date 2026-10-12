import { describe, expect, it } from "vitest";

import
{
  formatArrowDelta,
  formatArrowMoney,
  formatDelta,
  formatDeltaPercent,
  formatDeltaPoints,
  formatMultiplier,
} from "./formatDelta";

describe("formatDeltaPercent", () =>
{
  it("форматирует рост стрелкой и плюсом", () =>
  {
    const formatted = formatDeltaPercent(12.4);

    expect(formatted.text).toBe("\u25B2 +12,4%");
    expect(formatted.color).toBe("positive");
  });

  it("форматирует падение U+2212", () =>
  {
    const formatted = formatDeltaPercent(-3.1);

    expect(formatted.text).toBe("\u25BC \u22123,1%");
    expect(formatted.color).toBe("negative");
  });

  it("null → «—» нейтральным", () =>
  {
    const formatted = formatDeltaPercent(null);

    expect(formatted.text).toBe("\u2014");
    expect(formatted.color).toBe("neutral");
  });

  it("ноль — без стрелки и знака, нейтральный", () =>
  {
    const formatted = formatDeltaPercent(0);

    expect(formatted.text).toBe("0,0%");
    expect(formatted.color).toBe("neutral");
  });
});

describe("formatDeltaPoints", () =>
{
  it("форматирует в процентных пунктах", () =>
  {
    const growth = formatDeltaPoints(0.9);
    const fall = formatDeltaPoints(-1.5);

    expect(growth.text).toBe("\u25B2 +0,9 п.п.");
    expect(growth.color).toBe("positive");
    expect(fall.text).toBe("\u25BC \u22121,5 п.п.");
    expect(fall.color).toBe("negative");
  });

  it("null → «—» нейтральным", () =>
  {
    const formatted = formatDeltaPoints(null);

    expect(formatted.text).toBe("\u2014");
    expect(formatted.color).toBe("neutral");
  });
});

describe("formatDelta", () =>
{
  it("подставляет суффикс из unit percent", () =>
  {
    const formatted = formatDelta({ value: 12.4, unit: "percent" });

    expect(formatted.text).toBe("\u25B2 +12,4%");
    expect(formatted.color).toBe("positive");
  });

  it("подставляет суффикс из unit pp", () =>
  {
    const formatted = formatDelta({ value: 1.2, unit: "pp" });

    expect(formatted.text).toBe("\u25B2 +1,2 п.п.");
    expect(formatted.color).toBe("positive");
  });

  it("падение — negative в обеих единицах", () =>
  {
    const percent = formatDelta({ value: -0.4, unit: "percent" });
    const points = formatDelta({ value: -0.4, unit: "pp" });

    expect(percent.color).toBe("negative");
    expect(points.color).toBe("negative");
  });

  it("null → «—» нейтральным", () =>
  {
    const formatted = formatDelta(null);

    expect(formatted.text).toBe("\u2014");
    expect(formatted.color).toBe("neutral");
  });
});

describe("formatDelta — флаг negative (плохая метрика)", () =>
{
  it("рост плохой метрики в pp — negative (красный)", () =>
  {
    const formatted = formatDelta({ value: 0.9, unit: "pp" }, true);

    expect(formatted.text).toBe("\u25B2 +0,9 п.п.");
    expect(formatted.color).toBe("negative");
  });

  it("падение плохой метрики — positive (зелёный)", () =>
  {
    const formatted = formatDelta({ value: -1.5, unit: "pp" }, true);

    expect(formatted.text).toBe("\u25BC \u22121,5 п.п.");
    expect(formatted.color).toBe("positive");
  });

  it("уважает unit percent: суффикс «%», а не « п.п.»", () =>
  {
    const formatted = formatDelta({ value: 2.4, unit: "percent" }, true);

    expect(formatted.text).toBe("\u25B2 +2,4%");
    expect(formatted.color).toBe("negative");
  });

  it("ноль плохой метрики — нейтральный", () =>
  {
    const formatted = formatDelta({ value: 0, unit: "pp" }, true);

    expect(formatted.color).toBe("neutral");
  });

  it("null → «—» нейтральным независимо от флага", () =>
  {
    const formatted = formatDelta(null, true);

    expect(formatted.text).toBe("\u2014");
    expect(formatted.color).toBe("neutral");
  });
});

describe("formatArrowMoney", () =>
{
  it("рост — стрелка вверх, без плюса и без валюты", () =>
  {
    expect(formatArrowMoney(35000)).toBe("\u25B2 35 тыс");
  });

  it("падение — стрелка вниз, без минуса и без валюты", () =>
  {
    expect(formatArrowMoney(-35000)).toBe("\u25BC 35 тыс");
  });

  it("миллионы — сокращение без валюты, одна десятичная", () =>
  {
    expect(formatArrowMoney(12_400_000)).toBe("\u25B2 12,4 млн");
  });

  it("малые суммы — рубли с валютой", () =>
  {
    expect(formatArrowMoney(450)).toBe("\u25B2 450 ₽");
  });

  it("ноль — без стрелки («0 ₽»)", () =>
  {
    expect(formatArrowMoney(0)).toBe("0 ₽");
  });
});

describe("formatArrowDelta", () =>
{
  it("percent — стрелка и число без знака", () =>
  {
    expect(formatArrowDelta({ value: 12.4, unit: "percent" })).toBe("\u25B2 12,4%");
  });

  it("pp — стрелка вниз без минуса", () =>
  {
    expect(formatArrowDelta({ value: -1.5, unit: "pp" })).toBe("\u25BC 1,5 п.п.");
  });

  it("ноль — без стрелки", () =>
  {
    expect(formatArrowDelta({ value: 0, unit: "percent" })).toBe("0,0%");
  });

  it("null → «—»", () =>
  {
    expect(formatArrowDelta(null)).toBe("\u2014");
  });
});

describe("formatMultiplier", () =>
{
  it("кратность с запятой и знаком ×", () =>
  {
    expect(formatMultiplier(1.7)).toBe("1,7×");
  });

  it("null → «—»", () =>
  {
    expect(formatMultiplier(null)).toBe("\u2014");
  });
});