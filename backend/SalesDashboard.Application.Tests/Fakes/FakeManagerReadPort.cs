using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Builders;

namespace SalesDashboard.Application.Tests.Fakes;

/// <summary>In-memory <see cref="IManagerReadPort"/>.</summary>
internal sealed class FakeManagerReadPort : IManagerReadPort
{
    public IReadOnlyList<ManagerRosterRow> Roster { get; set; } = Array.Empty<ManagerRosterRow>();

    public Func<ReadFilter, IReadOnlyList<ManagerAggregateRow>> Aggregates { get; set; } =
        _ => Array.Empty<ManagerAggregateRow>();

    public Func<Guid, ReadFilter, IReadOnlyList<DailyAggregateRow>> ManagerDaily { get; set; } =
        (_, _) => Array.Empty<DailyAggregateRow>();

    public Task<IReadOnlyList<ManagerRosterRow>> ReadRosterAsync(CancellationToken cancellationToken)
        => Task.FromResult(Roster);

    public Task<IReadOnlyList<ManagerAggregateRow>> ReadAggregatesAsync(ReadFilter filter, CancellationToken cancellationToken)
        => Task.FromResult(Aggregates(filter));

    public Task<IReadOnlyList<DailyAggregateRow>> ReadDailyByManagerAsync(
        Guid managerId, ReadFilter filter, CancellationToken cancellationToken)
        => Task.FromResult(ManagerDaily(managerId, filter));
}
