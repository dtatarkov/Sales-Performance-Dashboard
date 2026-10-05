using SalesDashboard.Domain;

namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>
/// Общий фильтр чтения для всех методов портов: окно плюс необязательный
/// фильтр по сегменту клиентов (backend.md §4.3). Порт обязан применять оба —
/// ни один метод не может расширить или проигнорировать фильтр.
/// </summary>
public readonly record struct ReadFilter(DateRange Period, CustomerSegment? Segment);
