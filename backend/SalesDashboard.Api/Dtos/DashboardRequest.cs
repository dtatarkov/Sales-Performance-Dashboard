using SalesDashboard.Domain;

namespace SalesDashboard.Api.Dtos;

/// <summary>
/// Тело запроса <c>POST /api/v1/dashboard</c> (api.md). <c>From</c>/<c>To</c>
/// nullable, чтобы отсутствующий период валидатор отдал как <c>PERIOD_REQUIRED</c>,
/// а не как ошибку JSON-биндинга.
/// </summary>
public sealed record DashboardRequest(DateTime? From, DateTime? To, CustomerSegment? Segment);
