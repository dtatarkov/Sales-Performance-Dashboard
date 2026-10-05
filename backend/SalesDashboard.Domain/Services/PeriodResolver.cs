namespace SalesDashboard.Domain;

/// <summary>
/// Вычисляет предыдущий сопоставимый период для <see cref="DateRange"/>
/// (domain.md, «Предыдущий сопоставимый период»).
/// </summary>
public interface IPeriodResolver
{
    DateRange Previous(DateRange current);
}

/// <summary>
/// Не имеющая состояния реализация <see cref="IPeriodResolver"/>.
/// Предыдущий период — это всегда <c>[From − длительность, From)</c>: та же
/// длительность в днях, непосредственно перед активным периодом, без перехода
/// к календарным месяцам. Равная длительность гарантирует сопоставимость баз
/// Δ и пару для каждого дня в <see cref="Application"/>-сериях; пресеты
/// («Прошлый месяц» и др.) меняют только выбор активного периода, а не правило
/// вычисления предыдущего.
/// </summary>
public sealed class PeriodResolver : IPeriodResolver
{
    public DateRange Previous(DateRange current)
    {
        var duration = current.To - current.From;

        return new DateRange(current.From - duration, current.From);
    }
}
