using SalesDashboard.Infrastructure.Seed;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Пустой сидер для тестовых миров: каждое состояние БД сеется самим сценарием
/// через <see cref="TestGraph"/>, поэтому production-генератор случайных данных
/// не должен выполняться при старте хоста.
/// </summary>
internal sealed class NoopSeeder : IDataSeeder
{
    public Task SeedAsync(CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
