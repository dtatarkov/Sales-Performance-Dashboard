using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.UseCases;

/// <summary>
/// Точка входа сценария (backend.md §4.2). Сам ничего не считает — вызывает
/// билдеры блоков последовательно и собирает весь дашборд. Это единственное
/// место, знающее состав дашборда.
/// </summary>
public interface IGetDashboardUseCase
{
    Task<DashboardModel> ExecuteAsync(DashboardQuery query, CancellationToken cancellationToken);
}

/// <summary>
/// Билдеры выполняются последовательно на одном scoped <c>SalesDbContext</c>:
/// контекст не потокобезопасен, а чтения настолько дёшевы, что параллелизация
/// добавила бы второй контекст без выигрыша (backend.md §4.2). Каждый билдер и
/// порт получают токен, поэтому отмена обрывает выполнение на ближайшем EF-запросе
/// — частичная модель никогда не возвращается (backend.md §6.6).
/// </summary>
public sealed class GetDashboardUseCase(
    IKpiBuilder kpi,
    IManagerBuilder managers,
    ICustomerBuilder customers,
    ITimeSeriesBuilder timeSeries,
    ICategoryBuilder categories,
    IProductBuilder products,
    IRecentSalesBuilder recentSales,
    ILossBuilder losses) : IGetDashboardUseCase
{
    public async Task<DashboardModel> ExecuteAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var kpiModel = await kpi.BuildAsync(query, cancellationToken);
        var (managerRating, managerComparison) = await managers.BuildAsync(query, cancellationToken);
        var (topCustomers, customerDynamics) = await customers.BuildAsync(query, cancellationToken);
        var timeSeriesModel = await timeSeries.BuildAsync(query, cancellationToken);
        var categoriesModel = await categories.BuildAsync(query, cancellationToken);
        var productsModel = await products.BuildAsync(query, cancellationToken);
        var recentSalesModel = await recentSales.BuildAsync(query, cancellationToken);
        var (refunds, cancellations) = await losses.BuildAsync(query, cancellationToken);

        return new DashboardModel(
            Kpi: kpiModel,
            ManagerRating: managerRating,
            ManagerComparison: managerComparison,
            TopCustomers: topCustomers,
            CustomerDynamics: customerDynamics,
            TimeSeries: timeSeriesModel,
            Categories: categoriesModel,
            TopProducts: productsModel,
            RecentSales: recentSalesModel,
            Refunds: refunds,
            Cancellations: cancellations);
    }
}
