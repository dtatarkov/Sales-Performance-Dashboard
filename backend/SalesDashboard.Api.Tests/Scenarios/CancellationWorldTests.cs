using SalesDashboard.Api.Dtos;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Отмены»: событийная доля отмен по cancelledAt и её знаменатель
/// (оплаченные + отменённые), порог малой выборки по менеджеру (5 закрытых
/// сделок), отмена заказа прошлого периода и период, где отмена — единственный
/// исход. Активный период — 8 дней [D, D+8); предыдущий содержит одну отмену
/// для Δ доли.
/// </summary>
public sealed class CancellationWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc);

    private static DateTime Day(int offset, int hour)
        => new(D.Year, D.Month, D.Day + offset, hour, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало активного периода.</summary>
    public static DateTime PeriodFrom => D;

    /// <summary>Конец активного периода (не включается).</summary>
    public static DateTime PeriodTo => Day(8, 0);

    /// <summary>День, в котором разрешается только отмена — для доли 100%.</summary>
    public static DateTime OnlyCancellationsDay => Day(7, 0);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    /// <summary>Менеджер с достаточной выборкой отмен.</summary>
    public ManagerEntity ManagerHigh { get; private set; } = null!;

    /// <summary>Менеджер ниже порога выборки.</summary>
    public ManagerEntity ManagerLow { get; private set; } = null!;

    /// <summary>Менеджер только с отменой и без оплат.</summary>
    public ManagerEntity ManagerOnlyCancel { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет отмены: High — 4 оплаты и 2 отмены (одна из прошлого периода),
    /// Low — 3 оплаты и 1 отмена (ниже порога), OnlyCancel — единственная
    /// отмена в отдельном дне; плюс отмена в предыдущем периоде для Δ.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var customer = graph.AddCustomer("ООО Отмена", "Отмена", CustomerSegment.MidMarket, 2022);
        var category = graph.AddCategory("Отменяемое");
        var product = graph.AddProduct("Товар отмен", "CXL-1", category, 100m, 40m);

        ManagerHigh = graph.AddManager("Егор Многоотмен", "ЕМ", "Отмены");
        ManagerLow = graph.AddManager("Жанна Малоотмен", "ЖМ", "Отмены");
        ManagerOnlyCancel = graph.AddManager("Захар Толькотмен", "ЗТ", "Отмены");

        // High: 4 оплаченные сделки по 100/40.
        for (var index = 0; index < 4; index++)
        {
            graph.AddPaidSale(ManagerHigh, customer, Day(1 + index, 9), new SaleItemSpec(product, 1, 100m, 40m));
        }

        // High: отмена в текущем периоде на 500/200.
        graph.AddCancelledSale(ManagerHigh, customer, Day(5, 10), new SaleItemSpec(product, 1, 500m, 200m));

        // High: отмена заказа, созданного в предыдущем периоде (paidAt нет).
        graph.AddCancelledSale(ManagerHigh, customer, Day(2, 11), new SaleItemSpec(product, 1, 300m, 120m));

        // Low: 3 оплаты по 80/30 и одна отмена на 400/100 — выборка 4 < 5.
        for (var index = 0; index < 3; index++)
        {
            graph.AddPaidSale(ManagerLow, customer, Day(1 + index, 12), new SaleItemSpec(product, 1, 80m, 30m));
        }

        graph.AddCancelledSale(ManagerLow, customer, Day(4, 12), new SaleItemSpec(product, 1, 400m, 100m));

        // OnlyCancel: единственная отмена в отдельном дне, оплат нет вовсе.
        graph.AddCancelledSale(ManagerOnlyCancel, customer, OnlyCancellationsDay, new SaleItemSpec(product, 1, 250m, 100m));

        // Предыдущий период: одна отмена — база доли Δ.
        graph.AddCancelledSale(ManagerLow, customer, Day(-2, 13), new SaleItemSpec(product, 1, 150m, 60m));
    }
}

