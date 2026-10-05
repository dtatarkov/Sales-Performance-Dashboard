using SalesDashboard.Api.Dtos;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Mapping;

/// <summary>
/// Корневой маппер дашборда (backend.md §6.4): сводит блоки read model в
/// <see cref="DashboardDto"/> через блочные мапперы. Enum'ы переносятся как есть
/// и сериализуются числами (§6.2).
/// </summary>
public sealed class DashboardResponseMapper(
    IApiMapper<KpiModel, KpiDto> kpiMapper,
    IApiMapper<ManagerRatingModel, ManagerRatingDto> managerRatingMapper,
    IApiMapper<ManagerComparisonModel, ManagerComparisonDto> managerComparisonMapper,
    IApiMapper<CustomerTopModel, CustomerTopDto> customerTopMapper,
    IApiMapper<CustomerDynamicsModel, CustomerDynamicsDto> customerDynamicsMapper,
    IApiMapper<TimeSeriesModel, TimeSeriesDto> timeSeriesMapper,
    IApiMapper<CategoriesModel, CategoriesDto> categoriesMapper,
    IApiMapper<ProductsModel, ProductsDto> productsMapper,
    IApiMapper<RecentSalesModel, RecentSalesDto> recentSalesMapper,
    IApiMapper<RefundsModel, RefundsDto> refundsMapper,
    IApiMapper<CancellationsModel, CancellationsDto> cancellationsMapper) : IApiMapper<DashboardModel, DashboardDto>
{
    public DashboardDto Map(DashboardModel source)
        => new(
            Kpi: kpiMapper.Map(source.Kpi),
            ManagerRating: managerRatingMapper.Map(source.ManagerRating),
            ManagerComparison: managerComparisonMapper.Map(source.ManagerComparison),
            TopCustomers: customerTopMapper.Map(source.TopCustomers),
            CustomerDynamics: customerDynamicsMapper.Map(source.CustomerDynamics),
            TimeSeries: timeSeriesMapper.Map(source.TimeSeries),
            Categories: categoriesMapper.Map(source.Categories),
            TopProducts: productsMapper.Map(source.TopProducts),
            RecentSales: recentSalesMapper.Map(source.RecentSales),
            Refunds: refundsMapper.Map(source.Refunds),
            Cancellations: cancellationsMapper.Map(source.Cancellations));
}
