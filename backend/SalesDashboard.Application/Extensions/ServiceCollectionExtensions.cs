using Microsoft.Extensions.DependencyInjection;
using SalesDashboard.Application.Builders;
using SalesDashboard.Application.UseCases;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Extensions;

/// <summary>
/// Composition root слоя Application (backend.md §6.7): не имеющие состояния
/// калькуляторы домена — singleton'ы, билдеры и use case — scoped, потому что
/// они гоняют scoped <c>SalesDbContext</c> через порты чтения.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton<ISaleStatusResolver, SaleStatusResolver>();
        services.AddSingleton<IPeriodResolver, PeriodResolver>();
        services.AddSingleton<IResultMetricsCalculator, ResultMetricsCalculator>();
        services.AddSingleton<ILossRateCalculator, LossRateCalculator>();
        services.AddSingleton<IDeltaCalculator, DeltaCalculator>();
        services.AddSingleton<IContributionCalculator, ContributionCalculator>();
        services.AddSingleton<IDatasetRankingPolicy, DatasetRankingPolicy>();
        services.AddSingleton(MetricThresholds.Default);

        services.AddScoped<IKpiBuilder, KpiBuilder>();
        services.AddScoped<IManagerBuilder, ManagerBuilder>();
        services.AddScoped<ICustomerBuilder, CustomerBuilder>();
        services.AddScoped<ITimeSeriesBuilder, TimeSeriesBuilder>();
        services.AddScoped<ICategoryBuilder, CategoryBuilder>();
        services.AddScoped<IProductBuilder, ProductBuilder>();
        services.AddScoped<IRecentSalesBuilder, RecentSalesBuilder>();
        services.AddScoped<ILossBuilder, LossBuilder>();
        services.AddScoped<IGetDashboardUseCase, GetDashboardUseCase>();

        return services;
    }
}
