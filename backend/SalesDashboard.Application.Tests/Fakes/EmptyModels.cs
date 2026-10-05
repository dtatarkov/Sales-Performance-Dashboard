using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal static class EmptyModels
{
    internal static KpiCardModel Card { get; } = new(null, null, Array.Empty<SeriesPointModel>());

    internal static KpiModel Kpi { get; } = new(Card, Card, Card, Card, Card, null);

    internal static ManagerRatingModel ManagerRating { get; } = new(Array.Empty<DatasetModel<ManagerRatingItemModel>>());

    internal static ManagerComparisonModel ManagerComparison { get; } = new(Array.Empty<DatasetModel<ManagerComparisonItemModel>>());

    internal static CustomerTopModel CustomerTop { get; } = new(Array.Empty<DatasetModel<CustomerTopItemModel>>());

    internal static CustomerDynamicsModel CustomerDynamics { get; } = new(Array.Empty<DatasetModel<CustomerDynamicsItemModel>>());

    internal static TimeSeriesModel TimeSeries { get; } = new(Array.Empty<DatasetModel<TimeSeriesPointModel>>());

    internal static CategoriesModel Categories { get; } = new(Array.Empty<CategoryDatasetModel>());

    internal static ProductsModel Products { get; } = new(Array.Empty<DatasetModel<ProductItemModel>>());

    internal static RecentSalesModel RecentSales { get; } = new(Array.Empty<SaleFeedItemModel>());

    internal static RefundsModel Refunds { get; } = new(0m, null, null, Array.Empty<SeriesPointModel>(), Array.Empty<LossItemModel>(), null);

    internal static CancellationsModel Cancellations { get; } = new(0m, null, null, Array.Empty<SeriesPointModel>(), Array.Empty<LossItemModel>(), null);
}
