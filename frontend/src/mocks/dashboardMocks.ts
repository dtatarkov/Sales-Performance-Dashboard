/*
 * DTO-моки для тестов слоя api и domain-хуков: минимально валидный ответ
 * api.md, переопределяются только проверяемые поля (глубокие срезы
 * не дублируются). Моки — тестовые данные, вне тестов не импортируются.
 */

import type {
  CategoriesDto,
  CancellationsDto,
  CustomerDynamicsDto,
  CustomerTopDto,
  DashboardDto,
  KpiDto,
  ManagerComparisonDto,
  ManagerRatingDto,
  ManagerRatingItemDto,
  ProductsDto,
  RecentSalesDto,
  RefundsDto,
  TimeSeriesDto,
} from "../types/dto";

/**
 * Базовая KPI-карточка: значение есть, Δ нет, серия пустая.
 *
 * @param value значение карточки или null («—»).
 * @returns KpiCardDto.
 */
export function createKpiCardMock(value: number | null = 100)
{
  return { value, delta: null, series: [] };
}

/**
 * Базовая секция kpi: все пять карточек с значениями, лидер есть
 * (createBestManagerDtoMock). Ветка «лидера нет» переопределяется в тесте:
 * kpi.bestManager = null.
 *
 * @returns KpiDto.
 */
export function createKpiDtoMock(): KpiDto
{
  return {
    revenue: createKpiCardMock(1000),
    gp: createKpiCardMock(400),
    margin: createKpiCardMock(40),
    salesCount: createKpiCardMock(10),
    avgCheck: createKpiCardMock(100),
    bestManager: createBestManagerDtoMock(),
  };
}

/**
 * Карточка лидера «Лучший менеджер» по api.md: все поля валидны.
 *
 * @returns BestManagerDto.
 */
