using SalesDashboard.Api.Dtos;
using SalesDashboard.Api.Errors;
using SalesDashboard.Api.Mapping;
using SalesDashboard.Api.Validation;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Api.Extensions;

/// <summary>
/// Composition root слоя Api (backend.md §6.7): контроллеры, problem details +
/// глобальный обработчик исключений, Swagger, валидаторы и мапперы.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApi(this IServiceCollection services)
    {
        services.AddControllers();
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        services.AddSingleton<DashboardRequestValidator>();
        services.AddSingleton<IApiMapper<DashboardRequest, DashboardQuery>, DashboardRequestMapper>();

        services.AddSingleton<IApiMapper<KpiModel, KpiDto>, KpiDtoMapper>();
        services.AddSingleton<IApiMapper<ManagerRatingModel, ManagerRatingDto>, ManagerRatingDtoMapper>();
        services.AddSingleton<IApiMapper<ManagerComparisonModel, ManagerComparisonDto>, ManagerComparisonDtoMapper>();
        services.AddSingleton<IApiMapper<CustomerTopModel, CustomerTopDto>, CustomerTopDtoMapper>();
        services.AddSingleton<IApiMapper<CustomerDynamicsModel, CustomerDynamicsDto>, CustomerDynamicsDtoMapper>();
        services.AddSingleton<IApiMapper<TimeSeriesModel, TimeSeriesDto>, TimeSeriesDtoMapper>();
        services.AddSingleton<IApiMapper<CategoriesModel, CategoriesDto>, CategoriesDtoMapper>();
        services.AddSingleton<IApiMapper<ProductsModel, ProductsDto>, ProductsDtoMapper>();
        services.AddSingleton<IApiMapper<RecentSalesModel, RecentSalesDto>, RecentSalesDtoMapper>();
        services.AddSingleton<IApiMapper<RefundsModel, RefundsDto>, LossDtoMapper>();
        services.AddSingleton<IApiMapper<CancellationsModel, CancellationsDto>, LossDtoMapper>();

        services.AddSingleton<IApiMapper<DashboardModel, DashboardDto>, DashboardResponseMapper>();

        return services;
    }
}
