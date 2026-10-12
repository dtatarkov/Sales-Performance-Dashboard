using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Дневные серии»: 7-дневный период [26.02, 05.03) через границу
/// невисокосного февраля с «дырами» — днями без продаж; продажи дают разные
/// маржи по дням, чтобы sparse-серии было не с чем спутать. Месячный запрос
/// [01.03, 01.04) проверяет 31 бакет и пары пунктира через месяцы разной
/// длины (28 дней февраля).
/// </summary>
public sealed class DailySeriesWorld(PostgresFixture postgres) : IAsyncLifetime
{
    /// <summary>Начало 7-дневного периода (26 февраля).</summary>
    public static DateTime WeekFrom { get; } = new(2026, 2, 26, 0, 0, 0, DateTimeKind.Utc);

    public static DateTime WeekTo { get; } = new(2026, 3, 5, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Месячный период марта (31 день).</summary>
    public static DateTime MonthFrom { get; } = new(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc);

    public static DateTime MonthTo { get; } = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);

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
    /// Сеет сделки в конкретные дни недели (26, 28 февраля, 1 и 4 марта) и в
    /// предыдущем окне (19 и 25 февраля) — пустые дни остаются дырами.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Леонид Дни", "ЛД", "Серии");
        var customer = graph.AddCustomer("ООО Календарь", "Календарь", CustomerSegment.Smb, 2024);
        var category = graph.AddCategory("Дневное");
        var product = graph.AddProduct("Товар дней", "DYS-1", category, 100m, 40m);

        // Неделя: продажи через дыры 27.02, 02.03 и 03.03.
        graph.AddPaidSale(manager, customer, At(2026, 2, 26), new SaleItemSpec(product, 1, 100m, 40m));
        graph.AddPaidSale(manager, customer, At(2026, 2, 28), new SaleItemSpec(product, 1, 200m, 80m));
        graph.AddPaidSale(manager, customer, At(2026, 3, 1), new SaleItemSpec(product, 1, 400m, 160m));
        graph.AddPaidSale(manager, customer, At(2026, 3, 4), new SaleItemSpec(product, 1, 50m, 40m));

        // Предыдущее окно недели: пары пунктира на краях.
        graph.AddPaidSale(manager, customer, At(2026, 2, 19), new SaleItemSpec(product, 1, 300m, 120m));
        graph.AddPaidSale(manager, customer, At(2026, 2, 25), new SaleItemSpec(product, 1, 150m, 60m));
    }

    /// <summary>Полночь указанного дня.</summary>
    /// <param name="year">Год.</param>
    /// <param name="month">Месяц.</param>
    /// <param name="day">День.</param>
    private static DateTime At(int year, int month, int day)
        => new(year, month, day, 0, 0, 0, DateTimeKind.Utc);
}

