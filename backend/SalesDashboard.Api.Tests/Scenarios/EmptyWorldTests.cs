using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Пустота»: реестр без единой сделки — менеджеры, клиенты и товары
/// заведены, продажи отсутствуют полностью. Единственное состояние, где
/// проверяется различие «настоящий ноль ≠ не определено» во всех блоках:
/// доли при пустом знаменателе null, суммы нулевые, серии нулевые.
/// </summary>
public sealed class EmptyWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало недели без продаж.</summary>
    public static DateTime PeriodFrom => D;

    public static DateTime PeriodTo => D.AddDays(7);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    /// <summary>Менеджер без сделок.</summary>
    public ManagerEntity ManagerFirst { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет только реестр: два менеджера, два клиента, категория и два товара.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        ManagerFirst = graph.AddManager("Роман Пустой", "РП", "Пустота");

        graph.AddManager("Света Тихая", "СТ", "Пустота");
        graph.AddCustomer("ООО Никто", "Никто", CustomerSegment.Enterprise, 2020);
        graph.AddCustomer("ООО Никуда", "Никуда", CustomerSegment.Smb, 2021);

        var category = graph.AddCategory("Пустое");

        graph.AddProduct("Товар нет", "EMPTY-1", category, 100m, 40m);
        graph.AddProduct("Товар тишина", "EMPTY-2", category, 200m, 80m);
    }
}

/// <summary>
/// Проверки пустого мира: нули против null по всем блокам, пустые топы и
/// лента, серии из нулей с полным покрытием периода.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class EmptyWorldTests : IClassFixture<EmptyWorld>
{
    private readonly EmptyWorld _world;

    public EmptyWorldTests(EmptyWorld world) => _world = world;

    [Fact]
    public async Task Empty_world_yields_real_zeros_and_undefined_ratios()
    {
        var dashboard = await _world.Host.PostDashboardAsync(EmptyWorld.PeriodFrom, EmptyWorld.PeriodTo, null);
        var kpi = dashboard.Kpi;

        // Суммы и счётчики — настоящие нули; доли с пустым знаменателем — null.
        Assert.Equal(0m, kpi.Revenue.Value);
        Assert.Equal(0m, kpi.Gp.Value);
        Assert.Equal(0m, kpi.SalesCount.Value);
        Assert.Null(kpi.Margin.Value);
        Assert.Null(kpi.AvgCheck.Value);
        Assert.Null(kpi.BestManager);

        // Базы Δ пусты → все Δ null.
        ScenarioAssertions.NoDelta(kpi.Revenue.Delta);
        ScenarioAssertions.NoDelta(kpi.Gp.Delta);
        ScenarioAssertions.NoDelta(kpi.Margin.Delta);
        ScenarioAssertions.NoDelta(kpi.SalesCount.Delta);
        ScenarioAssertions.NoDelta(kpi.AvgCheck.Delta);

        // Серии: 28 нулей по шестичасовой сетке недели; sparse-серии пустые.
        Assert.Equal(28, kpi.Revenue.Series.Count);

        foreach (var point in kpi.Revenue.Series)
            Assert.Equal(0m, point.Value);

        Assert.Empty(kpi.Margin.Series);
        Assert.Empty(kpi.AvgCheck.Series);

        // Лидера нет — карточки лидера нет вовсе.
        Assert.Null(kpi.BestManager);
    }

    [Fact]
    public async Task Empty_rating_keeps_roster_with_nulls_and_empty_contributions()
    {
        var dashboard = await _world.Host.PostDashboardAsync(EmptyWorld.PeriodFrom, EmptyWorld.PeriodTo, null);

        var gpRows = dashboard.ManagerRating.Datasets[0].Items;

        // Рейтинг не теряет менеджеров: нули и null вместо неопределённого.
        Assert.Equal(2, gpRows.Count);

        var first = gpRows[0];
        Assert.Equal(_world.ManagerFirst.Id, first.Id);
        Assert.Equal(0m, first.Revenue);
        Assert.Equal(0m, first.Gp);
        Assert.Equal(0m, first.Ac);
        Assert.Null(first.Margin);
        Assert.Null(first.CancelRate);
        ScenarioAssertions.NoDelta(first.RevenueDelta);
        ScenarioAssertions.NoDelta(first.GpDelta);

        // Вклад не определён: сумма группы нулевая — доля null, бар 0.
        Assert.Null(first.Contribution.ValueRelative);
        Assert.Equal(0m, first.Contribution.ValueNormalized);

        // Сравнение повторяет нулевой рейтинг.
        var comparisonRows = dashboard.ManagerComparison.Datasets[0].Items;
        Assert.Equal(2, comparisonRows.Count);
        Assert.Equal(0m, comparisonRows[0].Value);
        ScenarioAssertions.NoDelta(comparisonRows[0].Delta);

        // Топы клиентов, динамика, категории и продукты пусты.
        Assert.Empty(dashboard.TopCustomers.Datasets[0].Items);
        ScenarioAssertions.DynamicsEmpty(dashboard.CustomerDynamics);
        Assert.Empty(dashboard.Categories.Datasets[0].Items);
        Assert.Equal(0m, dashboard.Categories.Datasets[0].Total);
        Assert.Empty(dashboard.TopProducts.Datasets[0].Items);
        Assert.Empty(dashboard.RecentSales.Sales);
    }

    [Fact]
    public async Task Empty_losses_have_null_rates_not_zeros()
    {
        var dashboard = await _world.Host.PostDashboardAsync(EmptyWorld.PeriodFrom, EmptyWorld.PeriodTo, null);

        // Возвраты: сумма 0, но когорта пуста → доля null, а не 0%.
        var refunds = dashboard.Refunds;
        Assert.Equal(0m, refunds.Value);
        Assert.Null(refunds.Rate);
        ScenarioAssertions.NoDelta(refunds.RateDelta);
        Assert.Equal(28, refunds.Series.Count);
        Assert.Empty(refunds.Top);
        Assert.Null(refunds.Tail);

        // Отмены: то же самое по событийному знаменателю.
        var cancellations = dashboard.Cancellations;
        Assert.Equal(0m, cancellations.Value);
        Assert.Null(cancellations.Rate);
        ScenarioAssertions.NoDelta(cancellations.RateDelta);
        Assert.Empty(cancellations.Top);
        Assert.Null(cancellations.Tail);

        // Динамика во времени: обе линии нулевые на всю неделю.
        var revenuePoints = dashboard.TimeSeries.Datasets[0].Items;
        Assert.Equal(28, revenuePoints.Count);

        foreach (var point in revenuePoints)
        {
            Assert.Equal(0m, point.ValueCurrent);
            Assert.Equal(0m, point.ValuePrevious);
        }
    }
}
