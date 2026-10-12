using SalesDashboard.Api.Dtos;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Дельты»: контролируемые итоги трёх соседних недель. Неделя W1 — рост
/// против предыдущей (все относительные Δ и Δ долей в п.п. вычислимы), неделя
/// W2 — пустая против непустой W1 (падение до −100%, доли не определены),
/// неделя W3 — пустая против пустой W2 (нулевой базой Δ не вычисляется).
/// Плюс товар и категория, существующие только в предыдущем периоде.
/// </summary>
public sealed class DeltaWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 7, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime Day(int offset, int hour)
        => new(D.Year, D.Month, D.Day + offset, hour, 0, 0, DateTimeKind.Utc);

    /// <summary>Неделя W1: текущий период с ростом.</summary>
    public static DateTime Week1From => D;

    public static DateTime Week1To => Day(7, 0);

    /// <summary>Неделя W2: пустая текущая, непустая предыдущая.</summary>
    public static DateTime Week2From => Day(7, 0);

    public static DateTime Week2To => Day(14, 0);

    /// <summary>Неделя W3: пустые обе стороны сравнения.</summary>
    public static DateTime Week3From => Day(14, 0);

    public static DateTime Week3To => Day(21, 0);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    /// <summary>Основной товар недели W1.</summary>
    public ProductEntity ProductMain { get; private set; } = null!;

    /// <summary>Товар, продававшийся только в предыдущем периоде.</summary>
    public ProductEntity ProductGhost { get; private set; } = null!;

    /// <summary>Категория товара-призрака.</summary>
    public CategoryEntity CategoryGhost { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет три недели: W1 — сделка 2000/800, возвращённая сделка 700/300 и
    /// отмена 900/400; предыдущая — сделка 1000/500 (маржа 50%), две отмены и
    /// товар-призрак; W2/W3 не заполняются.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Игорь Дельта", "ИД", "Динамика");
        var customer = graph.AddCustomer("ООО Сравнение", "Сравнение", CustomerSegment.Enterprise, 2020);
        var categoryMain = graph.AddCategory("Основная");

        CategoryGhost = graph.AddCategory("Призрачная");
        ProductMain = graph.AddProduct("Товар основной", "DLT-M", categoryMain, 2000m, 800m);
        ProductGhost = graph.AddProduct("Товар призрак", "DLT-G", CategoryGhost, 100m, 50m);

        // Неделя W1: рост против предыдущей.
        graph.AddPaidSale(manager, customer, Day(3, 10), new SaleItemSpec(ProductMain, 1, 2000m, 800m));
        graph.AddRefundedSale(manager, customer, Day(1, 10), Day(6, 10), new SaleItemSpec(ProductMain, 1, 700m, 300m));
        graph.AddCancelledSale(manager, customer, Day(4, 10), new SaleItemSpec(ProductMain, 1, 900m, 400m));

        // Предыдущая неделя: база Δ — сделка с маржой 50%, две отмены и призрак.
        graph.AddPaidSale(manager, customer, Day(-4, 10), new SaleItemSpec(ProductMain, 1, 1000m, 500m));
        graph.AddCancelledSale(manager, customer, Day(-2, 10), new SaleItemSpec(ProductMain, 1, 400m, 200m));
        graph.AddCancelledSale(manager, customer, Day(-6, 10), new SaleItemSpec(ProductMain, 1, 200m, 100m));
        graph.AddPaidSale(manager, customer, Day(-5, 10), new SaleItemSpec(ProductGhost, 1, 100m, 50m));
    }
}

