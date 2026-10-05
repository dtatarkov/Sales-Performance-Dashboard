using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;
using SalesDashboard.Application.Tests.Fakes;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Tests;

public sealed class ManagerBuilderTests
{
    private static readonly DateRange September = new(
        new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
        new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));

    private static ManagerBuilder Create(FakeManagerReadPort managers)
        => new(managers,
            new PeriodResolver(),
            new ResultMetricsCalculator(),
            new ContributionCalculator(),
            new DeltaCalculator(),
            new DatasetRankingPolicy(),
            new LossRateCalculator(),
            MetricThresholds.Default);

    [Fact]
    public async Task Keeps_a_manager_without_sales_in_the_rating_with_zeros()
    {
        var withSales = new ManagerRosterRow(Guid.NewGuid(), "Иванов", null, "И", "Альфа");
        var withoutSales = new ManagerRosterRow(Guid.NewGuid(), "Петров", null, "П", "Бета");

        var managers = new FakeManagerReadPort
        {
            Roster = [withSales, withoutSales],
            Aggregates = _ =>
            [
                new ManagerAggregateRow(withSales.Id, 1000m, 400m, 10, 0, 0),
            ],
        };

        var (rating, _) = await Create(managers)
            .BuildAsync(new DashboardQuery(September, null), CancellationToken.None);

        var grossProfitDataset = rating.Datasets[0];
        Assert.Equal(2, grossProfitDataset.Items.Count);

        var petrov = grossProfitDataset.Items.Single(i => i.Name == "Петров");
        Assert.Equal(0m, petrov.GrossProfit);
        Assert.Equal(0, petrov.SalesCount);
        Assert.Null(petrov.Margin);
        Assert.Null(petrov.RevenueDelta);
    }

    [Fact]
    public async Task Ranks_managers_by_gross_profit_descending()
    {
        var first = new ManagerRosterRow(Guid.NewGuid(), "Иванов", null, "И", "Альфа");
        var second = new ManagerRosterRow(Guid.NewGuid(), "Петров", null, "П", "Бета");

        var managers = new FakeManagerReadPort
        {
            Roster = [first, second],
            Aggregates = _ =>
            [
                new ManagerAggregateRow(first.Id, 1000m, 900m, 10, 0, 0),   // ВП 100
                new ManagerAggregateRow(second.Id, 1000m, 100m, 10, 0, 0),  // ВП 900
            ],
        };

        var (rating, _) = await Create(managers)
            .BuildAsync(new DashboardQuery(September, null), CancellationToken.None);

        Assert.Equal("Петров", rating.Datasets[0].Items[0].Name);
    }
}
