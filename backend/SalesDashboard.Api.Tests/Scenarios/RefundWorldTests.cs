using SalesDashboard.Api.Dtos;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Возвраты»: семантика net по когорте оплаты и событийного окна возвратов.
/// Активный период — 10 дней [D, D+10), предыдущий — [D−10, D). Данные
/// закрывают: исключение возвращённой сделки из денег при сохранении в счётчиках,
/// возврат заказа прошлого периода (виден только в блоке потерь), возврат за
/// границей окна (в доле когорты есть, в сумме потерь — нет) и пороги малой
/// выборки по клиентам и товарам (8 сделок).
/// </summary>
public sealed class RefundWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime Day(int offset, int hour)
        => new(D.Year, D.Month, D.Day + offset, hour, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало активного периода.</summary>
    public static DateTime PeriodFrom => D;

    /// <summary>Конец активного периода (не включается).</summary>
    public static DateTime PeriodTo => Day(10, 0);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    /// <summary>Чистая сделка Alpha — для ленты.</summary>
    public SaleEntity SaleClean1 { get; private set; } = null!;

    /// <summary>Сделка, возвращённая внутри окна возвратов.</summary>
    public SaleEntity SaleRefundedInWindow { get; private set; } = null!;

    /// <summary>Сделка, возвращённая за границей периода.</summary>
    public SaleEntity SaleRefundedOutsideWindow { get; private set; } = null!;

    /// <summary>Товар A: основная позиция Alpha.</summary>
    public ProductEntity ProductA { get; private set; } = null!;

    /// <summary>Товар B: носитель «возвратов из другого периода».</summary>
    public ProductEntity ProductB { get; private set; } = null!;

    /// <summary>Товар C: ровно порог выборки (8 сделок, 2 возврата).</summary>
    public ProductEntity ProductC { get; private set; } = null!;

    /// <summary>Товар D: ниже порога (7 сделок).</summary>
    public ProductEntity ProductD { get; private set; } = null!;

    /// <summary>Клиент Rich: 8 сделок, 2 возврата → доля печатается.</summary>
    public CustomerEntity CustomerRich { get; private set; } = null!;

    /// <summary>Клиент Short: 7 сделок → доля ниже порога.</summary>
    public CustomerEntity CustomerShort { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет данные возвратов: Alpha — чистые и возвращённые сделки по товарам
    /// A/B, Rich — 8 сделок товара C с двумя возвратами, Short — 7 сделок
    /// товара D без возвратов.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Дина Возвратова", "ДВ", "Потери");
        var alpha = graph.AddCustomer("ООО Альфа", "Альфа", CustomerSegment.Enterprise, 2021);

        CustomerRich = graph.AddCustomer("ООО Богатый", "Богатый", CustomerSegment.Smb, 2022);
        CustomerShort = graph.AddCustomer("ООО Короткий", "Короткий", CustomerSegment.MidMarket, 2023);

        var electronics = graph.AddCategory("Электроника");
        var accessories = graph.AddCategory("Аксессуары");

        ProductA = graph.AddProduct("Товар A", "REF-A", electronics, 2000m, 800m);
        ProductB = graph.AddProduct("Товар B", "REF-B", electronics, 500m, 200m);
        ProductC = graph.AddProduct("Товар C", "REF-C", accessories, 100m, 40m);
        ProductD = graph.AddProduct("Товар D", "REF-D", accessories, 50m, 20m);

        // Alpha: чистые сделки — деньги периода.
        SaleClean1 = graph.AddPaidSale(manager, alpha, Day(2, 9), new SaleItemSpec(ProductA, 1, 2000m, 800m));
        graph.AddPaidSale(manager, alpha, Day(6, 9), new SaleItemSpec(ProductA, 1, 2000m, 800m));

        // Alpha: возврат внутри окна — исключён из денег, виден в блоке потерь.
        SaleRefundedInWindow = graph.AddRefundedSale(
            manager, alpha, Day(1, 9), Day(3, 9), new SaleItemSpec(ProductA, 1, 1000m, 400m));

        // Alpha: возврат заказа прошлого периода — деньги прошлого не трогает,
        // сумма видна в текущем окне возвратов.
        graph.AddRefundedSale(
            manager, alpha, Day(-5, 9), Day(4, 9), new SaleItemSpec(ProductB, 1, 500m, 200m));

        // Alpha: возврат за границей окна — в когорте есть (доля), в сумме нет.
        SaleRefundedOutsideWindow = graph.AddRefundedSale(
            manager, alpha, Day(5, 9), Day(12, 9), new SaleItemSpec(ProductB, 1, 300m, 100m));

        // Rich: 8 сделок товара C, первая и вторая возвращены (порог = 8).
        for (var index = 0; index < 8; index++)
        {
            var paidAt = Day(1 + index, 11 + index);

            if (index < 2)
                graph.AddRefundedSale(manager, CustomerRich, paidAt, Day(8 + index, 11 + index), new SaleItemSpec(ProductC, 1, 100m, 40m));
            else
                graph.AddPaidSale(manager, CustomerRich, paidAt, new SaleItemSpec(ProductC, 1, 100m, 40m));
        }

        // Short: 7 сделок товара D без возвратов — ниже порога.
        for (var index = 0; index < 7; index++)
        {
            graph.AddPaidSale(manager, CustomerShort, Day(1 + index, 20), new SaleItemSpec(ProductD, 1, 50m, 20m));
        }
    }
}

