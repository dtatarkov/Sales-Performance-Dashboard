namespace SalesDashboard.Domain;

/// <summary>
/// Полуинтервал анализа <c>[From, To)</c> в UTC: <c>From</c> включается,
/// <c>To</c> — нет. From должен быть строго раньше To.
/// </summary>
/// 
/// <remarks>
/// Полуинтервал выбран намеренно: два смежных периода стыкуются ровно
/// (<c>previous.To == current.From</c>) без зазора и без пересечения, поэтому
/// событие на границе попадает ровно в один из них. С включительными границами
/// между периодами оставался бы открытый интервал, в который событие не входит
/// ни в один период.
/// </remarks>
public readonly record struct DateRange
{
    public DateRange(DateTime from, DateTime to)
    {
        if (from.Kind != DateTimeKind.Utc)
            throw new ArgumentException("From must be UTC.", nameof(from));
        if (to.Kind != DateTimeKind.Utc)
            throw new ArgumentException("To must be UTC.", nameof(to));
        if (from >= to)
            throw new ArgumentException($"From ({from:O}) must be earlier than To ({to:O}).", nameof(from));

        From = from;
        To = to;
    }

    public DateTime From { get; }
    public DateTime To { get; }

    public TimeSpan Duration => To - From;

    /// <summary>Границы полуинтервала: момент на <c>From</c> входит, на <c>To</c> — нет.</summary>
    public bool Contains(DateTime moment) => moment >= From && moment < To;

    /// <summary>Два полуинтервала пересекаются, если начало каждого строго раньше конца другого; касание на границе пересечением не считается.</summary>
    public bool Overlaps(DateRange other) => From < other.To && other.From < To;

    public override string ToString() => $"{From:yyyy-MM-dd} → {To:yyyy-MM-dd}";
}
