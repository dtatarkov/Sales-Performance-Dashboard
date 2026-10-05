using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// <c>DateRange</c> — активный период анализа (domain.md, «Активный период»):
/// полуинтервал <c>[From, To)</c> в UTC, инвариант <c>From &lt; To</c> держит
/// guard clause в конструкторе (backend.md §3.3 — простой ArgumentException,
/// не доменное исключение).
/// </summary>
public class DateRangeTests
{
    private static DateTime Utc(int year, int month, int day, int hour = 0)
        => new(year, month, day, hour, 0, 0, DateTimeKind.Utc);

    /// <summary>Корректные UTC-границы принимаются и сохраняются как есть.</summary>
    [Fact]
    public void Ctor_AcceptsOrderedUtcBounds()
    {
        var range = new DateRange(Utc(2024, 9, 1), Utc(2024, 10, 1));

        Assert.Equal(Utc(2024, 9, 1), range.From);
        Assert.Equal(Utc(2024, 10, 1), range.To);
    }

    /// <summary>Полуинтервалу нужна строго положительная длина; пустой период не несёт смысла.</summary>
    [Fact]
    public void Ctor_RejectsEmptyRange()
    {
        var moment = Utc(2024, 9, 10);

        Assert.Throws<ArgumentException>(() => new DateRange(moment, moment));
    }

    /// <summary>Перепутанные границы отбрасываются с сообщением, в котором названа причина.</summary>
    [Fact]
    public void Ctor_RejectsFromAfterTo()
    {
        var error = Assert.Throws<ArgumentException>(
            () => new DateRange(Utc(2024, 9, 30), Utc(2024, 9, 1)));

        Assert.Contains("must be earlier", error.Message);
    }

    /// <summary>Все даты дашборда — UTC; вид Local/Unspecified сдвинул бы окно когорты.</summary>
    [Theory]
    [InlineData(DateTimeKind.Local)]
    [InlineData(DateTimeKind.Unspecified)]
    public void Ctor_RejectsNonUtcFrom(DateTimeKind kind)
    {
        var loose = DateTime.SpecifyKind(Utc(2024, 9, 1), kind);

        Assert.Throws<ArgumentException>(() => new DateRange(loose, Utc(2024, 10, 1)));
    }

    /// <summary>Требование UTC действует на обе границы, не только на From.</summary>
    [Theory]
    [InlineData(DateTimeKind.Local)]
    [InlineData(DateTimeKind.Unspecified)]
    public void Ctor_RejectsNonUtcTo(DateTimeKind kind)
    {
        var loose = DateTime.SpecifyKind(Utc(2024, 10, 1), kind);

        Assert.Throws<ArgumentException>(() => new DateRange(Utc(2024, 9, 1), loose));
    }

    /// <summary>
    /// Полуинтервал: событие на From принадлежит периоду, на To — нет.
    /// Граница — самый рискованный случай стыка двух смежных периодов.
    /// </summary>
    [Theory]
    [InlineData(9, 1, 0, true)]    // на нижней границе
    [InlineData(9, 15, 12, true)]  // внутри
    [InlineData(9, 29, 23, true)]  // последний час перед верхней границей
    [InlineData(9, 30, 0, false)]  // на верхней границе — исключён
    [InlineData(8, 31, 23, false)]
    [InlineData(10, 1, 0, false)]
    public void Contains_IncludesLowerBoundExcludesUpperBound(int month, int day, int hour, bool expected)
    {
        var range = new DateRange(Utc(2024, 9, 1), Utc(2024, 9, 30));

        Assert.Equal(expected, range.Contains(Utc(2024, month, day, hour)));
    }

    /// <summary>Смежные полуинтервалы, касающиеся в одной точке, не пересекаются — событие на стыке попадает ровно в один период.</summary>
    [Fact]
    public void Overlaps_TouchingRangesDoNotOverlap()
    {
        var september = new DateRange(Utc(2024, 9, 1), Utc(2024, 9, 30));
        var october = new DateRange(Utc(2024, 9, 30), Utc(2024, 11, 1));

        Assert.False(september.Overlaps(october));
        Assert.False(october.Overlaps(september));
    }

    /// <summary>Частичное перекрытие распознаётся в обе стороны — предикат коммутативен.</summary>
    [Fact]
    public void Overlaps_PartiallyOverlappingRangesOverlap()
    {
        var first = new DateRange(Utc(2024, 9, 1), Utc(2024, 9, 20));
        var second = new DateRange(Utc(2024, 9, 15), Utc(2024, 10, 1));

        Assert.True(first.Overlaps(second));
        Assert.True(second.Overlaps(first));
    }

    /// <summary>Разделённые зазором периоды не пересекаются.</summary>
    [Fact]
    public void Overlaps_SeparatedRangesDoNotOverlap()
    {
        var september = new DateRange(Utc(2024, 9, 1), Utc(2024, 9, 29));
        var october = new DateRange(Utc(2024, 10, 1), Utc(2024, 11, 1));

        Assert.False(september.Overlaps(october));
    }

    /// <summary>Длительность — разница границ; для полуинтервала [1, 8) это ровно 7 дней.</summary>
    [Fact]
    public void Duration_IsSpanBetweenBounds()
    {
        var range = new DateRange(Utc(2024, 9, 1), Utc(2024, 9, 8));

        Assert.Equal(TimeSpan.FromDays(7), range.Duration);
    }

    /// <summary>Value-объект: равные границы дают равные значения и одинаковый хеш независимо от экземпляра.</summary>
    [Fact]
    public void ValueEquality_IgnoresInstanceIdentity()
    {
        var first = new DateRange(Utc(2024, 9, 1), Utc(2024, 10, 1));
        var second = new DateRange(Utc(2024, 9, 1), Utc(2024, 10, 1));

        Assert.Equal(first, second);
        Assert.Equal(first.GetHashCode(), second.GetHashCode());
    }
}
