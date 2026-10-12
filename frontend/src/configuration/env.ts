/**
 * Базовый URL API (frontend.md, раздел 8; api.md, «Формат и типы»).
 *
 * Значение `NEXT_PUBLIC_API_BASE_URL` инлайнится в бандл при сборке
 * (хитрое место №1 frontend-plan.md: build-time конфигурация — «один образ —
 * одно окружение»; процесс-переменные читаются только в этом файле).
 * Дефолт — локальный backend для dev-прогона (specification.md).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";