/// <summary>
/// Проверки отмен: суммы и ряд по cancelledAt, событийная доля с знаменателем
/// «оплаченные + отменённые», пороги малой выборки в рейтинге менеджеров,
/// доля 100% при единственном исходе.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class CancellationWorldTests : IClassFixture<CancellationWorld>
{
    private readonly CancellationWorld _world;

    public CancellationWorldTests(CancellationWorld world) => _world = world;

    [Fact]
    public async Task Cancellations_block_sums_event_amounts_with_event_rate()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            CancellationWorld.PeriodFrom, CancellationWorld.PeriodTo, null);

        var cancellations = dashboard.Cancellations;

        // Сумма по событиям: 500 + 300 + 400 + 250 = 1450; отмена прошлого
        // периода входит по дате события.
        Assert.Equal(1450m, cancellations.Value);

        // Событийная доля: 4 отмены / (7 оплат + 4 отмены).
        Assert.Equal(4m / 11m * 100m, cancellations.Rate);

        // Предыдущий период: 0 оплат и 1 отмена → доля 100%; Δ в п.п.
        var expectedRate = 4m / 11m * 100m;
        ScenarioAssertions.DeltaIs(cancellations.RateDelta!, expectedRate - 100m, DeltaUnit.Pp);

        // Ряд по бакетам сетки (8 дней → шаг 6 ч → 32 бакета): отмены
        // 12.09 11:00 → бакет 9, 14.09 12:00 → 18, 15.09 10:00 → 21, 17.09 00:00 → 28.
        var series = cancellations.Series;
        Assert.Equal(32, series.Count);
        Assert.Equal(300m, series[9].Value);
        Assert.Equal(400m, series[18].Value);
        Assert.Equal(500m, series[21].Value);
        Assert.Equal(250m, series[28].Value);

        // Топ по менеджерам: High 800, Low 400, OnlyCancel 250.
        Assert.Equal(3, cancellations.Top.Count);
        Assert.Equal(_world.ManagerHigh.Id, cancellations.Top[0].Id);
        Assert.Equal(800m, cancellations.Top[0].ValueAbsolute);
        Assert.Equal(100m, cancellations.Top[0].ValueNormalized);
        Assert.Equal(_world.ManagerLow.Id, cancellations.Top[1].Id);
        Assert.Equal(_world.ManagerOnlyCancel.Id, cancellations.Top[2].Id);

        // Хвоста нет — объектов с потерями меньше топ-10.
        Assert.Null(cancellations.Tail);

        // Оплаченные сделки периода — вне блока потерь.
        Assert.Equal(640m, dashboard.Kpi.Revenue.Value);
        Assert.Equal(7, dashboard.Kpi.SalesCount.Value);
    }

    [Fact]
    public async Task Cancellation_rate_thresholds_gate_manager_rows()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            CancellationWorld.PeriodFrom, CancellationWorld.PeriodTo, null);

        var gpRows = dashboard.ManagerRating.Datasets[0].Items;

        // High: 2 отмены / (4 оплаты + 2 отмены) — выборка 6 ≥ 5 → печатается.
        var highRow = Assert.Single(gpRows, row => row.Id == _world.ManagerHigh.Id);
        Assert.Equal(2m / 6m * 100m, highRow.CancelRate);

        // Low: 1 отмена / 4 закрытых — ниже порога 5.
        var lowRow = Assert.Single(gpRows, row => row.Id == _world.ManagerLow.Id);
        Assert.Null(lowRow.CancelRate);

        // OnlyCancel: 1 закрытая сделка — тоже ниже порога.
        var onlyRow = Assert.Single(gpRows, row => row.Id == _world.ManagerOnlyCancel.Id);
        Assert.Null(onlyRow.CancelRate);
    }

    [Fact]
    public async Task Cancellation_only_period_yields_full_rate()
    {
        // Узкое окно на дне без оплат: единственный исход — отмена.
        var dashboard = await _world.Host.PostDashboardAsync(
            CancellationWorld.OnlyCancellationsDay, CancellationWorld.PeriodTo, null);

        Assert.Equal(0m, dashboard.Kpi.Revenue.Value);
        Assert.Equal(250m, dashboard.Cancellations.Value);

        // 1 отмена / (0 оплат + 1 отмена) = 100%.
        Assert.Equal(100m, dashboard.Cancellations.Rate);

        // Предыдущий день пуст: база доли не определена → Δ null.
        ScenarioAssertions.NoDelta(dashboard.Cancellations.RateDelta);

        // Возвраты в том же окне: когорта пуста → доля null, а не 0.
        Assert.Equal(0m, dashboard.Refunds.Value);
        Assert.Null(dashboard.Refunds.Rate);
    }

    [Fact]
    public async Task Feed_contains_no_cancelled_sales()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            CancellationWorld.PeriodFrom, CancellationWorld.PeriodTo, null);

        var sales = dashboard.RecentSales.Sales;

        // Отменённые сделки без paidAt в когорту оплаты не попадают: в ленте
        // только 7 оплаченных.
        Assert.Equal(7, sales.Count);

        foreach (var sale in sales)
            Assert.Equal(SaleStatus.Paid, sale.Status);
    }
}
