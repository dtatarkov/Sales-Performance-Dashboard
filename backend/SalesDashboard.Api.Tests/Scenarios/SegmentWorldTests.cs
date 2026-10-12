using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Сегменты»: клиенты всех трёх сегментов с сделками в одном периоде и
/// одной сделкой в предыдущем — фильтр сегмента должен изолировать срез во всех
/// блоках дашборда (KPI, лента, топы, категории) и в предыдущем периоде Δ.
/// </summary>
public sealed class SegmentWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime Day(int offset, int hour)
        => new(D.Year, D.Month, D.Day + offset, hour, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало активного периода.</summary>
    public static DateTime PeriodFrom => D;

    public static DateTime PeriodTo => Day(7, 0);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    /// <summary>Клиент Enterprise с продажами в обоих периодах.</summary>
    public CustomerEntity CustomerE1 { get; private set; } = null!;

    /// <summary>Клиент Mid-market.</summary>
    public CustomerEntity CustomerM1 { get; private set; } = null!;

    /// <summary>Клиент SMB.</summary>
    public CustomerEntity CustomerS1 { get; private set; } = null!;

    /// <summary>Второй клиент Enterprise.</summary>
    public CustomerEntity CustomerE2 { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет сделки: мульти-менеджер продаёт всем сегментам, соло-менеджер —
    /// только Enterprise; одна сделка E1 лежит в предыдущем периоде.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var multi = graph.AddManager("Мария Мульти", "ММ", "Сегменты");
        var solo = graph.AddManager("Николай Соло", "НС", "Сегменты");
        var category = graph.AddCategory("Сегментное");
        var product = graph.AddProduct("Товар сегментов", "SEG-1", category, 5000m, 2000m);

        CustomerE1 = graph.AddCustomer("ООО Энтерпрайз", "Энтерпрайз", CustomerSegment.Enterprise, 2019);
        CustomerE2 = graph.AddCustomer("ООО Энтерпрайз Два", "Энтерпрайз Два", CustomerSegment.Enterprise, 2021);
        CustomerM1 = graph.AddCustomer("ООО Средний", "Средний", CustomerSegment.MidMarket, 2022);
        CustomerS1 = graph.AddCustomer("ИП Малый", "Малый", CustomerSegment.Smb, 2024);

        // Enterprise: 5000 и 3000 в текущем периоде.
        graph.AddPaidSale(multi, CustomerE1, Day(1, 9), new SaleItemSpec(product, 1, 5000m, 2000m));
        graph.AddPaidSale(multi, CustomerE2, Day(4, 9), new SaleItemSpec(product, 1, 3000m, 1200m));

        // Enterprise: сделка прошлого периода — база сегментной Δ.
        graph.AddPaidSale(multi, CustomerE1, Day(-2, 9), new SaleItemSpec(product, 1, 1000m, 500m));

        // Mid-market и SMB: по одной сделке.
        graph.AddPaidSale(multi, CustomerM1, Day(2, 10), new SaleItemSpec(product, 1, 1000m, 400m));
        graph.AddPaidSale(multi, CustomerS1, Day(3, 11), new SaleItemSpec(product, 1, 100m, 40m));

        // Соло-менеджер: только Enterprise.
        graph.AddPaidSale(solo, CustomerE1, Day(5, 12), new SaleItemSpec(product, 1, 2000m, 800m));
    }
}

