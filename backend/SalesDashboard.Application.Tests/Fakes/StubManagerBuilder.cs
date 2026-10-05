using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal sealed class StubManagerBuilder : IManagerBuilder
{
    public int Calls { get; private set; }

    public Task<(ManagerRatingModel Rating, ManagerComparisonModel Comparison)> BuildAsync(
        DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult((EmptyModels.ManagerRating, EmptyModels.ManagerComparison));
    }
}
