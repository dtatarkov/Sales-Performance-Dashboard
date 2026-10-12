using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;
using SalesDashboard.Application.Tests.Fakes;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Tests;

/// <summary>
/// Тесты блока 6 «Динамика во времени»: бакеты серий — сетка SeriesBuckets
/// (api.md «Сетка бакетов серий», блок 6).
/// </summary>
public sealed class TimeSeriesBuilderTests
{
    private static TimeSeriesBuilder Create(FakeKpiReadPort kpi)
        => new(kpi, new PeriodResolver());

    [Fact]
    public async Task One_day_period_yields_24_hourly_points_per_dataset()
    {
        // Однодневный период 2 октября; продажи в 05:00 и 18:00 UTC.
        var oneDay = new DateRange(
            new DateTime(2026, 10, 2, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 10, 3, 0, 0, 0, DateTimeKind.Utc));

        var kpi = new FakeKpiReadPort
        {
            Daily = filter => filter.Period.Duration == TimeSpan.FromDays(1)
                ? [
                    new DailyAggregateRow(new DateTime(2026, 10, 2, 5, 0, 0, DateTimeKind.Utc), 100m, 40m, 1),
                    new DailyAggregateRow(new DateTime(2026, 10, 2, 18, 0, 0, DateTimeKind.Utc), 50m, 20m, 2),
                ]
                : Array.Empty<DailyAggregateRow>(),
        };

        var model = await Create(kpi)
            .BuildAsync(new DashboardQuery(oneDay, null), CancellationToken.None);

        // Все три датасета непрерывны по часам.
        Assert.All(model.Datasets, dataset => Assert.Equal(24, dataset.Items.Count));

        var revenue = model.Datasets[0].Items.ToDictionary(p => p.DateFrom.Hour, p => p.ValueCurrent);

        Assert.Equal(100m, revenue[5]);
        Assert.Equal(50m, revenue[18]);
        Assert.Equal(0m, revenue[6]);

        // Серия начинается строго с начала периода.
        Assert.Equal(oneDay.From, model.Datasets[0].Items[0].DateFrom);

        // Каждая точка несёт свой часовой полуинтервал.
        Assert.All(model.Datasets[0].Items, point =>
        {
            Assert.Equal(point.DateFrom.AddHours(1), point.DateTo);
        });

        // Пунктир предыдущего периода (1 октября) — нули в парных часах.
        Assert.All(model.Datasets[0].Items, point => Assert.Equal(0m, point.ValuePrevious));
    }

    [Fact]
    public async Task Multi_day_period_keeps_daily_points()
    {
        // Месячный период: серии остаются дневными (30 точек сентября).
        var september = new DateRange(
            new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));

        var kpi = new FakeKpiReadPort();

        var model = await Create(kpi)
            .BuildAsync(new DashboardQuery(september, null), CancellationToken.None);

        Assert.All(model.Datasets, dataset => Assert.Equal(30, dataset.Items.Count));

        // Бакеты дневные: начало первого — полночь периода, ширина — сутки.
        var points = model.Datasets[0].Items;

        Assert.Equal(september.From, points[0].DateFrom);
        Assert.Equal(september.From.AddDays(1), points[0].DateTo);
        Assert.Equal(september.To, points[^1].DateTo);
    }
}
