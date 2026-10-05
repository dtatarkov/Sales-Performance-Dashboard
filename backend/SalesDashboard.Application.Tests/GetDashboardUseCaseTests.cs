using SalesDashboard.Application.Models;
using SalesDashboard.Application.Tests.Fakes;
using SalesDashboard.Application.UseCases;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Tests;

public sealed class GetDashboardUseCaseTests
{
    private static readonly DateRange September = new(
        new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
        new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));

    [Fact]
    public async Task Cancelled_token_stops_before_the_first_builder()
    {
        var kpi = new StubKpiBuilder();
        var managers = new StubManagerBuilder();
        var customers = new StubCustomerBuilder();
        var timeSeries = new StubTimeSeriesBuilder();
        var categories = new StubCategoryBuilder();
        var products = new StubProductBuilder();
        var recentSales = new StubRecentSalesBuilder();
        var losses = new StubLossBuilder();

        var useCase = new GetDashboardUseCase(
            kpi, managers, customers, timeSeries, categories, products, recentSales, losses);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => useCase.ExecuteAsync(new DashboardQuery(September, null), cts.Token));

        Assert.Equal(0, kpi.Calls);
        Assert.Equal(0, managers.Calls);
        Assert.Equal(0, customers.Calls);
        Assert.Equal(0, timeSeries.Calls);
        Assert.Equal(0, categories.Calls);
        Assert.Equal(0, products.Calls);
        Assert.Equal(0, recentSales.Calls);
        Assert.Equal(0, losses.Calls);
    }

    [Fact]
    public async Task Assembles_every_block_when_not_cancelled()
    {
        var useCase = new GetDashboardUseCase(
            new StubKpiBuilder(),
            new StubManagerBuilder(),
            new StubCustomerBuilder(),
            new StubTimeSeriesBuilder(),
            new StubCategoryBuilder(),
            new StubProductBuilder(),
            new StubRecentSalesBuilder(),
            new StubLossBuilder());

        var model = await useCase.ExecuteAsync(new DashboardQuery(September, null), CancellationToken.None);

        Assert.NotNull(model);
        Assert.NotNull(model.Kpi);
        Assert.NotNull(model.ManagerRating);
        Assert.NotNull(model.ManagerComparison);
        Assert.NotNull(model.TopCustomers);
        Assert.NotNull(model.CustomerDynamics);
        Assert.NotNull(model.TimeSeries);
        Assert.NotNull(model.Categories);
        Assert.NotNull(model.TopProducts);
        Assert.NotNull(model.RecentSales);
        Assert.NotNull(model.Refunds);
        Assert.NotNull(model.Cancellations);
    }
}