export function createBestManagerDtoMock(): NonNullable<KpiDto["bestManager"]>
{
  return {
    id: "m1",
    name: "Иван Иванов",
    avatar: null,
    initials: "ИИ",
    gp: 200000,
    salesCount: 12,
    delta: { value: 8, unit: 1 },
    series: [{ value: 100, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" }],
  };
}

/**
 * Строка рейтинга менеджера по api.md: все Δ есть, margin/cancelRate null.
 *
 * @returns ManagerRatingItemDto.
 */
export function createManagerRatingItemMock(): ManagerRatingItemDto
{
  return {
    id: "m1",
    name: "Иван Иванов",
    avatar: null,
    initials: "ИИ",
    team: "Альфа",
    salesCount: 12,
    revenue: 500000,
    revenueDelta: { value: 12.5, unit: 1 },
    gp: 200000,
    gpDelta: { value: 8, unit: 1 },
    ac: 41666.67,
    acDelta: null,
    margin: 40,
    marginDelta: { value: 1.2, unit: 2 },
    cancelRate: null,
    cancelRateDelta: null,
    contribution: {
      valueAbsolute: 200000,
      valueRelative: 40,
      valueRelativeUnit: 2,
      valueNormalized: 100,
    },
  };
}

/**
 * Базовый ответ api.md со всеми 11 секциями: по одной строке в каждом
 * датасете, у блоков 10/11 хвост есть (возвраты) и нет (отмены).
 *
 * @returns DashboardDto.
 */
export function createDashboardDtoMock(): DashboardDto
{
  const ratingItem = createManagerRatingItemMock();

  const managerRating: ManagerRatingDto = {
    datasets: [{ name: "По выручке", items: [ratingItem] }],
  };

  const managerComparison: ManagerComparisonDto = {
    datasets: [
      {
        name: "По выручке",
        items: [
          { id: "m1", name: "Иван Иванов", team: "Alpha", value: 500000, delta: null },
        ],
      },
    ],
  };

  const topCustomers: CustomerTopDto = {
    datasets: [
      {
        name: "По выручке",
        items: [
          {
            id: "c1",
            name: "ООО Ромашка",
            since: 2019,
            orderCount: 8,
            revenue: 320000,
            revenueDelta: null,
            gp: 128000,
            gpDelta: null,
            ac: 40000,
            acDelta: null,
            margin: 40,
            marginDelta: null,
            refundRate: null,
            refundRateDelta: null,
            cancelRate: null,
            cancelRateDelta: null,
            contribution: {
              valueAbsolute: 128000,
              valueRelative: 40,
              valueRelativeUnit: 2,
              valueNormalized: 100,
            },
          },
        ],
      },
    ],
  };

  const customerDynamics: CustomerDynamicsDto = {
    growth: [
      {
        name: "Валовая прибыль",
        items: [
          { id: "c1", name: "ООО Ромашка", valueNormalized: 100, absoluteDelta: 35_000, delta: null },
        ],
      },
      {
        name: "Средний чек",
        items: [
          { id: "c2", name: "ООО Лютик", valueNormalized: 100, absoluteDelta: 4_800, delta: null },
        ],
      },
    ],
    decline: [
      {
        name: "Валовая прибыль",
        items: [
          { id: "c3", name: "ИП Петров", valueNormalized: 100, absoluteDelta: -9_500, delta: null },
        ],
      },
      {
        name: "Средний чек",
        items: [
          { id: "c4", name: "ООО Василёк", valueNormalized: 100, absoluteDelta: -2_100, delta: null },
        ],
      },
    ],
  };

  const timeSeries: TimeSeriesDto = {
    datasets: [
      {
        name: "Выручка",
        items: [
          {
            dateFrom: "2026-09-17T00:00:00Z",
            dateTo: "2026-09-18T00:00:00Z",
            valueCurrent: 100,
            valuePrevious: 90,
          },
        ],
      },
    ],
  };

  const categories: CategoriesDto = {
    datasets: [
      {
        name: "По выручке",
        total: 500000,
        items: [
          {
            id: "cat1",
            name: "Ноутбуки",
            revenue: 300000,
            revenueDelta: null,
            gp: 120000,
            gpDelta: null,
            margin: 40,
            marginDelta: null,
            salesCount: 6,
            salesCountDelta: null,
            share: 60,
          },
        ],
      },
    ],
  };

  const topProducts: ProductsDto = {
    datasets: [
      {
        name: "По выручке",
        items: [
          {
            id: "p1",
            name: "Ноутбук Pro",
            sku: "NP-001",
            category: "Ноутбуки",
            revenue: 150000,
            revenueDelta: null,
            gp: 60000,
            gpDelta: null,
            units: 3,
            unitsDelta: null,
            margin: 40,
            marginDelta: null,
            refundRate: null,
            refundRateDelta: null,
            contribution: {
              valueAbsolute: 60000,
              valueRelative: 20,
              valueRelativeUnit: 2,
              valueNormalized: 80,
            },
          },
        ],
      },
    ],
  };

  const recentSales: RecentSalesDto = {
    sales: [
      {
        id: "s1",
        client: "ООО Ромашка",
        manager: "Иван Иванов",
        date: "2026-09-23T14:32:00Z",
        itemsCount: 2,
        status: 1,
        revenue: 25000,
        gp: 10000,
      },
      {
        id: "s2",
        client: "ИП Петров",
        manager: "Мария Смирнова",
        date: "2026-09-23T10:00:00Z",
        itemsCount: 1,
        status: 2,
        revenue: 5000,
        gp: null,
      },
    ],
  };

  const refunds: RefundsDto = {
    value: 15000,
    rate: 2.5,
    rateDelta: { value: -0.4, unit: 2 },
    series: [{ value: 15000, dateFrom: "2026-09-23T00:00:00Z", dateTo: "2026-09-24T00:00:00Z" }],
    top: [
      {
        id: "p1",
        name: "Ноутбук Pro",
        category: "Ноутбуки",
        valueAbsolute: 10000,
        valueRelative: 66.7,
        valueNormalized: 100,
      },
    ],
    tail: { count: 3, valueAbsolute: 5000, valueRelative: 33.3 },
  };

  const cancellations: CancellationsDto = {
    value: 8000,
    rate: 1.4,
    rateDelta: null,
    series: [],
    top: [
      {
        id: "m2",
        name: "Мария Смирнова",
        team: "Альфа",
        valueAbsolute: 8000,
        valueRelative: 100,
        valueNormalized: 100,
      },
    ],
    tail: null,
  };

  return {
    kpi: createKpiDtoMock(),
    managerRating,
    managerComparison,
    topCustomers,
    customerDynamics,
    timeSeries,
    categories,
    topProducts,
    recentSales,
    refunds,
    cancellations,
  };
}

/**
 * Пустой период без продаж (ui.md, «Пустой период без продаж»): структура
 * ответа та же, что у наполненного — бэкенд и в пустом периоде возвращает все
 * секции (ростер менеджеров с нулями, у динамики обе секции с двумя датасетами),
 * пусты только данные строк.
 *
 * @returns DashboardDto пустого периода.
 */
export function createEmptyDashboardDtoMock(): DashboardDto
{
  const base = createDashboardDtoMock();

  const managerRating: ManagerRatingDto = {
    datasets: [{ name: "По выручке", items: [{ ...base.managerRating.datasets[0].items[0], salesCount: 0 }] }],
  };

  const managerComparison: ManagerComparisonDto = {
    datasets: [
      {
        name: "По выручке",
        items: [{ id: "m1", name: "Иван Иванов", team: "Alpha", value: 0, delta: null }],
      },
    ],
  };

  const customerDynamics: CustomerDynamicsDto = {
    growth: [
      { name: "Валовая прибыль", items: [] },
      { name: "Средний чек", items: [] },
    ],
    decline: [
      { name: "Валовая прибыль", items: [] },
      { name: "Средний чек", items: [] },
    ],
  };

  const refunds: RefundsDto = { ...base.refunds, value: 0, rate: 0, rateDelta: null, top: [], tail: null };

  const cancellations: CancellationsDto = {
    ...base.cancellations,
    value: 0,
    rate: 0,
    rateDelta: null,
    top: [],
    tail: null,
  };

  return {
    ...base,
    kpi: { ...base.kpi, salesCount: createKpiCardMock(0) },
    managerRating,
    managerComparison,
    topCustomers: { datasets: base.topCustomers.datasets.map((dataset) => ({ ...dataset, items: [] })) },
    customerDynamics,
    timeSeries: { datasets: base.timeSeries.datasets.map((dataset) => ({ ...dataset, items: [] })) },
    categories: { datasets: base.categories.datasets.map((dataset) => ({ ...dataset, items: [] })) },
    topProducts: { datasets: base.topProducts.datasets.map((dataset) => ({ ...dataset, items: [] })) },
    recentSales: { sales: [] },
    refunds,
    cancellations,
  };
}
