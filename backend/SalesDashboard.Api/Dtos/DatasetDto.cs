namespace SalesDashboard.Api.Dtos;

/// <summary>Named dataset of switchable items (api.md, DatasetDto&lt;T&gt;).</summary>
public sealed record DatasetDto<T>(string Name, IReadOnlyList<T> Items);
