using SalesDashboard.Domain;

namespace SalesDashboard.Api.Dtos;

/// <summary>Change against the previous comparable period (api.md, DeltaDto).</summary>
public sealed record DeltaDto(decimal Value, DeltaUnit Unit);
