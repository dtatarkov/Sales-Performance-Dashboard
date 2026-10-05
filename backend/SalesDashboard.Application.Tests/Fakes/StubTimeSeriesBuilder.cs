using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal sealed class StubTimeSeriesBuilder : ITimeSeriesBuilder
{
    public int Calls { get; private set; }

    public Task<TimeSeriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult(EmptyModels.TimeSeries);
    }
}
