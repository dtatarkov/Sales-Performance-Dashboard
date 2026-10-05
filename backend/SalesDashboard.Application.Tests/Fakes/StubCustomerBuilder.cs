using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal sealed class StubCustomerBuilder : ICustomerBuilder
{
    public int Calls { get; private set; }

    public Task<(CustomerTopModel Top, CustomerDynamicsModel Dynamics)> BuildAsync(
        DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult((EmptyModels.CustomerTop, EmptyModels.CustomerDynamics));
    }
}