/// <summary>
/// Проверки возвратов: деньги по когорте net, потери по событию refundAt,
/// когортная доля с порогом выборки, статусы ленты.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class RefundWorldTests : IClassFixture<RefundWorld>
{
    private readonly RefundWorld _world;

    public RefundWorldTests(RefundWorld world) => _world = world;

    [Fact]
    public async Task Kpi_excludes_refunded_money_but_keeps_the_count()
    {
        var dashboard = await _world.Host.PostDashboardAsync(RefundWorld.PeriodFrom, RefundWorld.PeriodTo, null);

        // Выручка: 4000 (Alpha) + 600 (Rich net) + 350 (Short) = 4950.
        Assert.Equal(4950m, dashboard.Kpi.Revenue.Value);

        // Счётчик когорты включает возвращённые: 4 + 8 + 7 = 19.
        Assert.Equal(19, dashboard.Kpi.SalesCount.Value);

        // Валовая прибыль: 4950 − 1980; маржа — ровно 60%.
        Assert.Equal(2970m, dashboard.Kpi.Gp.Value);
        Assert.Equal(60m, dashboard.Kpi.Margin.Value);

        // Средний чек делит выручку на полную когорту.
        Assert.Equal(4950m / 19m, dashboard.Kpi.AvgCheck.Value);

        // Предыдущий период содержит единственную сделку — возвращённую:
        // деньги нулевые (Δ выручки null), но счётчик когорты равен 1 → Δ 1800%.
        ScenarioAssertions.NoDelta(dashboard.Kpi.Revenue.Delta);
        ScenarioAssertions.DeltaIs(dashboard.Kpi.SalesCount.Delta!, 1800m, DeltaUnit.Percent);
        ScenarioAssertions.NoDelta(dashboard.Kpi.Margin.Delta);
        ScenarioAssertions.NoDelta(dashboard.Kpi.AvgCheck.Delta);
    }

    [Fact]
    public async Task Refunds_block_is_event_based_with_cohort_rate()
    {
        var dashboard = await _world.Host.PostDashboardAsync(RefundWorld.PeriodFrom, RefundWorld.PeriodTo, null);

        var refunds = dashboard.Refunds;

        // Сумма по событиям refundAt: 1000 + 500 + 100 + 100 = 1700;
        // возврат за границей окна (09-22) в сумму не попал.
        Assert.Equal(1700m, refunds.Value);

        // Доля когортная: 4 возвращённых из 19 когорты (включая возврат
        // за границей окна, у которого paidAt внутри).
        Assert.Equal(4m / 19m * 100m, refunds.Rate);

        // Предыдущий период: единственная сделка возвращена → база 100%,
        // Δ в п.п.
        var expectedRate = 4m / 19m * 100m;
        ScenarioAssertions.DeltaIs(refunds.RateDelta!, expectedRate - 100m, DeltaUnit.Pp);

        // Ряд по бакетам сетки (10 дней → шаг 8 ч → 30 бакетов): события
        // возвратов 13.09 09:00 → бакет 10, 14.09 09:00 → 13, 18.09 11:00 → 25,
        // 19.09 11:00 → 28.
        var series = refunds.Series;
        Assert.Equal(30, series.Count);
        Assert.Equal(1000m, series[10].Value);
        Assert.Equal(500m, series[13].Value);
        Assert.Equal(100m, series[25].Value);
        Assert.Equal(100m, series[28].Value);

        // Топ по товарам: A 1000, B 500, C 200; нормировано к максимуму.
        Assert.Equal(3, refunds.Top.Count);
        Assert.Equal(_world.ProductA.Id, refunds.Top[0].Id);
        Assert.Equal(1000m, refunds.Top[0].ValueAbsolute);
        Assert.Equal(1000m / 1700m * 100m, refunds.Top[0].ValueRelative);
        Assert.Equal(100m, refunds.Top[0].ValueNormalized);
        Assert.Equal(_world.ProductB.Id, refunds.Top[1].Id);
        Assert.Equal(500m, refunds.Top[1].ValueAbsolute);
        Assert.Equal(50m, refunds.Top[1].ValueNormalized);
        Assert.Equal(_world.ProductC.Id, refunds.Top[2].Id);
        Assert.Equal(200m, refunds.Top[2].ValueAbsolute);

        // Товаров с потерями меньше топ-10 — хвоста нет.
        Assert.Null(refunds.Tail);
    }

    [Fact]
    public async Task Refund_rate_thresholds_gate_customer_and_product_rows()
    {
        var dashboard = await _world.Host.PostDashboardAsync(RefundWorld.PeriodFrom, RefundWorld.PeriodTo, null);

        // Клиенты: Rich 2/8 = 25% (порог пройден), Short 7 сделок — ниже
        // порога, Alpha 4 сделки — тоже ниже порога.
        var gpRows = dashboard.TopCustomers.Datasets[0].Items;

        var richRow = Assert.Single(gpRows, row => row.Id == _world.CustomerRich.Id);
        Assert.Equal(25m, richRow.RefundRate);

        var shortRow = Assert.Single(gpRows, row => row.Id == _world.CustomerShort.Id);
        Assert.Null(shortRow.RefundRate);

        var alphaRow = Assert.Single(gpRows, row => row.Name == "ООО Альфа");
        Assert.Null(alphaRow.RefundRate);

        // Товары: C 2/8 = 25%, A — 3 сделки, D — 7 сделок: ниже порога.
        var productRows = dashboard.TopProducts.Datasets[0].Items;

        var productC = Assert.Single(productRows, row => row.Id == _world.ProductC.Id);
        Assert.Equal(25m, productC.RefundRate);

        var productA = Assert.Single(productRows, row => row.Id == _world.ProductA.Id);
        Assert.Null(productA.RefundRate);

        var productD = Assert.Single(productRows, row => row.Id == _world.ProductD.Id);
        Assert.Null(productD.RefundRate);
    }

    [Fact]
    public async Task Feed_marks_refunded_sales_and_nulls_their_gp()
    {
        var dashboard = await _world.Host.PostDashboardAsync(RefundWorld.PeriodFrom, RefundWorld.PeriodTo, null);

        var sales = dashboard.RecentSales.Sales;

        // Когорта оплаты: 19 сделок, лента не обрезается (лимит 20).
        Assert.Equal(19, sales.Count);

        // Возвращённая в окне: статус 2, gp null, выручка сырая.
        var refundedInWindow = Assert.Single(sales, sale => sale.Id == _world.SaleRefundedInWindow.Id);
        Assert.Equal(SaleStatus.Refunded, refundedInWindow.Status);
        Assert.Null(refundedInWindow.Gp);
        Assert.Equal(1000m, refundedInWindow.Revenue);

        // Возврат за границей окна не мешает статусу: сделка оплачена в периоде.
        var refundedOutside = Assert.Single(sales, sale => sale.Id == _world.SaleRefundedOutsideWindow.Id);
        Assert.Equal(SaleStatus.Refunded, refundedOutside.Status);
        Assert.Null(refundedOutside.Gp);

        // Чистая сделка: статус 1 и посчитанная валовая прибыль.
        var clean = Assert.Single(sales, sale => sale.Id == _world.SaleClean1.Id);
        Assert.Equal(SaleStatus.Paid, clean.Status);
        Assert.Equal(1200m, clean.Gp);

        // Сделка прошлого периода (оплачена 05.09) в ленту периода не попала.
        Assert.DoesNotContain(sales, sale => sale.Client == "ООО Альфа" && sale.Date < RefundWorld.PeriodFrom);
    }
}
