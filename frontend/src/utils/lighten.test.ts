import { describe, expect, it } from "vitest";

import { lighten } from "./lighten";

describe("lighten", () =>
{
  it("0% — цвет без изменений", () =>
  {
    expect(lighten("#3b82f6", 0)).toBe("#3b82f6");
  });

  it("100% — белый", () =>
  {
    expect(lighten("#3b82f6", 100)).toBe("#ffffff");
  });

  it("смешивает каждый канал с белым пропорционально", () =>
  {
    // 50%: канал → середина между каналом и 255.
    expect(lighten("#000000", 50)).toBe("#808080");

    // 16→(16+255)/2≈136=0x88, 32→0x90, 48→0x98.
    expect(lighten("#102030", 50)).toBe("#889098");
  });

  it("малый процент даёт лёгкий tint", () =>
  {
    // 20%: 59 + (255−59)×0,2 = 98,2 → 98 = 0x62; 0-каналы → 51 = 0x33.
    expect(lighten("#3b0000", 20)).toBe("#623333");
  });

  it("работает с большими буквами и с решёткой", () =>
  {
    expect(lighten("#FF0000", 100)).toBe("#ffffff");
  });

  it("процент вне диапазона обрезается (clamp)", () =>
  {
    expect(lighten("#3b82f6", -5)).toBe("#3b82f6");
    expect(lighten("#3b82f6", 150)).toBe("#ffffff");
  });
});
