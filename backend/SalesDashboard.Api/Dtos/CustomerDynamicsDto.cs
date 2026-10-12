namespace SalesDashboard.Api.Dtos;

/// <summary>
/// Блок 5 — динамика клиентов (ui.md §5): две готовые секции — «Рост» и
/// «Падение»; в каждой те же два датасета метрик, внутри — топ-5 (Dyn Top N).
/// </summary>
public sealed record CustomerDynamicsDto(
    IReadOnlyList<DatasetDto<CustomerDynamicsItemDto>> Growth,
    IReadOnlyList<DatasetDto<CustomerDynamicsItemDto>> Decline);
