using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Tests;

/// <summary>
/// Тесты сетки бакетов серий (SeriesBuckets, api.md «Сетка бакетов серий»):
/// шаг — делитель длительности, ближайший к «длительность / 30»; число точек
/// удерживается в полосе [24, 36]; бакеты равной ширины, стыкуются без зазоров
/// и покрывают период ровно; ключ строки собирается от начала периода.
/// </summary>
public sealed class SeriesBucketsTests
{
    /// <summary>Полночь указанного дня в UTC.</summary>
    private static DateTime Day(int year, int month, int day)
        => new(year, month, day, 0, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Sweep_of_day_aligned_periods_keeps_point_count_in_band()
    {
        // Свип целодневных периодов от 1 до 400 дней: число точек всегда в
        // полосе [24, 36] — гарантия контракта (api.md).
        for (var days = 1; days <= 400; days++)
        {
            var period = new DateRange(Day(2026, 1, 1), Day(2026, 1, 1).AddDays(days));
            var buckets = SeriesBuckets.BucketsOf(period);

            Assert.True(
                buckets.Count >= SeriesBuckets.MinPoints && buckets.Count <= SeriesBuckets.MaxPoints,
                $"Период {days} дн. дал {buckets.Count} точек — вне полосы [24, 36].");
        }
    }

    [Fact]
    public void Sweep_produces_equal_contiguous_buckets_covering_the_period()
    {
        for (var days = 1; days <= 400; days++)
        {
            var from = Day(2026, 3, 1);
            var period = new DateRange(from, from.AddDays(days));
            var stepHours = SeriesBuckets.StepHoursOf(period);
            var buckets = SeriesBuckets.BucketsOf(period);

            // Первый бакет начинается в начале периода, ширина всех бакетов
            // одинакова и равна шагу, соседние стыкуются без зазоров.
            Assert.Equal(from, buckets[0]);

            for (var i = 0; i < buckets.Count; i++)
                Assert.Equal(buckets[0].AddHours(i * stepHours), buckets[i]);

            // Последний бакет заканчивается ровно в конце периода.
            Assert.Equal(period.To, buckets[^1].AddHours(stepHours));
        }
    }

    [Theory]
    [InlineData(1, 24, 1)]   // однодневный период — 24 часовых бакета (как прежде)
    [InlineData(2, 24, 2)]   // 48 часов / 2 ч
    [InlineData(3, 36, 2)]   // 72 часа / 2 ч — ближе к 30, чем 24 точки по 3 ч
    [InlineData(7, 28, 6)]   // пресет «7 дней»: 168 / 6
    [InlineData(30, 30, 24)] // дефолтный период — дневной шаг, как прежде
    [InlineData(31, 31, 24)] // март: 744 / 24
    [InlineData(45, 30, 36)] // 1080 / 36 — точное попадание в 30 точек
    [InlineData(365, 30, 292)] // год: 8760 / 292 — точное попадание в 30 точек
    public void Known_durations_pick_the_expected_step_and_count(
        int days,
        int expectedCount,
        int expectedStepHours)
    {
        var period = new DateRange(Day(2026, 9, 1), Day(2026, 9, 1).AddDays(days));

        Assert.Equal(expectedStepHours, SeriesBuckets.StepHoursOf(period));
        Assert.Equal(expectedCount, SeriesBuckets.BucketsOf(period).Count);
    }

    [Fact]
    public void Key_of_event_lands_in_the_bucket_containing_it()
    {
        // Трёхдневный период с шагом 2 часа; события проверяются на границах
        // и внутри бакетов, включая последний час периода.
        var from = Day(2026, 9, 14);
        var period = new DateRange(from, from.AddDays(3));
        var stepHours = SeriesBuckets.StepHoursOf(period);

        Assert.Equal(2, stepHours);

        // 34 часа от начала — событие внутри бакета [34, 36): ключ — его начало.
        var insideBucket = SeriesBuckets.KeyOf(period, stepHours, from.AddHours(34).Date, from.AddHours(34).Hour);

        Assert.Equal(from.AddHours(34), insideBucket);

        // 35 часов — тот же бакет.
        var sameBucket = SeriesBuckets.KeyOf(period, stepHours, from.AddHours(35).Date, from.AddHours(35).Hour);

        Assert.Equal(from.AddHours(34), sameBucket);

        // Последний час периода (71-й) — в последнем бакете [70, 72).
        var lastBucket = SeriesBuckets.KeyOf(period, stepHours, from.AddHours(71).Date, from.AddHours(71).Hour);

        Assert.Equal(from.AddHours(70), lastBucket);
    }
}
