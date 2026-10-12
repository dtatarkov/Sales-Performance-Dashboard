using SalesDashboard.Domain;

namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Сборка строк событийных рядов по сетке бакетов <see cref="SeriesBuckets"/>:
/// (день, час)-группы SQL сворачиваются в бакеты от начала периода. Общая
/// точка для всех рид-портов — правило сборки ряда живёт рядом с правилом
/// самой сетки, а не копируется по портам (api.md, SeriesPointDto).
/// </summary>
public static class SeriesBucketRows
{
    /// <summary>Строка (день, час) → выручка и себестоимость невозвращённых позиций.</summary>
    public sealed record MoneyRow(DateTime Date, int Hour, decimal Revenue, decimal Cost);

    /// <summary>Строка (день, час) → число сделок.</summary>
    public sealed record CountRow(DateTime Date, int Hour, int Count);

    /// <summary>Строка (день, час) → сумма потерь (возвраты/отмены).</summary>
    public sealed record AmountRow(DateTime Date, int Hour, decimal Amount);

    /// <summary>
    /// Строки KPI-ряда: деньги по бакетам + счётчик сделок (ноль, если в бакете
    /// есть деньги, но не было сделок). Бакет-ключ строки собирается
    /// <see cref="SeriesBuckets.KeyOf"/> от начала периода; (день, час)-группы
    /// одного бакета суммируются.
    /// </summary>
    /// <param name="period">Период запроса — якорь сетки.</param>
    /// <param name="stepHours">Шаг сетки в часах (<see cref="SeriesBuckets.StepHoursOf"/>).</param>
    /// <param name="money">Деньги по парам (день, час).</param>
    /// <param name="counts">Счётчики сделок по парам (день, час).</param>
    /// <returns>Строки ряда по бакетам по возрастанию.</returns>
    public static IReadOnlyList<DailyAggregateRow> MoneyAndCountRows(
        DateRange period,
        int stepHours,
        IReadOnlyList<MoneyRow> money,
        IReadOnlyList<CountRow> counts)
    {
        // Счётчик сделок по бакетам серии: ключ от начала периода, группы
        // (день, час) внутри бакета суммируются.
        var countByBucket = counts
            .GroupBy(c => SeriesBuckets.KeyOf(period, stepHours, c.Date, c.Hour))
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Count));

        // Деньги группируются тем же ключом; счётчик подставляется, если в
        // бакете были сделки, иначе ноль.
        var rows = money
            .GroupBy(m => SeriesBuckets.KeyOf(period, stepHours, m.Date, m.Hour))
            .Select(g => new DailyAggregateRow(
                g.Key,
                g.Sum(x => x.Revenue),
                g.Sum(x => x.Cost),
                countByBucket.TryGetValue(g.Key, out var count) ? count : 0))
            .OrderBy(r => r.Date)
            .ToList();

        return rows;
    }

    /// <summary>
    /// Строки ряда потерь: суммы по бакетам. Ключ и упорядочивание — как в
    /// <see cref="MoneyAndCountRows"/>.
    /// </summary>
    /// <param name="period">Период запроса — якорь сетки.</param>
    /// <param name="stepHours">Шаг сетки в часах (<see cref="SeriesBuckets.StepHoursOf"/>).</param>
    /// <param name="amounts">Суммы потерь по парам (день, час).</param>
    /// <returns>Строки ряда по бакетам по возрастанию.</returns>
    public static IReadOnlyList<LossDailyRow> AmountRows(
        DateRange period,
        int stepHours,
        IReadOnlyList<AmountRow> amounts)
    {
        var rows = amounts
            .GroupBy(a => SeriesBuckets.KeyOf(period, stepHours, a.Date, a.Hour))
            .Select(g => new LossDailyRow(g.Key, g.Sum(x => x.Amount)))
            .OrderBy(r => r.Date)
            .ToList();

        return rows;
    }
}
