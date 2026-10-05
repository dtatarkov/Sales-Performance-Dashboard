using SalesDashboard.Application.Abstractions.Queries;
using SalesDashboard.Application.Builders;
using SalesDashboard.Application.Models;
using SalesDashboard.Application.Tests.Fakes;
using SalesDashboard.Domain;

namespace SalesDashboard.Application.Tests;

public sealed class KpiBuilderTests
{
    private static readonly DateRange September = new(
        new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
        new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc));

    private static KpiBuilder Create(FakeKpiReadPort kpi, FakeManagerReadPort managers)
        => new(kpi, managers,
            new PeriodResolver(),
            new ResultMetricsCalculator(),
            new DeltaCalculator(),
            new DatasetRankingPolicy());

    [Fact]
    public async Task Builds_cards_and_delta_against_the_previous_month()
    {
        var kpi = new FakeKpiReadPort
        {
            Totals = filter => filter.Period.From.Month == 9
                ? new PeriodTotalsRow(1000m, 400m, 10, 0, 0)
                : new PeriodTotalsRow(500m, 200m, 5, 0, 0),
        };

        var model = await Create(kpi, new FakeManagerReadPort())
            .BuildAsync(new DashboardQuery(September, null), CancellationToken.None);

        Assert.Equal(1000m, model.Revenue.Value);
        Assert.Equal(100m, model.Revenue.Delta!.Value); // (1000 - 500) / 500 * 100
        Assert.Equal(600m, model.GrossProfit.Value);
        Assert.Equal(60m, model.Margin.Value);          // 600 / 1000 * 100
        Assert.Equal(100m, model.AverageCheck.Value);   // 1000 / 10
        Assert.Null(model.BestManager);                 // агрегатов по менеджерам нет
    }

    [Fact]
    public async Task Empty_period_yields_real_zeros_and_null_ratios()
    {
        var model = await Create(new FakeKpiReadPort(), new FakeManagerReadPort())
            .BuildAsync(new DashboardQuery(September, null), CancellationToken.None);

        Assert.Equal(0m, model.Revenue.Value);   // настоящий ноль, не null
        Assert.Null(model.Revenue.Delta);        // база (предыдущий период) равна нулю
        Assert.Null(model.Margin.Value);         // пустой знаменатель
        Assert.Equal(0m, model.SalesCount.Value);
        Assert.Null(model.AverageCheck.Value);
        Assert.Null(model.BestManager);
        Assert.Equal(30, model.Revenue.Series.Count); // непрерывность через весь месяц
    }

    [Fact]
    public async Task Best_manager_is_leader_of_the_current_period_with_own_delta()
    {
        var leaderId = new Guid("11111111-1111-1111-1111-111111111111");
        var otherId = new Guid("22222222-2222-2222-2222-222222222222");

        var managers = new FakeManagerReadPort
        {
            Roster =
            [
                new ManagerRosterRow(leaderId, "Alice", null, "A", "Alpha"),
                new ManagerRosterRow(otherId, "Bob", null, "B", "Beta"),
            ],
            Aggregates = filter => filter.Period.From.Month == 9
                ? [new ManagerAggregateRow(leaderId, 700m, 300m, 7, 0, 0), new ManagerAggregateRow(otherId, 300m, 100m, 3, 0, 0)]
                : [new ManagerAggregateRow(leaderId, 300m, 200m, 3, 0, 0)],
        };

        var kpi = new FakeKpiReadPort();

        var model = await Create(kpi, managers)
            .BuildAsync(new DashboardQuery(September, null), CancellationToken.None);

        var bestManager = model.BestManager!;
        
        Assert.Equal(leaderId, bestManager.Id);      // максимум ВП: 700-300 > 300-100
        Assert.Equal("Alice", bestManager.Name);
        Assert.Equal(400m, bestManager.GrossProfit);
        Assert.Equal(7, bestManager.SalesCount);
        Assert.Equal(300m, bestManager.Delta!.Value); // собственная ВП предыдущего: (400 - 100) / 100 * 100
        Assert.Equal(30, bestManager.Series.Count);   // серия непрерывна даже без дневных строк
    }
}
