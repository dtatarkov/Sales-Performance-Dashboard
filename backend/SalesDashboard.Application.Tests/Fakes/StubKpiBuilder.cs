using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

/// <summary>Builder stubs that count invocations — used to prove cancellation short-circuits the pipeline.</summary>
internal sealed class StubKpiBuilder : IKpiBuilder
{
    public int Calls { get; private set; }

    public Task<KpiModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult(EmptyModels.Kpi);
    }
}
