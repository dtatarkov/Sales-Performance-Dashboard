namespace SalesDashboard.Api.Dtos;

/// <summary>
/// Строка клиента в секции динамики (ui.md §5): id/name — клиент,
/// valueNormalized — длина бара 0–100, deltaAbsolute — абсолютная Δ деньгами
/// (первая строка подписи), deltaRelative — относительная Δ (вторая строка).
/// </summary>
public sealed record CustomerDynamicsItemDto(
    Guid Id,
    string Name,
    decimal ValueNormalized,
    decimal DeltaAbsolute,
    DeltaDto? DeltaRelative);
