namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Строка реестра менеджеров — из неё строится рейтинг
/// (менеджер без продаж всё равно появляется в рейтинге, domain.md).</summary>
public sealed record ManagerRosterRow(
    Guid Id,
    string Name,
    string? Avatar,
    string Initials,
    string Team);
