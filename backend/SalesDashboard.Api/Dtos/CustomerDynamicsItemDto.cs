namespace SalesDashboard.Api.Dtos;

/// <summary>One customer row in the dynamics (api.md, CustomerDynamicsItemDto).</summary>
public sealed record CustomerDynamicsItemDto(Guid Id, string Name, decimal Value, DeltaDto? Delta);
