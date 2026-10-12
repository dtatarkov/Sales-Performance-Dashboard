import { describe, expect, it } from "vitest";

import
{
  parseDashboardQuery,
  serializeQuery,
  normalizeQuery,
} from "./useDashboardQuery";
import { resolvePresetRange } from "../../utils/resolvePresetRange";
import { toIsoDate } from "../../utils/toIsoDate";
import
{
  DEFAULT_PERIOD_PRESET,
  DEFAULT_SEGMENT,
} from "../../configuration/dashboard";

/** Фиксированный «сегодня»: 6 октября 2026 UTC. */
const NOW = new Date("2026-10-06T12:00:00Z");

/** Дефолтный диапазон пресета 30d на NOW (для ожиданий). */
const DEFAULT_RANGE = resolvePresetRange(DEFAULT_PERIOD_PRESET, NOW);

describe("parseDashboardQuery (чтение URL)", () =>
{
  it("пустой URL → дефолтный диапазон пресета и все сегменты", () =>
  {
    const result = parseDashboardQuery(new URLSearchParams(""), NOW);

    expect(result).toEqual({
      from: DEFAULT_RANGE.from,
      to: DEFAULT_RANGE.to,
      segment: null,
    });
  });

  it("валидные from/to читаются как есть", () =>
  {
    const params = new URLSearchParams("from=2026-09-01&to=2026-09-10");

    expect(parseDashboardQuery(params, NOW)).toEqual({
      from: "2026-09-01",
      to: "2026-09-10",
      segment: null,
    });
  });

  it("сегмент читается и валидируется", () =>
  {
    const params = new URLSearchParams(
      "from=2026-09-01&to=2026-09-10&segment=smb",
    );

    expect(parseDashboardQuery(params, NOW).segment).toBe("smb");
  });

  it("невалидный сегмент → дефолт (все сегменты)", () =>
  {
    const params = new URLSearchParams(
      "from=2026-09-01&to=2026-09-10&segment=vip",
    );

    expect(parseDashboardQuery(params, NOW).segment).toBeNull();
  });

  it.each([
    ["не-дата: from=abc", "from=abc&to=2026-09-10"],
    ["несуществующий день: 30 февраля", "from=2026-02-30&to=2026-09-10"],
    ["не-дата: to", "from=2026-09-01&to=zzz"],
  ])("%s → дефолтный диапазон", (_name, search) =>
  {
    const result = parseDashboardQuery(new URLSearchParams(search), NOW);

    expect(result.from).toBe(DEFAULT_RANGE.from);
    expect(result.to).toBe(DEFAULT_RANGE.to);
  });

  it("from > to → дефолтный диапазон, сегмент сохраняется", () =>
  {
    const params = new URLSearchParams(
      "from=2026-09-10&to=2026-09-01&segment=enterprise",
    );

    const result = parseDashboardQuery(params, NOW);

    expect(result.from).toBe(DEFAULT_RANGE.from);
    expect(result.to).toBe(DEFAULT_RANGE.to);
    expect(result.segment).toBe("enterprise");
  });

  it("частично валидный URL (один из дней) → дефолтный диапазон", () =>
  {
    const result = parseDashboardQuery(
      new URLSearchParams("from=2026-09-01"),
      NOW,
    );

    expect(result.from).toBe(DEFAULT_RANGE.from);
    expect(result.to).toBe(DEFAULT_RANGE.to);
  });
});

describe("normalizeQuery (правила нормализации)", () =>
{
  it("валидный порядок сохраняется", () =>
  {
    const result = normalizeQuery(
      toIsoDate("2026-09-01")!,
      toIsoDate("2026-09-05")!,
      "smb",
      NOW,
    );

    expect(result).toEqual({
      from: "2026-09-01",
      to: "2026-09-05",
      segment: "smb",
    });
  });

  it("отсутствующий сегмент → DEFAULT_SEGMENT", () =>
  {
    const result = normalizeQuery(
      toIsoDate("2026-09-01")!,
      toIsoDate("2026-09-05")!,
      null,
      NOW,
    );

    expect(result.segment).toBe(DEFAULT_SEGMENT);
  });
});

describe("round-trip parse ↔ serialize", () =>
{
  it("сериализованный query парсится в равный query", () =>
  {
    const original = {
      from: toIsoDate("2026-09-01")!,
      to: toIsoDate("2026-09-20")!,
      segment: "mid-market" as const,
    };

    const serialized = serializeQuery(original);
    const reparsed = parseDashboardQuery(
      new URLSearchParams(serialized.slice(1)),
      NOW,
    );

    expect(reparsed).toEqual(original);
  });

  it("null-сегмент не попадает в URL", () =>
  {
    const serialized = serializeQuery({
      from: toIsoDate("2026-09-01")!,
      to: toIsoDate("2026-09-20")!,
      segment: null,
    });

    expect(serialized).toBe("?from=2026-09-01&to=2026-09-20");
  });
});