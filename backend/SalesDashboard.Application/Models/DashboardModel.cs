using SalesDashboard.Domain;

namespace SalesDashboard.Application.Models;

/// <summary>
/// Весь дашборд за один период и сегмент — read-model двойник <c>DashboardDto</c> (api.md).
/// Каждый блок присутствует всегда; период без данных даёт блоки с null-метриками
/// и пустыми списками, поэтому клиент никогда не проверяет наличие секции.
/// </summary>
public sealed record DashboardModel(
    KpiModel Kpi,
    ManagerRatingModel ManagerRating,
    ManagerComparisonModel ManagerComparison,
    CustomerTopModel TopCustomers,
    CustomerDynamicsModel CustomerDynamics,
    TimeSeriesModel TimeSeries,
    CategoriesModel Categories,
    ProductsModel TopProducts,
    RecentSalesModel RecentSales,
    RefundsModel Refunds,
    CancellationsModel Cancellations)
{
    // Порядок объявления важен: инициализаторы статических свойств выполняются
    // сверху вниз, поэтому все зависимые блоки объявлены раньше Empty —
    // иначе Empty строится из null-свойств (баг, зафиксированный в backend-plan.md).

    private static KpiCardModel EmptyCard { get; } = new(null, null, Array.Empty<SeriesPointModel>());

    private static KpiModel EmptyKpi { get; } = new(
        Revenue: EmptyCard,
        GrossProfit: EmptyCard,
        Margin: EmptyCard,
        SalesCount: EmptyCard,
        AverageCheck: EmptyCard,
        BestManager: null);

    private static RefundsModel EmptyRefunds { get; } = new(
        Value: 0m,
        Rate: null,
        RateDelta: null,
        Series: Array.Empty<SeriesPointModel>(),
        Top: Array.Empty<LossItemModel>(),
        Tail: null);

    private static CancellationsModel EmptyCancellations { get; } = new(
        Value: 0m,
        Rate: null,
        RateDelta: null,
        Series: Array.Empty<SeriesPointModel>(),
        Top: Array.Empty<LossItemModel>(),
        Tail: null);

    /// <summary>
    /// Дашборд, где каждый блок в пустом состоянии. Вызов, не способный дать
    /// данные, возвращает эту модель вместо частичной, чтобы UI всегда рендерил
    /// целостную, согласованную страницу.
    /// </summary>
    public static DashboardModel Empty { get; } = new(
        Kpi: EmptyKpi,
        ManagerRating: new ManagerRatingModel(Array.Empty<DatasetModel<ManagerRatingItemModel>>()),
        ManagerComparison: new ManagerComparisonModel(Array.Empty<DatasetModel<ManagerComparisonItemModel>>()),
        TopCustomers: new CustomerTopModel(Array.Empty<DatasetModel<CustomerTopItemModel>>()),
        CustomerDynamics: new CustomerDynamicsModel(Array.Empty<DatasetModel<CustomerDynamicsItemModel>>()),
        TimeSeries: new TimeSeriesModel(Array.Empty<DatasetModel<TimeSeriesPointModel>>()),
        Categories: new CategoriesModel(Array.Empty<CategoryDatasetModel>()),
        TopProducts: new ProductsModel(Array.Empty<DatasetModel<ProductItemModel>>()),
        RecentSales: new RecentSalesModel(Array.Empty<SaleFeedItemModel>()),
        Refunds: EmptyRefunds,
        Cancellations: EmptyCancellations);
}

/// <summary>
/// Вход сценария: активный период плюс необязательный фильтр по сегменту клиентов
/// (backend.md §4.1). Предыдущий сопоставимый период выводится доменом из
/// <see cref="Period"/>, вызывающий его никогда не передаёт.
/// </summary>
/// <param name="Segment"><c>null</c> означает все сегменты.</param>
public sealed record DashboardQuery(DateRange Period, CustomerSegment? Segment);