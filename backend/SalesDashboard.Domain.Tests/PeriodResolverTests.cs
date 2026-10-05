using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Предыдущий сопоставимый период (domain.md, «Предыдущий сопоставимый период»).
/// Правило одно для всех диапазонов: предыдущий период — той же длительности,
/// непосредственно перед активным. Ниже зафиксированы пресеты, переходы года и
/// месяца, примыкание без зазора и сохранение инвариантов DateRange.
/// </summary>
public class PeriodResolverTests
{
    private static DateTime Utc(int year, int month, int day, int hour = 0, int minute = 0, int second = 0)
        => new(year, month, day, hour, minute, second, DateTimeKind.Utc);

    private readonly PeriodResolver _resolver = new();

    /// <summary>Пресеты задаются полуоткрытыми диапазонами; второй кортеж — последний включённый день.</summary>
    private static DateRange Range(
        (int Y, int M, int D) from,
        (int Y, int M, int D) lastInclusiveDay)
        => new(
            Utc(from.Y, from.M, from.D),
            Utc(lastInclusiveDay.Y, lastInclusiveDay.M, lastInclusiveDay.D).AddDays(1));

    // «7 дней → предыдущие 7 дней»
    [Fact]
    public void Previous_SevenDayRange_ReturnsPrecedingSevenDays()
    {
        var current = Range((2024, 9, 10), (2024, 9, 16));

        var previous = _resolver.Previous(current);

        Assert.Equal(Utc(2024, 9, 3), previous.From);
        Assert.Equal(Utc(2024, 9, 10), previous.To);
        Assert.Equal(Days(current), Days(previous));
    }

    // Пресет «Этот месяц (1–24 сент)»: предыдущий — те же 24 дня перед сентябрём,
    // а не весь предыдущий месяц; длительности совпадают день в день.
    [Fact]
    public void Previous_PartOfMonth_ReturnsEqualDurationBeforeFrom()
    {
        var current = Range((2024, 9, 1), (2024, 9, 24));

        var previous = _resolver.Previous(current);

        Assert.Equal(Utc(2024, 8, 8), previous.From);
        Assert.Equal(Utc(2024, 9, 1), previous.To);
        Assert.Equal(Days(current), Days(previous));
    }

    // Пресет «Прошлый месяц» (полный сентябрь): предыдущий — те же 30 дней
    // перед сентябрём, не календарный август (31 день).
    [Fact]
    public void Previous_FullMonth_ReturnsEqualDurationBeforeFrom()
    {
        var current = Range((2024, 9, 1), (2024, 9, 30));

        var previous = _resolver.Previous(current);

        Assert.Equal(Utc(2024, 8, 2), previous.From);
        Assert.Equal(Utc(2024, 9, 1), previous.To);
        Assert.Equal(Days(current), Days(previous));
    }

    // «произвольный диапазон → равное число дней до from»
    [Fact]
    public void Previous_ArbitraryRange_ReturnsEqualNumberOfDays()
    {
        var current = Range((2024, 9, 10), (2024, 9, 20)); // 11 дней

        var previous = _resolver.Previous(current);

        Assert.Equal(Utc(2024, 8, 30), previous.From);
        Assert.Equal(Utc(2024, 9, 10), previous.To);
        Assert.Equal(Days(current), Days(previous));
    }

    /// <summary>
    /// Диапазон, выходящий за конец месяца, следует тому же правилу равной
    /// длительности — исключений для «месячных» диапазонов нет.
    /// </summary>
    [Fact]
    public void Previous_RangeSpanningTwoMonths_UsesEqualDuration()
    {
        var current = Range((2024, 9, 1), (2024, 10, 10)); // 40 дней

        var previous = _resolver.Previous(current);

        Assert.Equal(Utc(2024, 7, 23), previous.From);
        Assert.Equal(Days(current), Days(previous));
    }

    /// <summary>Январь уходит в декабрь предыдущего года.</summary>
    [Fact]
    public void Previous_January_RollsBackIntoPreviousYear()
    {
        var current = Range((2025, 1, 1), (2025, 1, 31));

        var previous = _resolver.Previous(current);

        Assert.Equal(Utc(2024, 12, 1), previous.From);
        Assert.Equal(Utc(2025, 1, 1), previous.To);
        Assert.Equal(Days(current), Days(previous));
    }

    /// <summary>
    /// Равная длительность не зависит от длины календарного месяца: 31 день
    /// марта сравнивается с 31-дневным окном, а не с 28/29 днями февраля.
    /// </summary>
    [Fact]
    public void Previous_March_ReturnsThirtyOneDayWindow()
    {
        var current = Range((2024, 3, 1), (2024, 3, 31));

        var previous = _resolver.Previous(current);

        Assert.Equal(Utc(2024, 1, 30), previous.From);
        Assert.Equal(Utc(2024, 3, 1), previous.To);
        Assert.Equal(Days(current), Days(previous));
    }

    /// <summary>
    /// Предыдущий период должен примыкать к текущему: без зазора и без
    /// наложения, иначе продажа на границе посчитается дважды или потеряется.
    /// Полуоткрытые границы делают диапазоны стыкующимися точно
    /// (<c>previous.To == current.From</c>).
    /// </summary>
    [Theory]
    [InlineData(2024, 9, 10, 2024, 9, 16)]
    [InlineData(2024, 9, 1, 2024, 9, 24)]
    [InlineData(2024, 9, 1, 2024, 9, 30)]
    [InlineData(2024, 2, 15, 2024, 2, 20)]
    public void Previous_AbutsWithoutGapOrOverlap(
        int fromYear, int fromMonth, int fromDay, int toYear, int toMonth, int toDay)
    {
        var current = Range((fromYear, fromMonth, fromDay), (toYear, toMonth, toDay));

        var previous = _resolver.Previous(current);

        Assert.Equal(TimeSpan.Zero, current.From - previous.To);
        Assert.False(previous.Overlaps(current));
    }

    /// <summary>Результат сохраняет инварианты <see cref="DateRange"/>: полуоткрытость и UTC.</summary>
    [Fact]
    public void Previous_ReturnsUtcHalfOpenRange()
    {
        var current = Range((2024, 9, 10), (2024, 9, 16));

        var previous = _resolver.Previous(current);

        Assert.Equal(DateTimeKind.Utc, previous.From.Kind);
        Assert.Equal(DateTimeKind.Utc, previous.To.Kind);
        Assert.True(previous.From < previous.To);
    }

    private static int Days(DateRange range)
        => (range.To - range.From).Days;
}
