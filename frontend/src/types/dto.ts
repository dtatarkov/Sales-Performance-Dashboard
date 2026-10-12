/*
 * DTO контракта api.md — единственный DTO-файл по одному эндпоинту
 * (frontend-plan.md, «Сводка сущностей»). Только типы данных; маппинг в
 * app-типы — слой api (frontend.md, раздел 8).
 */

/** Числовые enum'ы api.md («Справочник enum-значений») — как union литералов. */
export type SegmentDto = 1 | 2 | 3;
export type DeltaUnitDto = 1 | 2;
export type ContributionUnitDto = 1 | 2 | 3 | 4;
export type SaleStatusDto = 1 | 2 | 3;

/** Точка временного ряда api.md (`SeriesPointDto`): значение за полуинтервал [dateFrom, dateTo). */
export type SeriesPointDto = {
  value: number;
  dateFrom: string;
  dateTo: string;
};

/** Δ к предыдущему периоду api.md (`DeltaDto`); всё поле null — Δ не вычисляется. */
export type DeltaDto = {
  value: number;
  unit: DeltaUnitDto;
};

/** Вклад элемента api.md (`ContributionDto`). */
export type ContributionDto = {
  valueAbsolute: number;
  /** null — вклад не определён: знаменатель периода пуст (продаж не было). */
  valueRelative: number | null;
  valueRelativeUnit: ContributionUnitDto;
  valueNormalized: number;
};

/** Именованный датасет api.md (`DatasetDto<T>`). */
export type DatasetDto<TItem> = {
  name: string;
  items: TItem[];
};

/** KPI-карточка api.md (`KpiCardDto`). */
export type KpiCardDto = {
  value: number | null;
  delta: DeltaDto | null;
  series: SeriesPointDto[];
};

/** Лидер по валовой прибыли api.md (`BestManagerDto`); весь объект null — продаж не было. */
export type BestManagerDto = {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  gp: number;
  salesCount: number;
  delta: DeltaDto | null;
  series: SeriesPointDto[];
};

/** Блок 1 api.md (`KpiDto`). */
export type KpiDto = {
  revenue: KpiCardDto;
  gp: KpiCardDto;
  margin: KpiCardDto;
  salesCount: KpiCardDto;
  avgCheck: KpiCardDto;
  bestManager: BestManagerDto | null;
};

/** Строка рейтинга менеджеров api.md (`ManagerRatingItemDto`). */
export type ManagerRatingItemDto = {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  team: string;
  salesCount: number;
  revenue: number;
  revenueDelta: DeltaDto | null;
  gp: number;
  gpDelta: DeltaDto | null;
  ac: number;
  acDelta: DeltaDto | null;
  margin: number | null;
  marginDelta: DeltaDto | null;
  cancelRate: number | null;
  cancelRateDelta: DeltaDto | null;
  contribution: ContributionDto;
};

/** Блок 2 api.md (`ManagerRatingDto`). */
export type ManagerRatingDto = {
  datasets: DatasetDto<ManagerRatingItemDto>[];
};

/** Строка сравнения менеджеров api.md (`ManagerComparisonItemDto`). */
export type ManagerComparisonItemDto = {
  id: string;
  name: string;
  team: string;
  value: number;
  delta: DeltaDto | null;
};

/** Блок 3 api.md (`ManagerComparisonDto`). */
export type ManagerComparisonDto = {
  datasets: DatasetDto<ManagerComparisonItemDto>[];
};

/** Строка топ-клиентов api.md (`CustomerTopItemDto`). */
export type CustomerTopItemDto = {
  id: string;
  name: string;
  since: number;
  orderCount: number;
  revenue: number;
  revenueDelta: DeltaDto | null;
  gp: number;
  gpDelta: DeltaDto | null;
  ac: number;
  acDelta: DeltaDto | null;
  margin: number | null;
  marginDelta: DeltaDto | null;
  refundRate: number | null;
  refundRateDelta: DeltaDto | null;
  cancelRate: number | null;
  cancelRateDelta: DeltaDto | null;
  contribution: ContributionDto;
};

/** Блок 4 api.md (`CustomerTopDto`). */
export type CustomerTopDto = {
  datasets: DatasetDto<CustomerTopItemDto>[];
};

/** Строка секции динамики клиентов api.md (`CustomerDynamicsItemDto`). */
export type CustomerDynamicsItemDto = {
  id: string;
  name: string;
  /** Длина бара, 0–100 (доля максимума своей секции датасета). */
  valueNormalized: number;
  /** Абсолютная разность метрик между периодами (первая строка подписи). */
  deltaAbsolute: number;
  /** Относительная Δ; null при пустой базовой метрике. */
  deltaRelative: DeltaDto | null;
};

/** Блок 5 api.md (`CustomerDynamicsDto`): секции «Рост»/«Падение» с готовым топ-5 в каждом датасете. */
export type CustomerDynamicsDto = {
  growth: DatasetDto<CustomerDynamicsItemDto>[];
  decline: DatasetDto<CustomerDynamicsItemDto>[];
};

