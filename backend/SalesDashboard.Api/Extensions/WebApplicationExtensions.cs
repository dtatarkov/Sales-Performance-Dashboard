using SalesDashboard.Infrastructure.Seed;

namespace SalesDashboard.Api.Extensions;

/// <summary>
/// Стартовые хуки хоста (backend.md §5.4). Живёт в слое Api, потому что привязан
/// к <see cref="WebApplication"/> — о котором Infrastructure не должен ничего знать.
/// </summary>
public static class WebApplicationExtensions
{
    /// <summary>
    /// Инициализирует базу данных приложения. Детали инициализации — в <see cref="DatabaseInitializer"/>.
    /// </summary>
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var initializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
        
        await initializer.InitializeDatabaseAsync();
    }
}
