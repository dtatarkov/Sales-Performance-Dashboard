using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;

namespace SalesDashboard.Application.Tests.Fakes;

internal sealed class StubCategoryBuilder : ICategoryBuilder
{
    public int Calls { get; private set; }

    public Task<CategoriesModel> BuildAsync(DashboardQuery query, CancellationToken cancellationToken)
    {
        Calls++;
        return Task.FromResult(EmptyModels.Categories);
    }
}
