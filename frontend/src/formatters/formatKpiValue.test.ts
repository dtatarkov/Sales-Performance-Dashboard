import { describe, expect, it } from "vitest";

import { formatKpiValue } from "./formatKpiValue";

describe("formatKpiValue", () =>
{
  describe("все метрики: null → «—»", () =>
  {
    it.each([
      "revenue",
      "gp",
      "margin",
      "salesCount",
      "avgCheck",
    ] as const)("null при metricId=%s → «—»", (metricId) =>
    {
      expect(formatKpiValue(null, metricId)).toBe("\u2014");
    });
  });

  describe("деньги: revenue, gp, avgCheck → formatMoney", () =>
  {
    it.each([
      ["revenue", 0, "0 ₽"],
      ["revenue", 450, "450 ₽"],
      ["revenue", 385000, "385 тыс ₽"],
      ["revenue", 12400000, "12,4 млн ₽"],
      ["revenue", -12400000, "\u221212,4 млн ₽"],
      ["gp", 0, "0 ₽"],
      ["gp", 999999, "1000 тыс ₽"],
      ["gp", 12400000, "12,4 млн ₽"],
      ["avgCheck", 0, "0 ₽"],
      ["avgCheck", 450, "450 ₽"],
      ["avgCheck", 41666.67, "42 тыс ₽"],
    ] as const)("money %s: %i → «%s»", (metricId, value, expected) =>
    {
      expect(formatKpiValue(value, metricId)).toBe(expected);
    });
  });

  describe("проценты: margin → formatPercent", () =>
  {
    it.each([
      ["margin", 0, "0,0%"],
      ["margin", 26.2, "26,2%"],
      ["margin", -3.14, "-3,1%"],
      ["margin", 100, "100,0%"],
      ["margin", 40.123, "40,1%"],
    ] as const)("percent %s: %i → «%s»", (metricId, value, expected) =>
    {
      expect(formatKpiValue(value, metricId)).toBe(expected);
    });
  });

  describe("счётчики: salesCount → formatNumber", () =>
  {
    it.each([
      ["salesCount", 0, "0"],
      ["salesCount", 7, "7"],
      ["salesCount", 12345, "12\u00A0345"],
    ] as const)("count %s: %i → «%s»", (metricId, value, expected) =>
    {
      expect(formatKpiValue(value, metricId)).toBe(expected);
    });
  });

  it("ноль не превращается в «—» (revenue)", () =>
  {
    expect(formatKpiValue(0, "revenue")).toBe("0 ₽");
  });
});