/// <summary>
/// Проверки дневных серий: непрерывность с нулями в дырах, пропуск пустых дней
/// sparse-сериями, пары пунктира по индексам — в том числе через границу
/// месяцев разной длины.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class DailySeriesWorldTests : IClassFixture<DailySeriesWorld>
{
    private readonly DailySeriesWorld _world;

    public DailySeriesWorldTests(DailySeriesWorld world) => _world = world;

    [Fact]
    public async Task Seven_day_series_carry_zeros_through_holes()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DailySeriesWorld.WeekFrom, DailySeriesWorld.WeekTo, null);
        var kpi = dashboard.Kpi;

        Assert.Equal(750m, kpi.Revenue.Value);
        Assert.Equal(4, kpi.SalesCount.Value);
        Assert.Equal(430m / 750m * 100m, kpi.Margin.Value);
        Assert.Equal(187.5m, kpi.AvgCheck.Value);

        // Серия выручки: недельный период → шаг 6 ч → 28 бакетов; нули в дырах
        // (27.02 → бакеты 4–7, 02.03 → 16–19, 03.03 → 20–23), значения в своих
        // бакетах: 26.02 → 0, 28.02 → 8, 01.03 → 12, 04.03 → 24.
        var revenueSeries = kpi.Revenue.Series;
        Assert.Equal(28, revenueSeries.Count);
        Assert.Equal(100m, revenueSeries[0].Value);
        Assert.Equal(0m, revenueSeries[4].Value);
        Assert.Equal(200m, revenueSeries[8].Value);
        Assert.Equal(400m, revenueSeries[12].Value);
        Assert.Equal(0m, revenueSeries[20].Value);
        Assert.Equal(0m, revenueSeries[22].Value);
        Assert.Equal(50m, revenueSeries[24].Value);

        // Sparse-серии пропускают бакеты без продаж: 4 точки вместо 28.
        Assert.Equal(4, kpi.Margin.Series.Count);
        Assert.Equal(60m, kpi.Margin.Series[0].Value);
        Assert.Equal(60m, kpi.Margin.Series[1].Value);
        Assert.Equal(60m, kpi.Margin.Series[2].Value);
        Assert.Equal(20m, kpi.Margin.Series[3].Value);
        Assert.Equal(4, kpi.AvgCheck.Series.Count);
        Assert.Equal(50m, kpi.AvgCheck.Series[3].Value);

        // Серия числа продаж: 1 в бакетах с продажами, 0 в дырах.
        Assert.Equal(1m, kpi.SalesCount.Series[0].Value);
        Assert.Equal(0m, kpi.SalesCount.Series[4].Value);
        Assert.Equal(1m, kpi.SalesCount.Series[8].Value);
        Assert.Equal(1m, kpi.SalesCount.Series[12].Value);
        Assert.Equal(1m, kpi.SalesCount.Series[24].Value);
    }

    [Fact]
    public async Task Time_series_pairs_days_with_previous_window()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DailySeriesWorld.WeekFrom, DailySeriesWorld.WeekTo, null);

        var revenuePoints = dashboard.TimeSeries.Datasets[0].Items;

        // Недельный период → 28 бакетов по 6 ч.
        Assert.Equal(28, revenuePoints.Count);

        // Пары по индексу: 26.02 ↔ 19.02 и 04.03 ↔ 25.02 — края окна.
        Assert.Equal(100m, revenuePoints[0].ValueCurrent);
        Assert.Equal(300m, revenuePoints[0].ValuePrevious);
        Assert.Equal(50m, revenuePoints[24].ValueCurrent);
        Assert.Equal(150m, revenuePoints[24].ValuePrevious);

        // Продажа 01.03 — бакет 12; дыра 03.03 — бакет 20, нулевая пара.
        Assert.Equal(400m, revenuePoints[12].ValueCurrent);
        Assert.Equal(0m, revenuePoints[20].ValueCurrent);
        Assert.Equal(0m, revenuePoints[20].ValuePrevious);
    }

    [Fact]
    public async Task Month_period_yields_31_points_and_pairs_feb_to_march()
    {
        var dashboard = await _world.Host.PostDashboardAsync(DailySeriesWorld.MonthFrom, DailySeriesWorld.MonthTo, null);

        var revenuePoints = dashboard.TimeSeries.Datasets[0].Items;

        // Март невисокосного года — 31 бакет, продажи только в начале месяца.
        Assert.Equal(31, revenuePoints.Count);
        Assert.Equal(400m, revenuePoints[0].ValueCurrent);
        Assert.Equal(50m, revenuePoints[3].ValueCurrent);
        Assert.Equal(0m, revenuePoints[30].ValueCurrent);

        // Предыдущее окно = 31 день назад от 01.03, то есть [29.01, 01.03):
        // пары по индексу уходят через месяцы разной длины —
        // 19.02 (индекс 21), 26.02 (индекс 28), 28.02 (индекс 30).
        Assert.Equal(300m, revenuePoints[21].ValuePrevious);
        Assert.Equal(100m, revenuePoints[28].ValuePrevious);
        Assert.Equal(200m, revenuePoints[30].ValuePrevious);
        Assert.Equal(0m, revenuePoints[25].ValuePrevious);

        // Итоги месяца: только мартовские сделки.
        Assert.Equal(450m, dashboard.Kpi.Revenue.Value);
        Assert.Equal(2, dashboard.Kpi.SalesCount.Value);
    }
}
