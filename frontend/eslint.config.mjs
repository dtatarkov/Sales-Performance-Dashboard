import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Import boundaries слоёв frontend (frontend.md §2–3).
// Каждый блок конфига действует на файлы своего слоя и задаёт ПОЛНЫЙ набор
// ограничений no-restricted-imports для него: что слою запрещено импортировать
// из библиотек и из других слоёв проекта. Разрешено всё, что не попадает
// в запреты.

// --- Библиотеки (группы запретов) ---
const PKG_REACT = ["react", "react-dom", "react-dom/*"];
const PKG_NEXT = ["next", "next/**"];
const PKG_QUERY = ["@tanstack/*"];
const PKG_CHARTS = ["recharts", "recharts/*"];
const PKG_TOASTS = ["sonner", "sonner/*"];
const PKG_MOTION = ["motion", "motion/*"];
const PKG_FLOATING = ["@floating-ui/*"];
const PKG_DAYPICKER = ["react-day-picker", "react-day-picker/*"];
const PKG_DATES = ["date-fns", "date-fns/*"];

// --- Слои проекта (псевдоним @/ → src/, tsconfig paths) ---
const P_TYPES = "@/types/*";
const P_INTERFACES = "@/interfaces/*";
const P_UTILS = "@/utils/*";
const P_CONFIG = "@/configuration/*";
const P_API = "@/api/*";
const P_CONTEXTS = "@/contexts/*";
const P_HOOKS_ALL = "@/hooks/**";
const P_HOOKS_APP = "@/hooks/app/*";
const P_HOOKS_UI = "@/hooks/ui/*";
const P_HOOKS_DOMAIN = "@/hooks/domain/*";
const P_COMPONENTS = "@/components/**";
const P_WIDGETS = "@/widgets/*";
const P_APP = "@/app/**";

/**
 * Собирает массив запретов no-restricted-imports: отдельно для библиотек
 * и для слоёв проекта.
 *
 * @param {string[]} packages  gitignore-шаблоны запрещённых пакетов.
 * @param {string[]} projectPaths  gitignore-шаблоны запрещённых слоёв проекта.
 * @param {string} message  пояснение нарушения со ссылкой на документацию.
 * @returns {object[]} массив объектов { group, message } для no-restricted-imports.
 */
function forbid(packages, projectPaths, message) {
  return [
    { group: packages, message },
    { group: projectPaths, message },
  ];
}

