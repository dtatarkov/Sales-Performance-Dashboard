using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using SalesDashboard.Domain;
using SalesDashboard.Infrastructure.Persistence;

namespace SalesDashboard.Api.Tests.Scenarios;

/// <summary>
/// Мир «Почасовые серии»: однодневный период [D, D+1) — все непрерывные серии
/// разбиваются на 24 часовых бакета. Оплаты стоят в 05:00 и 18:00, возврат и
/// отмена — в 09:00 и 21:00, предыдущие сутки несут свои оплаты для пунктира
/// timeSeries. Сдвинутое окно в 24 часа (06:00→06:00) используется как пример
/// нецелодневного периода — он отклоняется валидатором.
/// </summary>
public sealed class HourlyWorld(PostgresFixture postgres) : IAsyncLifetime
{
    private static readonly DateTime D = new(2026, 9, 14, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>Текущее однодневное окно — полные сутки.</summary>
    public static DateTime DayFrom => D;

    public static DateTime DayTo => D.AddDays(1);

    /// <summary>Сдвинутое окно в 24 часа: с 06:00 текущего дня до 06:00 следующего.</summary>
    public static DateTime ShiftedFrom => new(D.Year, D.Month, D.Day, 6, 0, 0, DateTimeKind.Utc);

    public static DateTime ShiftedTo => ShiftedFrom.AddHours(24);

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
    /// Сеет почасовые события: две оплаты текущих суток, возврат оплаченной
    /// накануне сделки, отмена и три сделки предыдущих суток для пунктира.
    /// </summary>
    /// <param name="graph">Конструктор данных мира.</param>
    private void Seed(TestGraph graph)
    {
        var manager = graph.AddManager("Кирилл Часов", "КЧ", "Часы");
        var customer = graph.AddCustomer("ООО Час", "Час", CustomerSegment.MidMarket, 2022);
        var category = graph.AddCategory("Часовое");
        var product = graph.AddProduct("Товар часов", "HRS-1", category, 1000m, 400m);

        // Оплаты текущих суток: 05:00 и 18:00.
        graph.AddPaidSale(manager, customer, At(D, 5), new SaleItemSpec(product, 1, 1000m, 400m));
        graph.AddPaidSale(manager, customer, At(D, 18), new SaleItemSpec(product, 1, 600m, 300m));

        // Возврат накануне оплаченной сделки — событие в 09:00 текущих суток.
        graph.AddRefundedSale(manager, customer, At(D.AddDays(-1), 22), At(D, 9), new SaleItemSpec(product, 1, 400m, 100m));

        // Отмена в 21:00 текущих суток.
        graph.AddCancelledSale(manager, customer, At(D, 21), new SaleItemSpec(product, 1, 800m, 300m));

        // Предыдущие сутки: оплаты в 07:00 и 15:00 — пары пунктира.
        graph.AddPaidSale(manager, customer, At(D.AddDays(-1), 7), new SaleItemSpec(product, 1, 500m, 200m));
        graph.AddPaidSale(manager, customer, At(D.AddDays(-1), 15), new SaleItemSpec(product, 1, 250m, 100m));
    }

    /// <summary>Момент внутри дня с заданным часом.</summary>
    /// <param name="day">Полночь дня.</param>
    /// <param name="hour">Час события.</param>
    private static DateTime At(DateTime day, int hour)
        => new(day.Year, day.Month, day.Day, hour, 0, 0, DateTimeKind.Utc);
}

/// <summary>
/// Проверки почасовой гранулярности: 24 точки во всех непрерывных сериях,
/// sparse-серии маржи/среднего чека только по часам с выручкой, пары
/// текущий/предыдущий по часам; нецелодневное окно отклоняется валидатором.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class HourlyWorldTests : IClassFixture<HourlyWorld>
{
    private readonly HourlyWorld _world;

    public HourlyWorldTests(HourlyWorld world) => _world = world;

    [Fact]
    public async Task One_day_period_produces_24_hourly_points()
    {
        var dashboard = await _world.Host.PostDashboardAsync(HourlyWorld.DayFrom, HourlyWorld.DayTo, null);
        var kpi = dashboard.Kpi;

        // Итоги суток: выручка 1600, сделок 2, маржа 56.25.
        Assert.Equal(1600m, kpi.Revenue.Value);
        Assert.Equal(2, kpi.SalesCount.Value);
        Assert.Equal(900m, kpi.Gp.Value);
        Assert.Equal(56.25m, kpi.Margin.Value);

        // Серия выручки: 24 точки, значения в своих часах.
        var revenueSeries = kpi.Revenue.Series;
        Assert.Equal(24, revenueSeries.Count);
        Assert.Equal(1000m, revenueSeries[5].Value);
        Assert.Equal(600m, revenueSeries[18].Value);
        Assert.Equal(0m, revenueSeries[0].Value);
        Assert.Equal(HourlyWorld.DayFrom.AddHours(5), revenueSeries[5].DateFrom);
        Assert.Equal(HourlyWorld.DayFrom.AddHours(6), revenueSeries[5].DateTo);

        // Sparse-серии маржи и среднего чека: только часы с выручкой.
        Assert.Equal(2, kpi.Margin.Series.Count);
        Assert.Equal(60m, kpi.Margin.Series[0].Value);
        Assert.Equal(50m, kpi.Margin.Series[1].Value);
        Assert.Equal(2, kpi.AvgCheck.Series.Count);
        Assert.Equal(1000m, kpi.AvgCheck.Series[0].Value);
        Assert.Equal(600m, kpi.AvgCheck.Series[1].Value);

        // Серия лидера тоже почасовая.
        var bestManager = kpi.BestManager!;
        Assert.Equal(24, bestManager.Series.Count);
        Assert.Equal(1000m, bestManager.Series[5].Value);

        // Пунктир timeSeries: пары по часам предыдущих суток.
        var revenuePoints = dashboard.TimeSeries.Datasets[0].Items;
        Assert.Equal(24, revenuePoints.Count);
        Assert.Equal(1000m, revenuePoints[5].ValueCurrent);
        Assert.Equal(0m, revenuePoints[5].ValuePrevious);
        Assert.Equal(500m, revenuePoints[7].ValuePrevious);
        Assert.Equal(250m, revenuePoints[15].ValuePrevious);
        Assert.Equal(600m, revenuePoints[18].ValueCurrent);
        Assert.Equal(0m, revenuePoints[18].ValuePrevious);
    }

    [Fact]
    public async Task Loss_series_are_hourly_too()
    {
        var dashboard = await _world.Host.PostDashboardAsync(HourlyWorld.DayFrom, HourlyWorld.DayTo, null);

        // Возврат в 09:00, отмена в 21:00 — суммы в своих часовых бакетах.
        var refunds = dashboard.Refunds;
        Assert.Equal(400m, refunds.Value);
        Assert.Equal(24, refunds.Series.Count);
        Assert.Equal(400m, refunds.Series[9].Value);

        var cancellations = dashboard.Cancellations;
        Assert.Equal(800m, cancellations.Value);
        Assert.Equal(24, cancellations.Series.Count);
        Assert.Equal(800m, cancellations.Series[21].Value);

        // Доли: когорта 2 оплаты, 0 возвращённых → 0%; отмены — 1 из 3 исходов.
        Assert.Equal(0m, refunds.Rate);
        Assert.Equal(1m / 3m * 100m, cancellations.Rate);
    }

    [Fact]
    public async Task Non_day_aligned_window_is_rejected_with_period_not_day_aligned()
    {
        // Окно 06:00→06:00 больше не допустимо: сетка бакетов якорится на
        // полночь, нецелодневный период отклоняется валидатором (api.md,
        // PERIOD_NOT_DAY_ALIGNED) вместо тихой потери крайних часов.
        var response = await _world.Host.Client.PostAsJsonAsync("/api/v1/dashboard", new
        {
            from = HourlyWorld.ShiftedFrom.ToString("O"),
            to = HourlyWorld.ShiftedTo.ToString("O"),
            segment = (int?)null,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        var errors = document.RootElement.GetProperty("errors");

        Assert.Equal(2, errors.GetArrayLength());

        Assert.All(errors.EnumerateArray(), error => Assert.Equal("PERIOD_NOT_DAY_ALIGNED", error.GetProperty("code").GetString()));
        Assert.Equal("from", errors[0].GetProperty("field").GetString());
        Assert.Equal("to", errors[1].GetProperty("field").GetString());
    }
}
