using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Infrastructure.Persistence;
using SalesDashboard.Infrastructure.ReadPorts;
using SalesDashboard.Infrastructure.Seed;

namespace SalesDashboard.Infrastructure.Extensions;

/// <summary>
/// Composition root слоя Infrastructure (backend.md §6.7): scoped
/// <c>SalesDbContext</c>, семь read-портов-адаптеров, сидер и
/// стартовый инициализатор.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("Connection string 'Postgres' is not configured.");

        services.AddDbContext<SalesDbContext>(options => options.UseNpgsql(connectionString));

        services.AddScoped<IKpiReadPort, EfKpiReadPort>();
        services.AddScoped<IManagerReadPort, EfManagerReadPort>();
        services.AddScoped<ICustomerReadPort, EfCustomerReadPort>();
        services.AddScoped<IProductReadPort, EfProductReadPort>();
        services.AddScoped<ICategoryReadPort, EfCategoryReadPort>();
        services.AddScoped<ISaleFeedReadPort, EfSaleFeedReadPort>();
        services.AddScoped<ILossReadPort, EfLossReadPort>();

        services.AddScoped<SeedDataFactory>();
        services.AddScoped<IDataSeeder, DatabaseSeeder>();
        services.AddScoped<DatabaseInitializer>();

        return services;
    }
}
