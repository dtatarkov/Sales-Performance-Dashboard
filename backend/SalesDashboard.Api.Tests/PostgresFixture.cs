using Testcontainers.PostgreSql;

namespace SalesDashboard.Api.Tests;

/// <summary>
/// Одноразовый PostgreSQL-контейнер, общий для всех интеграционных тестов
/// коллекции. API-хост сам применяет миграции и seed на старте, поэтому от
/// контейнера требуется лишь быть доступным до сборки хоста.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public Task InitializeAsync() => _container.StartAsync();

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "postgres";
}
