using SalesDashboard.Domain;

namespace SalesDashboard.Domain.Tests;

/// <summary>
/// Одна политика ранжирования обслуживает все датасеты дашборда (backend.md
/// §3.2). domain.md требует порядок по метрике по убыванию с детерминированным
/// разрешением ничьих, чтобы строки сохраняли позиции между перезагрузками —
/// стабильная сортировка на нестабильных данных перетасовывала бы дашборд
/// при каждом обновлении.
/// </summary>
public class DatasetRankingPolicyTests
{
    private sealed record Row(string Name, decimal Metric, decimal Revenue);

    private readonly DatasetRankingPolicy _policy = new();

    private IReadOnlyList<string> Order(
        IEnumerable<Row> rows,
        Func<Row, decimal>? revenueTieBreak = null)
        => _policy
            .OrderByMetricDescending(rows, r => r.Metric, revenueTieBreak, r => r.Name)
            .Select(r => r.Name)
            .ToList();

    /// <summary>Базовый порядок: по метрике по убыванию, без tie-break.</summary>
    [Fact]
    public void Orders_MetricDescending()
    {
        var rows = new[]
        {
            new Row("B", 100m, 0m),
            new Row("A", 300m, 0m),
            new Row("C", 200m, 0m),
        };

        Assert.Equal(["A", "C", "B"], Order(rows));
    }

    /// <summary>Рейтинг менеджеров: равная метрика → сначала большая выручка (domain.md, «Рейтинг менеджеров»).</summary>
    [Fact]
    public void Managers_EqualMetric_BreaksByRevenueDescending()
    {
        var rows = new[]
        {
            new Row("Смирнов", 50m, 1_000m),
            new Row("Иванов", 50m, 9_000m),
            new Row("Петров", 50m, 5_000m),
        };

        var ordered = Order(rows, revenueTieBreak: r => r.Revenue);

        Assert.Equal(["Иванов", "Петров", "Смирнов"], ordered);
    }

    /// <summary>Выручка участвует только при равной метрике; при разных метриках большая метрика выигрывает, что бы ни было с выручкой.</summary>
    [Fact]
    public void Managers_HigherMetric_WinsOverHigherRevenue()
    {
        var rows = new[]
        {
            new Row("Богатый", 10m, 1_000_000m),
            new Row("Лидер", 20m, 10m),
        };

        Assert.Equal(["Лидер", "Богатый"], Order(rows, r => r.Revenue));
    }

    /// <summary>Полная ничья (метрика и выручка равны) → имя А→Я как последний довод.</summary>
    [Fact]
    public void FullTie_BreaksByName()
    {
        var rows = new[]
        {
            new Row("Яков", 50m, 100m),
            new Row("Аркадий", 50m, 100m),
        };

        Assert.Equal(["Аркадий", "Яков"], Order(rows, r => r.Revenue));
    }

    /// <summary>
    /// Нейтральный revenueTieBreak (null) легален: наборы без выручки получают
    /// имя А→Я как единственное разрешение ничьих, и null не даёт скрытой
    /// стадии сортировки.
    /// </summary>
    [Fact]
    public void NoRevenueTieBreak_EqualMetric_BreaksByNameOnly()
    {
        var rows = new[]
        {
            new Row("Дрон X", 5m, 999m),
            new Row("Аккаунт", 5m, 1m),
        };

        Assert.Equal(["Аккаунт", "Дрон X"], Order(rows));
    }

    /// <summary>
    /// Культурный порядок, а не коды символов. По кодам Unicode 'э' (U+044D) {'<'}
    /// 'я' (U+044F) {'<'} 'ё' (U+0451), а в русском алфавите 'ё' стоит сразу после
    /// 'е' — cultural-сравнение даёт «Ёлка, Эпоха, Яшма», ordinal дал бы
    /// «Эпоха, Яшма, Ёлка».
    /// </summary>
    [Fact]
    public void Names_SortByRussianAlphabet_NotOrdinalCodePoints()
    {
        var rows = new[]
        {
            new Row("Яшма", 1m, 0m),
            new Row("Ёлка", 1m, 0m),
            new Row("Эпоха", 1m, 0m),
        };

        Assert.Equal(["Ёлка", "Эпоха", "Яшма"], Order(rows));
    }

    /// <summary>Регистр не влияет на порядок: «борис» сравнивается как «Борис», а не остаётся после всех заглавных.</summary>
    [Fact]
    public void Names_CompareCaseInsensitively()
    {
        var rows = new[]
        {
            new Row("борис", 1m, 0m),
            new Row("Анна", 1m, 0m),
        };

        Assert.Equal(["Анна", "борис"], Order(rows));
    }

    /// <summary>Повторный вызов на тех же данных даёт тот же порядок.</summary>
    [Fact]
    public void Order_SameInput_SameOrder()
    {
        var rows = new[]
        {
            new Row("B", 5m, 1m),
            new Row("A", 5m, 1m),
            new Row("C", 7m, 1m),
        };

        Assert.Equal(Order(rows), Order(rows));
    }

    /// <summary>Пустой ввод — легальный случай: возвращает пустой список, ничего не выбрасывает.</summary>
    [Fact]
    public void Order_EmptyInput_ReturnsEmpty()
        => Assert.Empty(Order(Array.Empty<Row>()));

    /// <summary>Входной список не мутирует: политика возвращает новый список, не сортируя источник на месте.</summary>
    [Fact]
    public void Order_DoesNotMutateSource()
    {
        var rows = new[] { new Row("B", 1m, 0m), new Row("A", 2m, 0m) };

        Order(rows);

        Assert.Equal("B", rows[0].Name);
    }
}

