using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal sealed class StubProductBuilder : IProductBuilder
{
    public int Calls { get; private set; }

    public Task<ProductsModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult(EmptyModels.Products);
    }
}
