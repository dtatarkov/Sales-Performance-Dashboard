import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Конфигурация Vitest: юнит-тесты слоёв utils/api/hooks (frontend.md §11).
// Компоненты и виджеты не тестируются — ручная приёмка по состояниям (ui.md).
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    projects: [
      {
        // Юнит: всё, кроме hooks — чистая логика, DOM не нужен.
        // include без ограничений слоёв: новые тесты вне hooks (components,
        // widgets и т.д.) попадают сюда по умолчанию.
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/hooks/**"],
        },
      },
      {
        // Интеграционные: hooks — React (renderHook), DOM.
        test: {
          name: "hooks",
          environment: "jsdom",
          include: ["src/hooks/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});