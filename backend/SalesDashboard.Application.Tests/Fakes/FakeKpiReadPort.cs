using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Builders;

namespace SalesDashboard.Application.Tests.Fakes;

/// <summary>In-memory <see cref="IKpiReadPort"/> with per-filter delegates.</summary>
internal sealed class FakeKpiReadPort : IKpiReadPort
{
    public Func<ReadFilter, PeriodTotalsRow> Totals { get; set; } = _ => new PeriodTotalsRow(0m, 0m, 0, 0, 0);

    public Func<ReadFilter, IReadOnlyList<DailyAggregateRow>> Daily { get; set; } =
        _ => Array.Empty<DailyAggregateRow>();

    public Task<PeriodTotalsRow> ReadTotalsAsync(ReadFilter filter, CancellationToken cancellationToken)
        => Task.FromResult(Totals(filter));

    public Task<IReadOnlyList<DailyAggregateRow>> ReadDailyAsync(ReadFilter filter, CancellationToken cancellationToken)
        => Task.FromResult(Daily(filter));
}
