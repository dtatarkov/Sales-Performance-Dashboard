import type { Contribution } from "./contribution";
import type { Dataset } from "./dataset";
import type { Delta } from "./delta";
import type { SaleStatus } from "./saleStatus";
import type { SeriesPoint } from "./seriesPoint";

/**
 * Данные блока 1 «KPI-карточки» (ui.md, блок 1). Подписи карточек — конфиг
 * виджета; данные — числа и структуры.
 */
export type KpiData = {
  revenue: KpiCardData;
  gp: KpiCardData;
  margin: KpiCardData;
  salesCount: KpiCardData;
  avgCheck: KpiCardData;
  /** Лидер по ВП; null — за период не было продаж. */
  bestManager: BestManagerData | null;
};

/**
 * Идентификатор числовой KPI-метрики — ключи KpiData без лидера. Определяет
 * формат значения в карточке (formatKpiValue): опечатка невозможна по типам.
 */
export type KpiMetricId = Exclude<keyof KpiData, "bestManager">;

/** Данные KPI-карточки одной метрики. */
export type KpiCardData = {
  /** Значение метрики; null — не определено (пустой знаменатель) → «—». */
  value: number | null;
  /** Δ к предыдущему периоду; null — недостаточно данных → «—». */
  delta: Delta | null;
  /** Дневная динамика для sparkline. */
  series: SeriesPoint[];
};

/** Данные карточки «Лучший менеджер». */
export type BestManagerData = {
  name: string;
  /** Ссылка на аватар; null — показываются инициалы. */
  avatar: string | null;
  initials: string;
  /** Валовая прибыль лидера за период. */
  gp: number;
  salesCount: number;
  /** Δ ВП лидера. */
  delta: Delta | null;
  /** Дневной ряд выручки лидера. */
  series: SeriesPoint[];
};

/** Строка рейтинга менеджеров (ui.md, блок 2). */
export type ManagerRatingItem = {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
  team: string;
  salesCount: number;
  revenue: number;
  revenueDelta: Delta | null;
  gp: number;
  gpDelta: Delta | null;
  /** Средний чек. */
  ac: number;
  acDelta: Delta | null;
  /** Маржинальность, %; null — пустой знаменатель. */
  margin: number | null;
  marginDelta: Delta | null;
  /** Доля отмен, %; null — выборка ниже минимума. */
  cancelRate: number | null;
  cancelRateDelta: Delta | null;
  /** Вклад по метрике активного датасета. */
  contribution: Contribution;
};

/** Данные блока 2 «Рейтинг менеджеров» — два датасета. */
export type ManagerRatingData = {
  datasets: Dataset<ManagerRatingItem>[];
};

/** Строка сравнения менеджеров (ui.md, блок 3). */
export type ManagerComparisonItem = {
  id: string;
  name: string;
  /** Команда менеджера (подпись под именем на оси Y). */
  team: string;
  /** Значение метрики датасета. */
  value: number;
  /** Δ метрики датасета. */
  delta: Delta | null;
};

/** Данные блока 3 «Сравнение менеджеров» — два датасета (топ-10 каждый). */
export type ManagerComparisonData = {
  datasets: Dataset<ManagerComparisonItem>[];
};

/** Строка топ-клиентов (ui.md, блок 4). */
export type CustomerTopItem = {
  id: string;
  name: string;
  /** Год начала работы. */
  since: number;
  orderCount: number;
  revenue: number;
  revenueDelta: Delta | null;
  gp: number;
  gpDelta: Delta | null;
  ac: number;
  acDelta: Delta | null;
  margin: number | null;
  marginDelta: Delta | null;
  /** Доля возвратов, %; null — выборка ниже минимума. */
  refundRate: number | null;
  refundRateDelta: Delta | null;
  cancelRate: number | null;
  cancelRateDelta: Delta | null;
  contribution: Contribution;
};

/** Данные блока 4 «Клиенты — Топ-10». */
export type CustomerTopData = {
  datasets: Dataset<CustomerTopItem>[];
};

/** Строка секции динамики клиентов (ui.md, блок 5). */
export type CustomerDynamicsItem = {
  id: string;
  name: string;
  /** Длина бара, 0–100 (доля максимума своей секции датасета). */
  valueNormalized: number;
  /** Абсолютная разность метрик между периодами (первая строка подписи). */
  absoluteDelta: number;
  /** Относительная Δ для второй строки подписи; null при пустой базовой метрике. */
  delta: Delta | null;
};

/** Данные блока 5 «Динамика клиентов»: сервер сам нарезал секции. */
export type CustomerDynamicsData = {
  /** Секция «Рост»: те же датасеты метрик, внутри — топ-5 по абсолютной Δ вверх. */
  growth: Dataset<CustomerDynamicsItem>[];
  /** Секция «Падение»: те же датасеты метрик, внутри — топ-5 по абсолютной Δ вниз. */
  decline: Dataset<CustomerDynamicsItem>[];
};

