import { describe, expect, it } from "vitest";

import { plural } from "./plural";

describe("plural", () =>
{
  it.each([
    [1, "продажа"],
    [2, "продажи"],
    [5, "продаж"],
    [11, "продаж"],
    [12, "продаж"],
    [21, "продажа"],
    [22, "продажи"],
    [0, "продаж"],
  ] as const)("формы для %i → %s", (count, expected) =>
  {
    expect(plural(count, "продажа", "продажи", "продаж")).toBe(expected);
  });
});