/// <summary>
/// Проверки сегментного фильтра: изоляция срезов по KPI, распространение
/// фильтра на все блоки и фильтрация предыдущего периода в Δ.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class SegmentWorldTests : IClassFixture<SegmentWorld>
{
    private readonly SegmentWorld _world;

    public SegmentWorldTests(SegmentWorld world) => _world = world;

    [Fact]
    public async Task Segment_filter_isolates_revenue_and_count_slices()
    {
        // Без сегмента: все пять сделок периода.
        var all = await _world.Host.PostDashboardAsync(SegmentWorld.PeriodFrom, SegmentWorld.PeriodTo, null);
        Assert.Equal(11100m, all.Kpi.Revenue.Value);
        Assert.Equal(5, all.Kpi.SalesCount.Value);

        // Enterprise: 5000 + 3000 + 2000; соло-менеджер тоже внутри.
        var enterprise = await _world.Host.PostDashboardAsync(
            SegmentWorld.PeriodFrom, SegmentWorld.PeriodTo, CustomerSegment.Enterprise);
        Assert.Equal(10000m, enterprise.Kpi.Revenue.Value);
        Assert.Equal(3, enterprise.Kpi.SalesCount.Value);

        // Mid-market и SMB: по одной сделке.
        var midMarket = await _world.Host.PostDashboardAsync(
            SegmentWorld.PeriodFrom, SegmentWorld.PeriodTo, CustomerSegment.MidMarket);
        Assert.Equal(1000m, midMarket.Kpi.Revenue.Value);
        Assert.Equal(1, midMarket.Kpi.SalesCount.Value);

        var smb = await _world.Host.PostDashboardAsync(
            SegmentWorld.PeriodFrom, SegmentWorld.PeriodTo, CustomerSegment.Smb);
        Assert.Equal(100m, smb.Kpi.Revenue.Value);
        Assert.Equal(1, smb.Kpi.SalesCount.Value);
    }

    [Fact]
    public async Task Segment_filter_propagates_to_all_blocks()
    {
        var enterprise = await _world.Host.PostDashboardAsync(
            SegmentWorld.PeriodFrom, SegmentWorld.PeriodTo, CustomerSegment.Enterprise);

        // Лента: только сделки с клиентами Enterprise.
        Assert.Equal(3, enterprise.RecentSales.Sales.Count);

        // Топ клиентов: E1 (4200 ВП) выше E2 (1800); SMB-клиентов нет.
        var customerRows = enterprise.TopCustomers.Datasets[0].Items;
        Assert.Equal(2, customerRows.Count);
        Assert.Equal(_world.CustomerE1.Id, customerRows[0].Id);
        Assert.Equal(4200m, customerRows[0].Gp);
        Assert.Equal(_world.CustomerE2.Id, customerRows[1].Id);

        // Категория одна, доля — вся группа.
        var categoryRows = enterprise.Categories.Datasets[0].Items;
        var categoryItem = Assert.Single(categoryRows);
        Assert.Equal(10000m, categoryItem.Revenue);
        Assert.Equal(100m, categoryItem.Share);
        Assert.Equal(10000m, enterprise.Categories.Datasets[0].Total);

        // Рейтинг менеджеров: соло-менеджер присутствует со своим срезом.
        var ratingRows = enterprise.ManagerRating.Datasets[0].Items;
        Assert.Equal(2, ratingRows.Count);

        var multiRow = Assert.Single(ratingRows, row => row.Name == "Мария Мульти");
        Assert.Equal(8000m, multiRow.Revenue);

        var soloRow = Assert.Single(ratingRows, row => row.Name == "Николай Соло");
        Assert.Equal(2000m, soloRow.Revenue);
    }

    [Fact]
    public async Task Segment_delta_uses_segment_filtered_previous()
    {
        var enterprise = await _world.Host.PostDashboardAsync(
            SegmentWorld.PeriodFrom, SegmentWorld.PeriodTo, CustomerSegment.Enterprise);

        // Enterprise: 10000 против 1000 предыдущего периода.
        ScenarioAssertions.DeltaIs(enterprise.Kpi.Revenue.Delta!, 900m, DeltaUnit.Percent);

        // Mid-market: сделок в предыдущем сегменте нет → Δ null.
        var midMarket = await _world.Host.PostDashboardAsync(
            SegmentWorld.PeriodFrom, SegmentWorld.PeriodTo, CustomerSegment.MidMarket);
        ScenarioAssertions.NoDelta(midMarket.Kpi.Revenue.Delta);
        Assert.Equal(1000m, midMarket.Kpi.Revenue.Value);
    }
}
