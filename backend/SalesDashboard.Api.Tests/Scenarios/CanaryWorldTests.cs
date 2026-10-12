using System.Text.Json;
using SalesDashboard.Api.Dtos;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Канарейка»: минимальное состояние БД — два менеджера (один без сделок),
/// три клиента в разных сегментах, две категории, два товара и одна оплаченная
/// сделка на две позиции. Период — три дня, сделка во второй день; предыдущий
/// период пуст. Предназначен для сквозной проверки арифметики всех блоков на
/// данных, которые можно пересчитать в уме.
/// </summary>
public sealed class CanaryWorld(PostgresFixture postgres) : IAsyncLifetime
{
    /// <summary>Начало активного периода [14.09, 17.09).</summary>
    public static readonly DateTime PeriodFrom = new(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Конец активного периода (не включается).</summary>
    public static readonly DateTime PeriodTo = new(2026, 9, 17, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Момент оплаты единственной сделки мира.</summary>
    public static readonly DateTime PaidAt = new(2026, 9, 15, 10, 0, 0, DateTimeKind.Utc);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    /// <summary>Менеджер, совершивший единственную сделку.</summary>
    public ManagerEntity ManagerAnna { get; private set; } = null!;

    /// <summary>Менеджер без сделок — проверка нулевых строк рейтинга.</summary>
    public ManagerEntity ManagerBoris { get; private set; } = null!;

    /// <summary>Клиент сделки (Enterprise).</summary>
    public CustomerEntity CustomerVector { get; private set; } = null!;

    /// <summary>Категория дронов.</summary>
    public CategoryEntity CategoryDrones { get; private set; } = null!;

    /// <summary>Товар-дрон: 2 шт × 100 000, себестоимость 70 000.</summary>
    public ProductEntity ProductDrone { get; private set; } = null!;

    /// <summary>Товар-камера: 1 шт × 40 000, себестоимость 25 000.</summary>
    public ProductEntity ProductCamera { get; private set; } = null!;

    /// <summary>Единственная сделка мира.</summary>
    public SaleEntity Sale { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Конструирует данные мира: справочники и сделку с известными суммами —
    /// выручка 240 000, себестоимость 165 000, валовая прибыль 75 000.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        ManagerAnna = graph.AddManager("Анна Смирнова", "АС", "Альфа");
        ManagerBoris = graph.AddManager("Борис Орлов", "БО", "Альфа");
        CustomerVector = graph.AddCustomer("ООО Вектор", "Вектор", CustomerSegment.Enterprise, 2020);

        graph.AddCustomer("ООО Гамма", "Гамма", CustomerSegment.MidMarket, 2022);
        graph.AddCustomer("ИП Дельта", "Дельта", CustomerSegment.Smb, 2024);

        CategoryDrones = graph.AddCategory("Дроны");

        var cameras = graph.AddCategory("Камеры");

        ProductDrone = graph.AddProduct("DJI Mini 4 Pro", "DJI-M4P", CategoryDrones, 120000m, 80000m);
        ProductCamera = graph.AddProduct("GoPro Hero 12", "GOPRO-12", cameras, 40000m, 25000m);

        Sale = graph.AddPaidSale(
            ManagerAnna,
            CustomerVector,
            PaidAt,
            new SaleItemSpec(ProductDrone, 2, 100000m, 70000m),
            new SaleItemSpec(ProductCamera, 1, 40000m, 25000m));
    }
}

/// <summary>
/// Сквозные проверки дашборда на мире «Канарейка»: каждая карточка, топ и серия
/// сверяется с числами, пересчитанными вручную из единственной сделки.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class CanaryWorldTests : IClassFixture<CanaryWorld>
{
    private readonly CanaryWorld _world;

    public CanaryWorldTests(CanaryWorld world) => _world = world;
    [Fact]
    public async Task Kpi_cards_carry_values_null_deltas_and_grid_series()
    {
        var dashboard = await _world.Host.PostDashboardAsync(CanaryWorld.PeriodFrom, CanaryWorld.PeriodTo, null);
        var kpi = dashboard.Kpi;

        // Выручка: значение периода, Δ null против пустой базы, серия с нулями
        // в бакетах без продаж. Трёхдневный период → шаг 2 ч → 36 бакетов;
        // сделка 15.09 10:00 попадает в бакет с индексом 34 ч / 2 ч = 17.
        Assert.Equal(240000m, kpi.Revenue.Value);
        ScenarioAssertions.NoDelta(kpi.Revenue.Delta);
        Assert.Equal(36, kpi.Revenue.Series.Count);
        Assert.Equal(0m, kpi.Revenue.Series[0].Value);
        Assert.Equal(240000m, kpi.Revenue.Series[17].Value);
        Assert.Equal(0m, kpi.Revenue.Series[35].Value);

        // Валовая прибыль: 240 000 − 165 000.
        Assert.Equal(75000m, kpi.Gp.Value);
        ScenarioAssertions.NoDelta(kpi.Gp.Delta);
        Assert.Equal(75000m, kpi.Gp.Series[17].Value);

        // Маржа: 75 000 / 240 000 × 100; серия sparse — только бакет с выручкой.
        Assert.Equal(31.25m, kpi.Margin.Value);
        ScenarioAssertions.NoDelta(kpi.Margin.Delta);
        var marginPoint = Assert.Single(kpi.Margin.Series);
        Assert.Equal(31.25m, marginPoint.Value);
        Assert.Equal(CanaryWorld.PaidAt, marginPoint.DateFrom);
        Assert.Equal(CanaryWorld.PaidAt.AddHours(2), marginPoint.DateTo);

        // Число продаж: возвращённых нет, счётчик когорты.
        Assert.Equal(1, kpi.SalesCount.Value);
        ScenarioAssertions.NoDelta(kpi.SalesCount.Delta);
        Assert.Equal(1m, kpi.SalesCount.Series[17].Value);

        // Средний чек: 240 000 / 1; серия sparse.
        Assert.Equal(240000m, kpi.AvgCheck.Value);
        ScenarioAssertions.NoDelta(kpi.AvgCheck.Delta);
        var avgCheckPoint = Assert.Single(kpi.AvgCheck.Series);
        Assert.Equal(240000m, avgCheckPoint.Value);
    }

    [Fact]
    public async Task Best_manager_is_the_only_seller_without_delta()
    {
        var dashboard = await _world.Host.PostDashboardAsync(CanaryWorld.PeriodFrom, CanaryWorld.PeriodTo, null);

        var bestManager = dashboard.Kpi.BestManager;

        Assert.NotNull(bestManager);
        Assert.Equal(_world.ManagerAnna.Id, bestManager.Id);
        Assert.Equal("Анна Смирнова", bestManager.Name);
        Assert.Equal("АС", bestManager.Initials);
        Assert.Null(bestManager.Avatar);
        Assert.Equal(75000m, bestManager.Gp);
        Assert.Equal(1, bestManager.SalesCount);

        // База Δ лидера в предыдущем периоде пуста → Δ null.
        ScenarioAssertions.NoDelta(bestManager.Delta);

        // Серия лидера — его выручка, непрерывная по сетке периода.
        Assert.Equal(36, bestManager.Series.Count);
        Assert.Equal(240000m, bestManager.Series[17].Value);
        Assert.Equal(0m, bestManager.Series[0].Value);
    }

    [Fact]
    public async Task Rating_includes_idle_manager_and_comparison_repeats_the_order()
    {
        var dashboard = await _world.Host.PostDashboardAsync(CanaryWorld.PeriodFrom, CanaryWorld.PeriodTo, null);

        var datasets = dashboard.ManagerRating.Datasets;

        Assert.Equal(2, datasets.Count);
        Assert.Equal("Валовая прибыль", datasets[0].Name);
        Assert.Equal("Средний чек", datasets[1].Name);

        // Датасет ВП: Анна сверху, Борис с нулями — бездействующий не выпадает.
        var gpRows = datasets[0].Items;
        Assert.Equal(2, gpRows.Count);
        Assert.Equal(_world.ManagerAnna.Id, gpRows[0].Id);
        Assert.Equal(_world.ManagerBoris.Id, gpRows[1].Id);

        var anna = gpRows[0];
        Assert.Equal(1, anna.SalesCount);
        Assert.Equal(240000m, anna.Revenue);
        Assert.Equal(75000m, anna.Gp);
        Assert.Equal(240000m, anna.Ac);
        Assert.Equal(31.25m, anna.Margin);
        Assert.Null(anna.CancelRate);

        // Вклад по ВП: 100% от суммы группы, бар от максимума.
        Assert.Equal(75000m, anna.Contribution.ValueAbsolute);
        Assert.Equal(100m, anna.Contribution.ValueRelative);
        Assert.Equal(ContributionBasis.GrossProfit, anna.Contribution.ValueRelativeUnit);
        Assert.Equal(100m, anna.Contribution.ValueNormalized);

        var boris = gpRows[1];
        Assert.Equal(0m, boris.Revenue);
        Assert.Equal(0m, boris.Gp);
        Assert.Equal(0m, boris.Ac);
        Assert.Null(boris.Margin);
        Assert.Null(boris.RevenueDelta);
        Assert.Null(boris.GpDelta);
        Assert.Equal(0m, boris.Contribution.ValueRelative);
        Assert.Equal(0m, boris.Contribution.ValueNormalized);

        // Датасет среднего чека: вклад — кратность к среднему по группе.
        var acRows = datasets[1].Items;
        Assert.Equal(_world.ManagerAnna.Id, acRows[0].Id);
        Assert.Equal(1m, acRows[0].Contribution.ValueRelative);
        Assert.Equal(ContributionBasis.AverageCheck, acRows[0].Contribution.ValueRelativeUnit);

        // Сравнение повторяет порядок рейтинга, только метрика и Δ.
        var comparisonRows = dashboard.ManagerComparison.Datasets[0].Items;
        Assert.Equal(2, comparisonRows.Count);
        Assert.Equal(_world.ManagerAnna.Id, comparisonRows[0].Id);
        Assert.Equal(75000m, comparisonRows[0].Value);
        ScenarioAssertions.NoDelta(comparisonRows[0].Delta);
        Assert.Equal(_world.ManagerBoris.Id, comparisonRows[1].Id);
        Assert.Equal(0m, comparisonRows[1].Value);
    }

    [Fact]
    public async Task Customer_top_lists_only_buyers_and_dynamics_stays_empty()
    {
        var dashboard = await _world.Host.PostDashboardAsync(CanaryWorld.PeriodFrom, CanaryWorld.PeriodTo, null);

        var gpDataset = dashboard.TopCustomers.Datasets[0];
        Assert.Equal("Валовая прибыль", gpDataset.Name);

        var item = Assert.Single(gpDataset.Items);
        Assert.Equal(_world.CustomerVector.Id, item.Id);
        Assert.Equal("ООО Вектор", item.Name);
        Assert.Equal(2020, item.Since);
        Assert.Equal(1, item.OrderCount);
        Assert.Equal(240000m, item.Revenue);
        Assert.Equal(75000m, item.Gp);
        Assert.Equal(240000m, item.Ac);
        Assert.Equal(31.25m, item.Margin);
        Assert.Null(item.RefundRate);
        Assert.Null(item.CancelRate);
        Assert.Equal(100m, item.Contribution.ValueRelative);

        // Клиент без предыдущего периода — Δ null, в динамику не попадает.
        ScenarioAssertions.DynamicsEmpty(dashboard.CustomerDynamics);
    }

    [Fact]
    public async Task TimeSeries_categories_and_products_aggregate_from_items()
    {
        var dashboard = await _world.Host.PostDashboardAsync(CanaryWorld.PeriodFrom, CanaryWorld.PeriodTo, null);

        // Динамика во времени: три датасета, предыдущий период пуст.
        var timeDatasets = dashboard.TimeSeries.Datasets;
        Assert.Equal(3, timeDatasets.Count);
        Assert.Equal("Выручка", timeDatasets[0].Name);
        Assert.Equal("Валовая прибыль", timeDatasets[1].Name);
        Assert.Equal("Кол-во продаж", timeDatasets[2].Name);

        var revenuePoints = timeDatasets[0].Items;
        Assert.Equal(36, revenuePoints.Count);
        Assert.Equal(0m, revenuePoints[0].ValueCurrent);
        Assert.Equal(240000m, revenuePoints[17].ValueCurrent);
        Assert.Equal(0m, revenuePoints[35].ValueCurrent);

        foreach (var point in revenuePoints)
            Assert.Equal(0m, point.ValuePrevious);

        // Категории: доли от суммы набора, total — центр бублика.
        var revenueDataset = dashboard.Categories.Datasets[0];
        Assert.Equal("Выручка", revenueDataset.Name);
        Assert.Equal(240000m, revenueDataset.Total);
        Assert.Equal(2, revenueDataset.Items.Count);

        var droneCategory = revenueDataset.Items[0];
        Assert.Equal(_world.CategoryDrones.Id, droneCategory.Id);
        Assert.Equal(200000m, droneCategory.Revenue);
        Assert.Equal(60000m, droneCategory.Gp);
        Assert.Equal(30m, droneCategory.Margin);
        Assert.Equal(1, droneCategory.SalesCount);
        Assert.Equal(200000m / 240000m * 100m, droneCategory.Share);

        var cameraCategory = revenueDataset.Items[1];
        Assert.Equal(40000m, cameraCategory.Revenue);
        Assert.Equal(40000m / 240000m * 100m, cameraCategory.Share);

        var gpDataset = dashboard.Categories.Datasets[1];
        Assert.Equal(75000m, gpDataset.Total);
        Assert.Equal(60000m, gpDataset.Items[0].Gp);
        Assert.Equal(80m, gpDataset.Items[0].Share);
        Assert.Equal(20m, gpDataset.Items[1].Share);

        // Продукты: три датасета, вклад каждой строки — от своей метрики.
        var productDatasets = dashboard.TopProducts.Datasets;
        Assert.Equal(3, productDatasets.Count);
        Assert.Equal("Выручка", productDatasets[0].Name);
        Assert.Equal("Валовая прибыль", productDatasets[1].Name);
        Assert.Equal("Продано шт", productDatasets[2].Name);

        var byRevenue = productDatasets[0].Items;
        Assert.Equal(2, byRevenue.Count);
        Assert.Equal(_world.ProductDrone.Id, byRevenue[0].Id);
        Assert.Equal("DJI-M4P", byRevenue[0].Sku);
        Assert.Equal("Дроны", byRevenue[0].Category);
        Assert.Equal(200000m, byRevenue[0].Revenue);
        Assert.Equal(60000m, byRevenue[0].Gp);
        Assert.Equal(2, byRevenue[0].Units);
        Assert.Equal(30m, byRevenue[0].Margin);
        Assert.Null(byRevenue[0].RefundRate);
        Assert.Equal(200000m, byRevenue[0].Contribution.ValueAbsolute);
        Assert.Equal(200000m / 240000m * 100m, byRevenue[0].Contribution.ValueRelative);
        Assert.Equal(ContributionBasis.Revenue, byRevenue[0].Contribution.ValueRelativeUnit);

        var byUnits = productDatasets[2].Items;
        Assert.Equal(_world.ProductDrone.Id, byUnits[0].Id);
        Assert.Equal(2, byUnits[0].Units);
        Assert.Equal(ContributionBasis.Units, byUnits[0].Contribution.ValueRelativeUnit);
        Assert.Equal(2m, byUnits[0].Contribution.ValueAbsolute);
    }

    [Fact]
    public async Task Feed_refunds_and_cancellations_show_real_zeros()
    {
        var dashboard = await _world.Host.PostDashboardAsync(CanaryWorld.PeriodFrom, CanaryWorld.PeriodTo, null);

        // Лента: единственная оплаченная сделка с сырыми суммами позиций.
        var sale = Assert.Single(dashboard.RecentSales.Sales);
        Assert.Equal(_world.Sale.Id, sale.Id);
        Assert.Equal("ООО Вектор", sale.Client);
        Assert.Equal("Анна Смирнова", sale.Manager);
        Assert.Equal(CanaryWorld.PaidAt, sale.Date);
        Assert.Equal(2, sale.ItemsCount);
        Assert.Equal(SaleStatus.Paid, sale.Status);
        Assert.Equal(240000m, sale.Revenue);
        Assert.Equal(75000m, sale.Gp);

        // Возвратов нет, но когорта непуста → реальный ноль доли, Δ null.
        var refunds = dashboard.Refunds;
        Assert.Equal(0m, refunds.Value);
        Assert.Equal(0m, refunds.Rate);
        ScenarioAssertions.NoDelta(refunds.RateDelta);
        Assert.Equal(36, refunds.Series.Count);

        foreach (var point in refunds.Series)
            Assert.Equal(0m, point.Value);

        Assert.Empty(refunds.Top);
        Assert.Null(refunds.Tail);

        // Отмены — то же самое по событийной доле.
        var cancellations = dashboard.Cancellations;
        Assert.Equal(0m, cancellations.Value);
        Assert.Equal(0m, cancellations.Rate);
        ScenarioAssertions.NoDelta(cancellations.RateDelta);
        Assert.Equal(36, cancellations.Series.Count);
        Assert.Empty(cancellations.Top);
        Assert.Null(cancellations.Tail);
    }
}