/** Точка ряда динамики api.md (`TimeSeriesPointDto`): значения за полуинтервал [dateFrom, dateTo). */
export type TimeSeriesPointDto = {
  dateFrom: string;
  dateTo: string;
  valueCurrent: number;
  valuePrevious: number | null;
};

/** Блок 6 api.md (`TimeSeriesDto`). */
export type TimeSeriesDto = {
  datasets: DatasetDto<TimeSeriesPointDto>[];
};

/** Строка категорий api.md (`CategoryItemDto`). */
export type CategoryItemDto = {
  id: string;
  name: string;
  revenue: number;
  revenueDelta: DeltaDto | null;
  gp: number;
  gpDelta: DeltaDto | null;
  margin: number | null;
  marginDelta: DeltaDto | null;
  salesCount: number;
  salesCountDelta: DeltaDto | null;
  share: number;
};

/** Датасет категорий api.md (`CategoryDatasetDto`) — DatasetDto + total. */
export type CategoryDatasetDto<TItem> = {
  name: string;
  items: TItem[];
  total: number;
};

/** Блок 7 api.md (`CategoriesDto`). */
export type CategoriesDto = {
  datasets: CategoryDatasetDto<CategoryItemDto>[];
};

/** Строка продуктов api.md (`ProductItemDto`). */
export type ProductItemDto = {
  id: string;
  name: string;
  sku: string;
  category: string;
  revenue: number;
  revenueDelta: DeltaDto | null;
  gp: number;
  gpDelta: DeltaDto | null;
  units: number;
  unitsDelta: DeltaDto | null;
  margin: number | null;
  marginDelta: DeltaDto | null;
  refundRate: number | null;
  refundRateDelta: DeltaDto | null;
  contribution: ContributionDto;
};

/** Блок 8 api.md (`ProductsDto`). */
export type ProductsDto = {
  datasets: DatasetDto<ProductItemDto>[];
};

/** Сделка ленты api.md (`SaleFeedItemDto`). */
export type SaleFeedItemDto = {
  id: string;
  client: string;
  manager: string;
  date: string;
  itemsCount: number;
  status: SaleStatusDto;
  revenue: number;
  gp: number | null;
};

/** Блок 9 api.md (`RecentSalesDto`). */
export type RecentSalesDto = {
  sales: SaleFeedItemDto[];
};

/** Строка топа возвратов api.md (`RefundTopItemDto`). */
export type RefundTopItemDto = {
  id: string;
  name: string;
  category: string;
  valueAbsolute: number;
  valueRelative: number;
  valueNormalized: number;
};

/** Хвост возвратов api.md (`RefundTailDto`); null — за топом никого не осталось. */
export type RefundTailDto = {
  count: number;
  valueAbsolute: number;
  valueRelative: number;
};

/** Блок 10 api.md (`RefundsDto`). */
export type RefundsDto = {
  value: number;
  rate: number | null;
  rateDelta: DeltaDto | null;
  series: SeriesPointDto[];
  top: RefundTopItemDto[];
  tail: RefundTailDto | null;
};

/** Строка топа отмен api.md (`CancellationTopItemDto`). */
export type CancellationTopItemDto = {
  id: string;
  name: string;
  team: string;
  valueAbsolute: number;
  valueRelative: number;
  valueNormalized: number;
};

/** Хвост отмен api.md (`CancellationTailDto`); null — за топом никого не осталось. */
export type CancellationTailDto = {
  count: number;
  valueAbsolute: number;
  valueRelative: number;
};

/** Блок 11 api.md (`CancellationsDto`). */
export type CancellationsDto = {
  value: number;
  rate: number | null;
  rateDelta: DeltaDto | null;
  series: SeriesPointDto[];
  top: CancellationTopItemDto[];
  tail: CancellationTailDto | null;
};

/** Корень ответа api.md (`DashboardDto`). Поля присутствуют всегда. */
export type DashboardDto = {
  kpi: KpiDto;
  managerRating: ManagerRatingDto;
  managerComparison: ManagerComparisonDto;
  topCustomers: CustomerTopDto;
  customerDynamics: CustomerDynamicsDto;
  timeSeries: TimeSeriesDto;
  categories: CategoriesDto;
  topProducts: ProductsDto;
  recentSales: RecentSalesDto;
  refunds: RefundsDto;
  cancellations: CancellationsDto;
};

/** Тело запроса api.md (`DashboardRequest`); segment отсутствует или null = все сегменты. */
export type DashboardRequestDto = {
  from: string;
  to: string;
  segment?: SegmentDto | null;
};

/** ProblemDetails RFC 7807 (api.md, «Ошибки»). */
export type ProblemDetailsDto = {
  title?: string;
  status?: number;
  detail?: string;
  errors?: { field: string; code: string; }[];
};