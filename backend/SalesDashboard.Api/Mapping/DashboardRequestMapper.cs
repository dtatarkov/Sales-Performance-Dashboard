using SalesDashboard.Api.Dtos;
using SalesDashboard.Api.Extensions;
using SalesDashboard.Application.Models;
using SalesDashboard.Domain;

namespace SalesDashboard.Api.Mapping;

/// <summary>API DTO → query сценария.</summary>
public sealed class DashboardRequestMapper : IApiMapper<DashboardRequest, DashboardQuery>
{
    public DashboardQuery Map(DashboardRequest source)
        => new(new DateRange(source.From!.Value.AsUtc(), source.To!.Value.AsUtc()), source.Segment);
}
