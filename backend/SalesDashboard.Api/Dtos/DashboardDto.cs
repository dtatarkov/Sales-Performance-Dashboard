namespace SalesDashboard.Api.Dtos;

/// <summary>
/// Контракт ответа POST /api/v1/dashboard (api.md). Числа сырые: форматирование
/// делает клиент; решение «печатать или нет» (пороги малой выборки) принимает
/// сервер в виде null/значения.
/// </summary>
public sealed record DashboardDto(
    KpiDto Kpi,
    ManagerRatingDto ManagerRating,
    ManagerComparisonDto ManagerComparison,
    CustomerTopDto TopCustomers,
    CustomerDynamicsDto CustomerDynamics,
    TimeSeriesDto TimeSeries,
    CategoriesDto Categories,
    ProductsDto TopProducts,
    RecentSalesDto RecentSales,
    RefundsDto Refunds,
    CancellationsDto Cancellations);
