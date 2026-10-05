namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Одна строка топ-листа потерь: возвращённый товар или отменивший
/// менеджер с отнесённой на него суммой.</summary>
/// <param name="Category">Категория товара для строк возвратов; <c>null</c> для строк менеджеров.</param>
public sealed record LossAggregateRow(
    Guid Id,
    string Name,
    string? Category,
    decimal Amount);
