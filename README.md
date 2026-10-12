# Sales Performance Dashboard

Дашборд аналитики продаж: ASP.NET Core API + Next.js. Один POST-запрос
`/api/v1/dashboard` считает 11 блоков дашборда (KPI, рейтинги и сравнение
менеджеров, клиенты, временные ряды, категории, товары, лента сделок,
возвраты, отмены) из PostgreSQL и отдаёт их одним JSON-ответом; фронтенд
получает готовые числа и только отображает их — бизнес-метрики на клиенте
не считаются.

## Стек

| Часть | Технологии |
|---|---|
| Backend | .NET 8, ASP.NET Core (Web API), EF Core 8 + Npgsql, PostgreSQL 16, xUnit (+ Testcontainers) |
| Frontend | Next.js (App Router), TypeScript, TanStack Query v5, Recharts, Tailwind v4, sonner |
| Инфраструктура | Docker Compose: `postgres` + `backend` + `frontend` |

## Запуск

```bash
docker compose up --build
```

- Фронтенд: http://localhost:3000
- API: http://localhost:8080, Swagger UI: http://localhost:8080/swagger

При старте backend применяет миграции и наполняет БД детерминированным
seed-датасетом (~12 месяцев истории, несколько тысяч сделок). Раздельный
запуск и отладка — в [backend/README.md](backend/README.md) и
[frontend/README.md](frontend/README.md).

## Структура репозитория

```
backend/     # ASP.NET Core API (Clean Architecture: Domain → Application →
             #   Infrastructure/Api) + тесты         → backend/README.md
frontend/    # Next.js-дашборд (виджеты 11 блоков)  → frontend/README.md
docs/        # актуальные документы:
             #   domain.md       — бизнес-правила, формулы, константы внимания
             #   specification.md — требования задания
docs/archive # документы прошлых этапов разработки (см. ниже)
```

## Документация

**Актуальные документы** — `docs/domain.md` (единственный источник
бизнес-правил), `docs/specification.md` (требования) и три README
этого репозитория: корневой, [backend/README.md](backend/README.md)
(архитектура API, схема данных, контракт, запуск) и
[frontend/README.md](frontend/README.md) (архитектура, URL-контракт,
UI-правила, состояния). README самодостаточны для ежедневной работы —
актуальные части документов прошлых этапов перенесены в них.

**[docs/archive/](docs/archive/)** — документы, использовавшиеся на других
этапах разработки и сохранённые как исторический контекст:

| Документ | Содержимое | Актуальная выжимка |
|---|---|---|
| `api.md` | Полный JSON-контракт, ошибки, enum-значения | backend/README.md, «Контракт API (кратко)»; frontend/README.md, «Контракт API» |
| `backend.md` | Архитектура слоёв, SOLID, поток запроса, отмена | backend/README.md |
| `db.md` | Схема БД, индексы и их обоснования | backend/README.md, «Схема данных» |
| `frontend.md` | Архитектура frontend, контракты слоёв, обоснование библиотек | frontend/README.md |
| `ui.md` | Полная UI-спецификация: блоки, состояния, форматы | frontend/README.md, «UI-правила» |
| `backend-plan.md`, `frontend-plan.md` | Планы реализации (выполнены) | — |
| `dashboard.html`, `dashboard-states.html` | Референсные HTML-макеты дашборда | — |
| `datepicker-mockup.html`, `toast-notification.html` | Макеты пикера дат и тоста | — |

## Проверки

Правила и стиль кода — [AGENTS.md](AGENTS.md). Кратко:

- **Frontend** (в `frontend/`): `npx tsc --noEmit` → `npm run lint` →
  целевые `vitest` → `curl localhost:3000`.
- **Backend**: `dotnet build` → `dotnet test` на `backend/SalesDashboard.slnx`;
  перед сдачей правок — пересборка контейнера
  (`docker compose up -d --build backend`).
