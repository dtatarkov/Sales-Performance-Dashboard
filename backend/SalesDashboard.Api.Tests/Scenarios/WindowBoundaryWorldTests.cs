using SalesDashboard.Api.Dtos;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Границы окна»: сделки, чьи события (paidAt, refundedAt, cancelledAt)
/// стоят ровно на границах полуинтервалов текущего и предыдущего периодов.
/// Активный период — 4 дня [D4, D8), предыдущий — [D0, D4); каждая граница
/// занята сделкой, плюс по одной сделке вне обоих окон. Проверяет семантику
/// «from включается, to — нет» для всех трёх событийных дат.
/// </summary>
public sealed class WindowBoundaryWorld(PostgresFixture postgres) : IAsyncLifetime
{
    /// <summary>Начало предыдущего окна [D0, D4) — занято сделками.</summary>
    public static readonly DateTime PreviousFrom = new(2026, 9, 6, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Начало активного периода [D4, D8) — занято сделками.</summary>
    public static readonly DateTime CurrentFrom = new(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Конец активного периода (не включается) — занят сделками.</summary>
    public static readonly DateTime CurrentTo = new(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc);

    private static readonly DateTime OutsideBefore = new(2026, 9, 5, 10, 0, 0, DateTimeKind.Utc);

    private static readonly DateTime PreviousPaid = new(2026, 9, 4, 10, 0, 0, DateTimeKind.Utc);

    /// <summary>Поднятый мир с API-хостом.</summary>
    public DashboardScenarioHost Host { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        Host = await DashboardScenarioHost.StartAsync(postgres, Seed);
    }

    public async Task DisposeAsync()
    {
        await Host.DisposeAsync();
    }

    /// <summary>
    /// Сеет сделки на всех границах: каждая позиция 100/60, поэтому суммы окон
    /// считаются по числу сделок × 100.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Галина Край", "ГК", "Грань");

        var customer = graph.AddCustomer("ООО Окно", "Окно", CustomerSegment.MidMarket, 2021);

        var category = graph.AddCategory("Границы");

        var product = graph.AddProduct("Товар на границе", "EDGE-1", category, 100m, 60m);

        // Оплаченная когорта: from входит, to — нет; предыдущее окно [D0, D4).
        graph.AddPaidSale(manager, customer, At(CurrentFrom), Spec(product));
        graph.AddPaidSale(manager, customer, At(CurrentTo), Spec(product));
        graph.AddPaidSale(manager, customer, At(PreviousFrom), Spec(product));
        graph.AddPaidSale(manager, customer, OutsideBefore, Spec(product));

        // Возвраты: события на тех же границах; оплаты — до всех окон,
        // чтобы в когорты попадали только сделки из блока оплат выше.
        graph.AddRefundedSale(manager, customer, PreviousPaid, At(CurrentFrom), Spec(product));
        graph.AddRefundedSale(manager, customer, PreviousPaid, At(CurrentTo), Spec(product));
        graph.AddRefundedSale(manager, customer, PreviousPaid, At(PreviousFrom), Spec(product));

        // Отмены: те же границы; оплаты нет по матрице статусов.
        graph.AddCancelledSale(manager, customer, At(CurrentFrom), Spec(product));
        graph.AddCancelledSale(manager, customer, At(CurrentTo), Spec(product));
        graph.AddCancelledSale(manager, customer, At(PreviousFrom), Spec(product));
    }

    /// <summary>Позиция сделки по умолчанию: 1 шт × 100, себестоимость 60.</summary>
    /// <param name="product">Товар позиции.</param>
    private static SaleItemSpec Spec(ProductEntity product)
        => new(product, 1, 100m, 60m);

    /// <summary>Переносит дату на 10:00 UTC того же дня.</summary>
    /// <param name="day">Граница периода (полночь UTC).</param>
    private static DateTime At(DateTime day)
        => new(day.Year, day.Month, day.Day, 10, 0, 0, DateTimeKind.Utc);
}

/// <summary>
/// Проверки полуинтервалов: события на from принадлежат периоду, на to —
/// следующему; предыдущее окно примыкает к активному без зазора.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class WindowBoundaryWorldTests : IClassFixture<WindowBoundaryWorld>
{
    private readonly WindowBoundaryWorld _world;

    public WindowBoundaryWorldTests(WindowBoundaryWorld world) => _world = world;

    [Fact]
    public async Task Paid_cohort_includes_from_excludes_to_and_pairs_with_previous()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            WindowBoundaryWorld.CurrentFrom, WindowBoundaryWorld.CurrentTo, null);

        // В когорте текущего периода только сделка на from: 100.
        Assert.Equal(100m, dashboard.Kpi.Revenue.Value);
        Assert.Equal(1, dashboard.Kpi.SalesCount.Value);

        // Предыдущее окно тоже содержит одну сделку — на своём from: Δ ровно 0%.
        ScenarioAssertions.DeltaIs(dashboard.Kpi.Revenue.Delta!, 0m, DeltaUnit.Percent);

        // Серии: 4-дневный период → шаг 3 ч → 32 бакета; события стоят в 10:00,
        // то есть в бакете с индексом 3 ([09:00, 12:00)), пары предыдущего — тоже.
        var revenuePoints = dashboard.TimeSeries.Datasets[0].Items;
        Assert.Equal(32, revenuePoints.Count);
        Assert.Equal(100m, revenuePoints[3].ValueCurrent);
        Assert.Equal(0m, revenuePoints[4].ValueCurrent);
        Assert.Equal(100m, revenuePoints[3].ValuePrevious);
        Assert.Equal(0m, revenuePoints[4].ValuePrevious);

        // Сделка на to и сделка до предыдущего окна не видны нигде.
        Assert.Equal(100m, revenuePoints.Sum(point => point.ValueCurrent));
    }

    [Fact]
    public async Task Refund_events_follow_the_same_half_open_windows()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            WindowBoundaryWorld.CurrentFrom, WindowBoundaryWorld.CurrentTo, null);

        // Возврат на from текущего периода входит: сумма 100.
        Assert.Equal(100m, dashboard.Refunds.Value);

        var refundPoints = dashboard.Refunds.Series;
        Assert.Equal(32, refundPoints.Count);
        Assert.Equal(100m, refundPoints[3].Value);
        Assert.Equal(0m, refundPoints[4].Value);

        // Возвраты на to и в предыдущем окне в текущую сумму не попали.
        // Доля возвратов — когортная: возвращённых в когорте нет → 0%.
        Assert.Equal(0m, dashboard.Refunds.Rate);
    }

    [Fact]
    public async Task Cancellation_events_follow_the_same_windows_and_event_denominator()
    {
        var dashboard = await _world.Host.PostDashboardAsync(
            WindowBoundaryWorld.CurrentFrom, WindowBoundaryWorld.CurrentTo, null);

        // Отмена на from входит: сумма 100; на to и в прошлом окне — нет.
        Assert.Equal(100m, dashboard.Cancellations.Value);

        var cancelPoints = dashboard.Cancellations.Series;
        Assert.Equal(100m, cancelPoints[3].Value);
        Assert.Equal(0m, cancelPoints[4].Value);

        // Событийная доля: 1 отмена / (1 оплаченная + 1 отменённая) = 50%.
        Assert.Equal(50m, dashboard.Cancellations.Rate);

        // Предыдущее окно: 1 оплаченная (на D0) + 1 отмена (на D0) → тоже 50%.
        ScenarioAssertions.DeltaIs(dashboard.Cancellations.RateDelta!, 0m, DeltaUnit.Pp);
    }
}
