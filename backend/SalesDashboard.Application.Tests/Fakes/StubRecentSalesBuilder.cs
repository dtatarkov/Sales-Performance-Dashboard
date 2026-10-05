using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal sealed class StubRecentSalesBuilder : IRecentSalesBuilder
{
    public int Calls { get; private set; }

    public Task<RecentSalesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult(EmptyModels.RecentSales);
    }
}
