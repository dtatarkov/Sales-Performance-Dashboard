using System.Globalization;

namespace SalesDashboard.Domain;

/// <summary>
/// Детерминированная сортировка наборов данных дашборда (domain.md,
/// «Сортировка и порядок строк»): по активной метрике по убыванию с фиксированным
/// разрешением ничьих, чтобы равные значения не переставлялись между запросами.
/// </summary>
public interface IDatasetRankingPolicy
{
    /// <summary>
    /// Упорядочивает элементы по <paramref name="metric"/> по убыванию.
    /// Менеджеры передают <paramref name="revenueTieBreak"/> (равная метрика → сначала больше выручка,
    /// затем имя); остальные наборы передают <c>null</c> (равная метрика → имя А→Я).
    /// </summary>
    IReadOnlyList<T> OrderByMetricDescending<T>(
        IEnumerable<T> items,
        Func<T, decimal> metric,
        Func<T, decimal>? revenueTieBreak,
        Func<T, string> name);
}

/// <summary>
/// Не имеющая состояния реализация <see cref="IDatasetRankingPolicy"/>.
/// Имена сравниваются с закреплённой русской культурой, чтобы порядок был одинаков
/// на любой машине, независимо от окружающей UI-культуры.
/// </summary>
public sealed class DatasetRankingPolicy : IDatasetRankingPolicy
{
    private static readonly StringComparer NameComparer =
        StringComparer.Create(new CultureInfo("ru-RU"), ignoreCase: true);

    public IReadOnlyList<T> OrderByMetricDescending<T>(
        IEnumerable<T> items,
        Func<T, decimal> metric,
        Func<T, decimal>? revenueTieBreak,
        Func<T, string> name)
    {
        var ordered = items.OrderByDescending(metric);

        if (revenueTieBreak is not null)
            ordered = ordered.ThenByDescending(revenueTieBreak);

        return ordered.ThenBy(name, NameComparer).ToList();
    }
}
