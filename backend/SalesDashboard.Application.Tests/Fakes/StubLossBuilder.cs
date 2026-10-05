using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal sealed class StubLossBuilder : ILossBuilder
{
    public int Calls { get; private set; }

    public Task<(RefundsModel Refunds, CancellationsModel Cancellations)> BuildAsync(
        DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult((EmptyModels.Refunds, EmptyModels.Cancellations));
    }
}
