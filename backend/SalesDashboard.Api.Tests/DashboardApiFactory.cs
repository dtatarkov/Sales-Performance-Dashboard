using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SalesDashboard.Api.Tests;

/// <summary>
/// Поднимает реальный API-хост поверх общего PostgreSQL-контейнера. Стартовый
/// блок миграций/seed в <c>Program.cs</c> выполняется inline до <c>app.Run()</c>,
/// поэтому <see cref="WebApplicationFactory{TEntryPoint}"/> его не пропускает —
/// базу инициализирует сам хост, в точности как в продакшне.
/// </summary>
public sealed class DashboardApiFactory : WebApplicationFactory<Program>
{
    private readonly PostgresFixture _fixture;

    public DashboardApiFactory(PostgresFixture fixture) => _fixture = fixture;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Postgres", _fixture.ConnectionString);
        builder.UseEnvironment("Development");
    }
}
