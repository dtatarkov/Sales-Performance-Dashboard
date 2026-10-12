import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "./request";
import { ApiError } from "../errors/apiError";


afterEach(() =>
{
  vi.unstubAllGlobals();
});

describe("fetchData", () =>
{
  it("возвращает разобранный JSON успешного ответа", async () =>
  {
    const request = async () =>
      new Response(JSON.stringify({ value: 1 }), { status: 200 });

    await expect(fetchData(request)).resolves.toEqual({ value: 1 });
  });

  it("AbortError пробрасывается как есть — не ошибка запроса", async () =>
  {
    const abortError = new DOMException("Прервано", "AbortError");
    const request = async () =>
    {
      throw abortError;
    };

    await expect(fetchData(request)).rejects.toBe(abortError);
  });

  it("сетевой сбой конвертируется в ApiError без статуса и кода", async () =>
  {
    const request = async () =>
    {
      throw new TypeError("fetch failed");
    };

    const errorPromise = fetchData(request);

    await expect(errorPromise).rejects.toThrow(ApiError);

    let error: unknown = null;

    try
    {
      await errorPromise;
    } catch (caught)
    {
      error = caught;
    }

    const apiError = error as ApiError;

    expect(apiError.status).toBeNull();
    expect(apiError.code).toBeNull();
    expect(apiError.message).toBe("Не удалось связаться с сервером");
  });

  it("неуспешный ответ уходит в processResponse: 400 → ApiError", async () =>
  {
    const problem = { detail: "Период обязателен" };
    const request = async () =>
      new Response(JSON.stringify(problem), {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      });

    await expect(fetchData(request)).rejects.toThrow(/Период обязателен/);
  });

  it("тело 200 не JSON → ApiError, не сырой SyntaxError", async () =>
  {
    const request = async () =>
      new Response("<html>oops</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const errorPromise = fetchData(request);

    await expect(errorPromise).rejects.toThrow(ApiError);

    let error: unknown = null;

    try
    {
      await errorPromise;
    } catch (caught)
    {
      error = caught;
    }

    const apiError = error as ApiError;

    expect(apiError.status).toBe(200);
    expect(apiError.message).toContain("нечитаемый ответ");
  });
});