/** Точка ряда динамики во времени (ui.md, блок 6): полуинтервал [dateFrom, dateTo). */
export type TimeSeriesPoint = {
  /** Начало бакета точки (включается). */
  dateFrom: Date;
  /** Конец бакета точки (не включается); у последнего — конец периода. */
  dateTo: Date;
  /** Значение активного периода (сплошная линия). */
  valueCurrent: number;
  /** Значение предыдущего периода (пунктир); null не приходит по контракту, но поле опционально по схеме. */
  valuePrevious: number | null;
};

/** Данные блока 6 «Динамика во времени» — три датасета. */
export type TimeSeriesData = {
  datasets: Dataset<TimeSeriesPoint>[];
};

/** Строка категорий (ui.md, блок 7). */
export type CategoryItem = {
  id: string;
  name: string;
  revenue: number;
  revenueDelta: Delta | null;
  gp: number;
  gpDelta: Delta | null;
  margin: number | null;
  marginDelta: Delta | null;
  salesCount: number;
  salesCountDelta: Delta | null;
  /** Доля категории в метрике датасета, 0–100 (сегмент доната). */
  share: number;
};

/** Датасет категорий — Dataset + total для центра доната. */
export type CategoryDataset<TItem> = {
  name: string;
  items: TItem[];
  /** Сумма метрики датасета по всем категориям. */
  total: number;
};

/** Данные блока 7 «Продажи по категориям». */
export type CategoriesData = {
  datasets: CategoryDataset<CategoryItem>[];
};

/** Строка лучших продуктов (ui.md, блок 8). */
export type ProductItem = {
  id: string;
  name: string;
  sku: string;
  /** Название категории (подпись и цвет точки). */
  category: string;
  revenue: number;
  revenueDelta: Delta | null;
  gp: number;
  gpDelta: Delta | null;
  units: number;
  unitsDelta: Delta | null;
  margin: number | null;
  marginDelta: Delta | null;
  /** Доля возвратов, %; null — выборка ниже минимума. */
  refundRate: number | null;
  refundRateDelta: Delta | null;
  contribution: Contribution;
};

/** Данные блока 8 «Лучшие продукты» — три датасета. */
export type ProductsData = {
  datasets: Dataset<ProductItem>[];
};

/** Сделка ленты последних продаж (ui.md, блок 9). */
export type SaleFeedItem = {
  id: string;
  client: string;
  manager: string;
  date: Date;
  itemsCount: number;
  status: SaleStatus;
  /** Сумма сделки. */
  revenue: number;
  /** ВП; null для refunded/cancelled — ВП не имеет смысла для потерянных сумм. */
  gp: number | null;
};

/** Данные блока 9 «Последние продажи». */
export type RecentSalesData = {
  sales: SaleFeedItem[];
};

/** Общие поля групп потерь (ui.md, блок 10): Возвраты и Отмены. */
export type LossGroupData = {
  /** Сумма потерь группы за период. */
  value: number;
  /** Доля группы, %; null — пустой знаменатель → «—». */
  rate: number | null;
  /** Δ доли, в п.п. */
  rateDelta: Delta | null;
  /** Дневной ряд потерь. */
  series: SeriesPoint[];
  /** Топ объектов: имя, подпись, сумма, доля, бар. */
  top: LossTopItem[];
  /** Хвост «Остальные N»; null — за топом никого не осталось. */
  tail: LossTailData | null;
};

/** Строка топа потерь. */
export type LossTopItem = {
  id: string;
  name: string;
  /** Вторичная строка объекта: категория товара (возвраты) / команда менеджера (отмены); пустая — разрез не задан. */
  subtitle: string;
  /** Сумма потерь объекта. */
  valueAbsolute: number;
  /** Доля объекта от суммы группы, 0–100. */
  valueRelative: number;
  /** Длина бара, 0–100. */
  valueNormalized: number;
};

/** Хвост «Остальные N» группы потерь. */
export type LossTailData = {
  count: number;
  valueAbsolute: number;
  valueRelative: number;
};

/** Данные блока 10 «Возвраты» — разрез товары. */
export type RefundsData = LossGroupData;

/** Данные блока 11 «Отмены» — разрез менеджеры. */
export type CancellationsData = LossGroupData;

/** Ответ маппера api — срезы всех 11 блоков в app-типах. */
export type DashboardData = {
  kpi: KpiData;
  managerRating: ManagerRatingData;
  managerComparison: ManagerComparisonData;
  topCustomers: CustomerTopData;
  customerDynamics: CustomerDynamicsData;
  timeSeries: TimeSeriesData;
  categories: CategoriesData;
  topProducts: ProductsData;
  recentSales: RecentSalesData;
  refunds: RefundsData;
  cancellations: CancellationsData;
};