const layerConfigs = [
  // types/ — только типы данных; ничего не импортирует, кроме соседних типов.
  {
    files: ["src/types/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [
              ...PKG_REACT,
              ...PKG_NEXT,
              ...PKG_QUERY,
              ...PKG_CHARTS,
              ...PKG_TOASTS,
              ...PKG_MOTION,
              ...PKG_FLOATING,
              ...PKG_DAYPICKER,
              ...PKG_DATES,
            ],
            [P_INTERFACES, P_UTILS, P_CONFIG, P_API, P_CONTEXTS, P_HOOKS_ALL, P_COMPONENTS, P_WIDGETS, P_APP],
            "types/ — только типы данных, без импортов слоёв и библиотек (frontend.md §3, AGENTS.md)",
          ),
        },
      ],
    },
  },

  // interfaces/ — публичные контракты; реализацию, константы и логику не содержит.
  // Может ссылаться только на типы данных и соседние контракты.
  {
    files: ["src/interfaces/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [
              ...PKG_REACT,
              ...PKG_NEXT,
              ...PKG_QUERY,
              ...PKG_CHARTS,
              ...PKG_TOASTS,
              ...PKG_MOTION,
              ...PKG_FLOATING,
              ...PKG_DAYPICKER,
              ...PKG_DATES,
            ],
            [P_UTILS, P_CONFIG, P_API, P_CONTEXTS, P_HOOKS_ALL, P_COMPONENTS, P_WIDGETS, P_APP],
            "interfaces/ — только контракты; реализация и константы запрещены (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // utils/ — чистые хелперы без React и домена; константы живут в configuration/.
  // Разрешены date-fns (форматирование дат) и types/interfaces.
  {
    files: ["src/utils/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [
              ...PKG_REACT,
              ...PKG_NEXT,
              ...PKG_QUERY,
              ...PKG_CHARTS,
              ...PKG_TOASTS,
              ...PKG_MOTION,
              ...PKG_FLOATING,
              ...PKG_DAYPICKER,
            ],
            [P_INTERFACES, P_CONFIG, P_API, P_CONTEXTS, P_HOOKS_ALL, P_COMPONENTS, P_WIDGETS, P_APP],
            "utils/ — чистые хелперы: без React, домена и констант (frontend.md §3, AGENTS.md)",
          ),
        },
      ],
    },
  },

  // configuration/ — типизированные константы; логики, расчётов и эффектов нет.
  // Разрешены date-fns (русская локаль календаря) и types/interfaces.
  {
    files: ["src/configuration/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [
              ...PKG_REACT,
              ...PKG_NEXT,
              ...PKG_QUERY,
              ...PKG_CHARTS,
              ...PKG_TOASTS,
              ...PKG_MOTION,
              ...PKG_FLOATING,
              ...PKG_DAYPICKER,
            ],
            [P_UTILS, P_API, P_CONTEXTS, P_HOOKS_ALL, P_COMPONENTS, P_WIDGETS, P_APP],
            "configuration/ — только значения без логики (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // api/ — детали API: транспорт, парсеры, мапперы. Не знает о React,
  // кэше и состояниях интерфейса. Разрешены date-fns (parseISO) и types/interfaces/utils/configuration.
  {
    files: ["src/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_REACT, ...PKG_NEXT, ...PKG_QUERY, ...PKG_CHARTS, ...PKG_TOASTS, ...PKG_MOTION, ...PKG_FLOATING, ...PKG_DAYPICKER],
            [P_CONTEXTS, P_HOOKS_ALL, P_COMPONENTS, P_WIDGETS, P_APP],
            "api/ не знает о React, кэше и состояниях интерфейса (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // contexts/ — нейтральный слой React-инфраструктуры: контексты, провайдеры,
  // обёртка QueryClientProvider. Никого не импортирует, кроме types/interfaces.
  {
    files: ["src/contexts/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_NEXT, ...PKG_CHARTS, ...PKG_TOASTS, ...PKG_MOTION, ...PKG_FLOATING, ...PKG_DAYPICKER, ...PKG_DATES],
            [P_UTILS, P_CONFIG, P_API, P_HOOKS_ALL, P_COMPONENTS, P_WIDGETS, P_APP],
            "contexts/ — слой без зависимостей: только types/interfaces и React-инфраструктура (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // hooks/app/ — граница URL (searchParams). next/navigation разрешён только здесь.
  {
    files: ["src/hooks/app/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_QUERY, ...PKG_CHARTS, ...PKG_TOASTS, ...PKG_MOTION, ...PKG_FLOATING, ...PKG_DAYPICKER, ...PKG_DATES],
            [P_API, P_CONTEXTS, P_HOOKS_DOMAIN, P_HOOKS_UI, P_COMPONENTS, P_WIDGETS, P_APP],
            "hooks/app/ — граница URL: searchParams и router.replace живут только здесь (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // hooks/ui/ — чистая логика представления: без api, domain-хуков и URL.
  {
    files: ["src/hooks/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_NEXT, ...PKG_QUERY, ...PKG_CHARTS, ...PKG_TOASTS, ...PKG_MOTION, ...PKG_FLOATING, ...PKG_DAYPICKER, ...PKG_DATES],
            [P_API, P_CONTEXTS, P_HOOKS_DOMAIN, P_HOOKS_APP, P_COMPONENTS, P_WIDGETS, P_APP],
            "hooks/ui/ — логика представления: без api, domain-хуков и URL (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // hooks/domain/ — доступ к данным: TanStack Query поверх api/, чтение query
  // из контекста. Не знает о виджетах, компонентах и URL.
  {
    files: ["src/hooks/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_NEXT, ...PKG_CHARTS, ...PKG_TOASTS, ...PKG_MOTION, ...PKG_FLOATING, ...PKG_DAYPICKER, ...PKG_DATES],
            [P_HOOKS_APP, P_HOOKS_UI, P_COMPONENTS, P_WIDGETS, P_APP],
            "hooks/domain/ — данные через api/ и кэш: без виджетов, компонентов и URL (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // components/ — render-only: props in → JSX out. Разрешены ui-хуки, утилиты,
  // типы, конфигурация и библиотеки отображения (графики, даты, поповеры).
  {
    files: ["src/components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_NEXT, ...PKG_QUERY],
            [P_API, P_CONTEXTS, P_HOOKS_DOMAIN, P_HOOKS_APP, P_WIDGETS, P_APP],
            "components/ — render-only: без domain/app-хуков, api, URL и контекстов (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // sonner импортируется ровно в одном файле — точке настройки <Toaster>
  // (frontend.md §13: «императивная граница — в одном месте»).
  {
    files: ["src/components/**"],
    ignores: ["src/components/ui/Toaster.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: [...PKG_TOASTS], message: "sonner импортируется только в components/ui/Toaster.tsx (frontend.md §13)" },
          ],
        },
      ],
    },
  },

  // widgets/ — блоки интерфейса: доменные хуки, ui-хуки, компоненты. Не знает
  // об api, next, контекстах и библиотеках напрямую.
  {
    files: ["src/widgets/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_NEXT, ...PKG_QUERY, ...PKG_CHARTS, ...PKG_MOTION, ...PKG_FLOATING, ...PKG_DAYPICKER, ...PKG_DATES],
            [P_API, P_CONTEXTS, P_APP],
            "widgets/ — доступ к данным только через hooks/domain, фильтрам через hooks/app (frontend.md §3)",
          ),
        },
      ],
    },
  },

  // toast.* вызывается только в widgets/toasts (frontend.md §6: императивная
  // граница — в одном месте); рендер тостов — через примитив components/ui/Toaster.
  {
    files: ["src/widgets/**"],
    ignores: ["src/widgets/toasts/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: [...PKG_TOASTS], message: "sonner импортируется только в widgets/toasts (вызовы toast.*) и components/ui/Toaster.tsx (настройка <Toaster>)" },
          ],
        },
      ],
    },
  },

  // app/ — страница-композиция: только виджеты, провайдеры контекстов и
  // hooks/app. Компоненты, api и доменные/ui-хуки — запрещены.
  {
    files: ["src/app/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbid(
            [...PKG_QUERY, ...PKG_CHARTS, ...PKG_TOASTS, ...PKG_MOTION, ...PKG_FLOATING, ...PKG_DAYPICKER, ...PKG_DATES],
            [P_API, P_COMPONENTS, P_HOOKS_DOMAIN, P_HOOKS_UI, P_UTILS, P_TYPES, P_INTERFACES, P_CONFIG],
            "app/ — composition root: импортирует только widgets, contexts и hooks/app (frontend.md §3)",
          ),
        },
      ],
    },
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...layerConfigs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;