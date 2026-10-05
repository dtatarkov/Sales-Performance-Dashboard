namespace SalesDashboard.Api.Mapping;

/// <summary>Contract for a one-way mapper between two model families (backend.md §6.4).</summary>
public interface IApiMapper<in TSource, out TTarget>
{
    TTarget Map(TSource source);
}
