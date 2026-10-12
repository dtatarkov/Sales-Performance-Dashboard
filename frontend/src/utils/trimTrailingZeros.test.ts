import { describe, expect, it } from "vitest";

import { trimTrailingZeros } from "./trimTrailingZeros";

describe("trimTrailingZeros", () =>
{
  it.each([
    ["1,50", "1,5"],
    ["1,00", "1"],
    ["1,05", "1,05"],
    ["10,50", "10,5"],
    ["0,00", "0"],
    ["1234567,80", "1234567,8"],
  ] as const)("«%s» → «%s»", (value, expected) =>
  {
    expect(trimTrailingZeros(value)).toBe(expected);
  });
});