/// <summary>
/// Проверки Δ: относительный процент для значений, процентные пункты для долей,
/// нулевая база → Δ null, отсутствие строк «только из прошлого».
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class DeltaWorldTests : IClassFixture<DeltaWorld>
{
    private readonly DeltaWorld _world;

    public DeltaWorldTests(DeltaWorld world) => _world = world;

    [Fact]
    public async Task Growth_deltas_compare_matching_windows()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DeltaWorld.Week1From, DeltaWorld.Week1To, null);
        var kpi = dashboard.Kpi;

        // Выручка 2000 против 1100 (включая призрака); валовая прибыль
        // 1200 против 550.
        Assert.Equal(2000m, kpi.Revenue.Value);
        ScenarioAssertions.DeltaIs(kpi.Revenue.Delta!, (2000m - 1100m) / 1100m * 100m, DeltaUnit.Percent);
        Assert.Equal(1200m, kpi.Gp.Value);
        ScenarioAssertions.DeltaIs(kpi.Gp.Delta!, (1200m - 550m) / 550m * 100m, DeltaUnit.Percent);

        // Маржа 60% против 50% — Δ в процентных пунктах.
        Assert.Equal(60m, kpi.Margin.Value);
        ScenarioAssertions.DeltaIs(kpi.Margin.Delta!, 10m, DeltaUnit.Pp);

        // Число продаж 2 против 2 — Δ 0%; средний чек 1000 против 550.
        Assert.Equal(2, kpi.SalesCount.Value);
        ScenarioAssertions.DeltaIs(kpi.SalesCount.Delta!, 0m, DeltaUnit.Percent);
        Assert.Equal(1000m, kpi.AvgCheck.Value);
        ScenarioAssertions.DeltaIs(kpi.AvgCheck.Delta!, (1000m - 550m) / 550m * 100m, DeltaUnit.Percent);

        // Лидер считает Δ по собственной ВП (550 в прошлой неделе).
        var bestManager = kpi.BestManager!;
        Assert.Equal(1200m, bestManager.Gp);
        ScenarioAssertions.DeltaIs(bestManager.Delta!, (1200m - 550m) / 550m * 100m, DeltaUnit.Percent);

        // Сопоставление бакетов: текущий D+3 10:00 (бакет 13 шестичасовой сетки)
        // против предыдущего D−4 10:00 — пары по индексу.
        var revenuePoints = dashboard.TimeSeries.Datasets[0].Items;
        Assert.Equal(28, revenuePoints.Count);
        Assert.Equal(2000m, revenuePoints[13].ValueCurrent);
        Assert.Equal(1000m, revenuePoints[13].ValuePrevious);
        Assert.Equal(0m, revenuePoints[20].ValueCurrent);
        Assert.Equal(0m, revenuePoints[20].ValuePrevious);
    }

    [Fact]
    public async Task Empty_week_declines_to_minus_100_and_next_one_has_no_base()
    {
        // W2: текущая пустая, предыдущая (W1) непустая — честное падение.
        var declining = await _world.Host.PostDashboardAsync(DeltaWorld.Week2From, DeltaWorld.Week2To, null);
        var decliningKpi = declining.Kpi;

        Assert.Equal(0m, decliningKpi.Revenue.Value);
        ScenarioAssertions.DeltaIs(decliningKpi.Revenue.Delta!, -100m, DeltaUnit.Percent);
        ScenarioAssertions.DeltaIs(decliningKpi.SalesCount.Delta!, -100m, DeltaUnit.Percent);
        ScenarioAssertions.DeltaIs(decliningKpi.Gp.Delta!, -100m, DeltaUnit.Percent);

        // Доли при нулевой текущей выручке не определены, Δ тоже.
        Assert.Null(decliningKpi.Margin.Value);
        ScenarioAssertions.NoDelta(decliningKpi.Margin.Delta);
        Assert.Null(decliningKpi.AvgCheck.Value);
        ScenarioAssertions.NoDelta(decliningKpi.AvgCheck.Delta);

        // Продаж в неделе нет — лидера нет.
        Assert.Null(decliningKpi.BestManager);

        // Сравнение менеджеров: нулевая строка с честной Δ −100%.
        var comparisonRow = Assert.Single(declining.ManagerComparison.Datasets[0].Items);
        Assert.Equal(0m, comparisonRow.Value);
        ScenarioAssertions.DeltaIs(comparisonRow.Delta!, -100m, DeltaUnit.Percent);

        // W3: обе стороны пусты — базой нуля Δ не вычисляется.
        var empty = await _world.Host.PostDashboardAsync(DeltaWorld.Week3From, DeltaWorld.Week3To, null);
        var emptyKpi = empty.Kpi;

        Assert.Equal(0m, emptyKpi.Revenue.Value);
        ScenarioAssertions.NoDelta(emptyKpi.Revenue.Delta);
        ScenarioAssertions.NoDelta(emptyKpi.SalesCount.Delta);
        Assert.Null(emptyKpi.Margin.Value);
        Assert.Null(emptyKpi.BestManager);
    }

    [Fact]
    public async Task Loss_rates_delta_in_percentage_points()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DeltaWorld.Week1From, DeltaWorld.Week1To, null);

        // Доля возвратов: 1 возвращённая из 2 когорты = 50%; предыдущая
        // неделя — 0 из 2; Δ в п.п.
        Assert.Equal(700m, dashboard.Refunds.Value);
        Assert.Equal(50m, dashboard.Refunds.Rate);
        ScenarioAssertions.DeltaIs(dashboard.Refunds.RateDelta!, 50m, DeltaUnit.Pp);

        // Доля отмен событийная: 1 отмена / (2 оплаты + 1 отмена) = 33⅓%;
        // предыдущая — 2 отмены / 4 закрытых = 50%; Δ в п.п.
        Assert.Equal(900m, dashboard.Cancellations.Value);
        Assert.Equal(1m / 3m * 100m, dashboard.Cancellations.Rate);

        var expectedDelta = 1m / 3m * 100m - 50m;
        ScenarioAssertions.DeltaIs(dashboard.Cancellations.RateDelta!, expectedDelta, DeltaUnit.Pp);
    }

    [Fact]
    public async Task Previous_only_entities_do_not_appear_in_current_blocks()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DeltaWorld.Week1From, DeltaWorld.Week1To, null);

        // Товар-призрак продавался только в предыдущей неделе — в текущих
        // блоках строки нет.
        var productRows = dashboard.TopProducts.Datasets[0].Items;
        Assert.Single(productRows);
        Assert.Equal(_world.ProductMain.Id, productRows[0].Id);

        // Призрачная категория тоже отсутствует, основная — с Δ от своей базы.
        var categoryRows = dashboard.Categories.Datasets[0].Items;
        Assert.Single(categoryRows);
        Assert.Equal("Основная", categoryRows[0].Name);
        ScenarioAssertions.DeltaIs(categoryRows[0].RevenueDelta!, 100m, DeltaUnit.Percent);
    }
}
