using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SalesDashboard.Infrastructure.Seed;

namespace SalesDashboard.Api.Tests;

/// <summary>
/// Поднимает реальный API-хост поверх общего PostgreSQL-контейнера. Стартовый
/// блок миграций/seed в <c>Program.cs</c> выполняется inline до <c>app.Run()</c>,
/// поэтому <see cref="WebApplicationFactory{TEntryPoint}"/> его не пропускает —
/// базу инициализирует сам хост, в точности как в продакшне.
/// </summary>
public sealed class DashboardApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;
    private readonly bool _suppressSeed;

    /// <summary>
    /// Хост поверх подключения фикстуры контейнера; миграции и production-seed
    /// выполняются хостом штатно.
    /// </summary>
    /// <param name="fixture">Общий PostgreSQL-контейнер коллекции.</param>
    public DashboardApiFactory(PostgresFixture fixture)
        : this(fixture.ConnectionString, suppressSeed: false)
    {
    }

    /// <summary>
    /// Хост поверх произвольной строки подключения — состояние мира готовит
    /// <see cref="Scenarios.DashboardScenarioHost"/>; production-seed случайных
    /// данных подавляется заменой <see cref="IDataSeeder"/> на no-op (миграции
    /// применяются хостом как в продакшне). Не публичный: xUnit требует у
    /// class fixture ровно один публичный конструктор.
    /// </summary>
    /// <param name="connectionString">Строка подключения к БД сценария.</param>
    /// <param name="suppressSeed">Подавить ли production-сеидер случайных данных.</param>
    internal DashboardApiFactory(string connectionString, bool suppressSeed)
    {
        _connectionString = connectionString;
        _suppressSeed = suppressSeed;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Postgres", _connectionString);
        builder.UseEnvironment("Development");

        // Регистрация идёт после AddInfrastructure, поэтому GetRequiredService
        // возьмёт последнюю регистрацию — no-op вместо случайного сеида.
        if (_suppressSeed)
            builder.ConfigureServices(services => services.AddScoped<IDataSeeder>(_ => new Scenarios.NoopSeeder()));
    }
}
