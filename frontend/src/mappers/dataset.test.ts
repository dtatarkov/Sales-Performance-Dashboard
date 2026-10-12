import { describe, expect, it } from "vitest";

import { mapDataset } from "./dataset";

describe("mapDataset", () =>
{
  it("переносит name и маппит items переданной функцией", () =>
  {
    const result = mapDataset(
      { name: "По выручке", items: ["10", "20"] },
      (raw) => Number(raw),
    );

    expect(result.name).toBe("По выручке");
    expect(result.items).toEqual([10, 20]);
  });

  it("передаёт индекс элемента в item-маппер", () =>
  {
    const result = mapDataset(
      { name: "Выручка", items: ["a", "b", "c"] },
      (raw, index) => `${index}:${raw}`,
    );

    expect(result.items).toEqual(["0:a", "1:b", "2:c"]);
  });

  it("пустой items → пустой массив", () =>
  {
    const result = mapDataset({ name: "Пустой", items: [] }, (raw) => raw);

    expect(result.items).toEqual([]);
  });
});
