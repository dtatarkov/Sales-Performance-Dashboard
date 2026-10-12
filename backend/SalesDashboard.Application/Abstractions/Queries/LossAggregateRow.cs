namespace SalesDashboard.Application.Abstractions.Queries;

/// <summary>Одна строка топ-листа потерь: возвращённый товар или отменивший
/// менеджер с отнесённой на него суммой.</summary>
/// <param name="Category">Категория товара для строк возвратов; <c>null</c> для строк менеджеров.</param>
/// <param name="Team">Команда менеджера для строк отмен; <c>null</c> для строк товаров.</param>
public sealed record LossAggregateRow(
    Guid Id,
    string Name,
    string? Category,
    string? Team,
    decimal Amount);
