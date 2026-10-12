using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SalesDashboard.Api.Dtos;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Одно подготовленное состояние БД (мир) с поднятым на нём API-хостом.
/// Создаёт собственную базу на общем PostgreSQL-контейнере, применяет миграции
/// и сеет данные <see cref="TestGraph"/>, затем запускает хост с подавленным
/// production-сеидом. Неоднократные запросы к миру (периоды, сегменты) читают
/// одно и то же состояние.
/// </summary>
public sealed class DashboardScenarioHost : IAsyncDisposable
{
    /// <summary>Опции JSON с веб-дефолтами: camelCase, enum'ы числами — как раздаёт API.</summary>
    private static readonly JsonSerializerOptions WebJsonOptions = new(JsonSerializerDefaults.Web);

    private readonly DashboardApiFactory _factory;
    private readonly string _databaseName;
    private readonly string _adminConnectionString;

    private DashboardScenarioHost(DashboardApiFactory factory, string databaseName, string adminConnectionString)
    {
        _factory = factory;
        _databaseName = databaseName;
        _adminConnectionString = adminConnectionString;
    }

    /// <summary>Клиент API-хоста мира; хост стартует при первом обращении.</summary>
    public HttpClient Client => _factory.CreateClient();

    /// <summary>
    /// Поднимает мир: отдельная БД на контейнере фикстуры → миграции → seed
    /// переданным конструктором данных → старт хоста. Все шаги выполняются
    /// до возврата, чтобы падение подготовки падало в инициализации теста.
    /// </summary>
    /// <param name="postgres">Общий PostgreSQL-контейнер коллекции.</param>
    /// <param name="seed">Конструирование данных мира перед стартом хоста.</param>
    /// <returns>Готовый к запросам мир.</returns>
    public static async Task<DashboardScenarioHost> StartAsync(PostgresFixture postgres, Action<TestGraph> seed)
    {
        var databaseName = $"dashboard_test_{Guid.NewGuid():N}";

        var adminBuilder = new NpgsqlConnectionStringBuilder(postgres.ConnectionString)
        {
            Database = "postgres",
        };

        var adminConnectionString = adminBuilder.ConnectionString;

        await CreateDatabaseAsync(adminConnectionString, databaseName);

        var scenarioBuilder = new NpgsqlConnectionStringBuilder(postgres.ConnectionString)
        {
            Database = databaseName,
        };

        var scenarioConnectionString = scenarioBuilder.ConnectionString;

        var options = new DbContextOptionsBuilder<SalesDbContext>()
            .UseNpgsql(scenarioConnectionString)
            .Options;

        await MigrateAsync(options);

        var graph = new TestGraph(options);
        seed(graph);
        await graph.SaveAsync();

        var factory = new DashboardApiFactory(scenarioConnectionString, suppressSeed: true);

        // Стартуем хост немедленно: ошибка конфигурации должна упасть в
        // InitializeAsync теста, а не в первом факте.
        using var probe = factory.CreateClient();

        var host = new DashboardScenarioHost(factory, databaseName, adminConnectionString);

        return host;
    }

    /// <summary>
    /// Отправляет запрос всего дашборда и возвращает десериализованный контракт.
    /// </summary>
    /// <param name="from">Начало полуинтервала периода (UTC, включается).</param>
    /// <param name="to">Конец полуинтервала (UTC, не включается).</param>
    /// <param name="segment">Сегмент клиента или null — все сегменты.</param>
    /// <returns>Готовый дашборд.</returns>
    public async Task<DashboardDto> PostDashboardAsync(DateTime from, DateTime to, CustomerSegment? segment)
    {
        var segmentValue = segment is null ? (int?)null : (int)segment;

        var response = await Client.PostAsJsonAsync("/api/v1/dashboard", new
        {
            from = from.ToString("O"),
            to = to.ToString("O"),
            segment = segmentValue,
        });

        response.EnsureSuccessStatusCode();

        var dashboard = await response.Content.ReadFromJsonAsync<DashboardDto>(WebJsonOptions);

        return dashboard!;
    }

    /// <summary>Останавливает хост и удаляет базу мира; сбой удаления не маскирует результат теста.</summary>
    public async ValueTask DisposeAsync()
    {
        await _factory.DisposeAsync();

        try
        {
            await DropDatabaseAsync(_adminConnectionString, _databaseName);
        }
        catch (PostgresException)
        {
            // Контейнер фикстуры в любом случае удаляется вместе со всеми БД;
            // ошибка удаления отдельного мира не должна ронять прогон.
        }
    }

    /// <summary>
    /// Создаёт пустую базу сценария на общем контейнере.
    /// </summary>
    /// <param name="adminConnectionString">Подключение к служебной базе postgres.</param>
    /// <param name="databaseName">Имя новой базы.</param>
    private static async Task CreateDatabaseAsync(string adminConnectionString, string databaseName)
    {
        await using var connection = new NpgsqlConnection(adminConnectionString);

        await connection.OpenAsync();

        var command = connection.CreateCommand();
        command.CommandText = $"CREATE DATABASE \"{databaseName}\"";

        await command.ExecuteNonQueryAsync();
    }

    /// <summary>
    /// Применяет все миграции к пустой базе сценария — тот же путь, что в продакшне.
    /// </summary>
    /// <param name="options">Опции контекста на строку подключения сценария.</param>
    private static async Task MigrateAsync(DbContextOptions<SalesDbContext> options)
    {
        await using var db = new SalesDbContext(options);

        await db.Database.MigrateAsync();
    }

    /// <summary>
    /// Удаляет базу мира вместе с активными подключениями (PostgreSQL 13+).
    /// </summary>
    /// <param name="adminConnectionString">Подключение к служебной базе postgres.</param>
    /// <param name="databaseName">Имя удаляемой базы.</param>
    private static async Task DropDatabaseAsync(string adminConnectionString, string databaseName)
    {
        await using var connection = new NpgsqlConnection(adminConnectionString);

        await connection.OpenAsync();

        var command = connection.CreateCommand();
        command.CommandText = $"DROP DATABASE \"{databaseName}\" WITH (FORCE)";

        await command.ExecuteNonQueryAsync();
    }
}
