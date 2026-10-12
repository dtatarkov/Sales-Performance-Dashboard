План интеграционных тестов полного pipeline расчёта метрик дашборда (подтверждён пользователем сообщением «план подтвержден»).

## Суть
Проверяем весь pipeline: подготовленное состояние БД (Testcontainers Postgres, своя БД на каждый уникальный по смыслу мир) → EF-порты → билдеры → мапперы → JSON-ответ POST /api/v1/dashboard. Прод-код не меняется, только тестовый проект SalesDashboard.Api.Tests. Все даты seed'а — фиксированные UTC-константы (серверного «сегодня» в pipeline нет), production-сеидер подменяется no-op'ом через DI.

## Инфраструктура (SalesDashboard.Api.Tests/Scenarios/)
1. DashboardApiFactory (правка) — конструктор (connectionString, suppressSeed); при suppressSeed подменять IDataSeeder на NoopSeeder.
2. NoopSeeder.cs — пустой сидер.
3. DashboardScenarioHost.cs — фикстура мира: CREATE DATABASE на общем контейнере → MigrateAsync → seed через TestGraph → старт хоста → HttpClient; DisposeAsync — DROP DATABASE.
4. TestGraph.cs — детерминированный конструктор данных (AddManager/AddCustomer/AddCategory/AddProduct + AddPaidSale/AddRefundedSale/AddCancelledSale с позициями).
5. Хелперы: PostDashboardAsync(from, to, segment) → десериализованный DashboardDto; assert-хелперы для Delta.

## 13 миров (уникальных состояний БД)
1. CanaryWorld — минимальный мир (1 сделка, 2 позиции): сквозная арифметика всех 11 блоков, нулевые дни, sparse-серии, рейтинг с бездействующим менеджером, сырой JSON-контракт.
2. WindowBoundaryWorld — границы полуинтервалов [from,to) и предыдущего окна по paidAt/refundedAt/cancelledAt.
3. RefundWorld — возвраты: net по когорте, salesCount/AC-знаменатель, событие прошлого периода, порог RefundMinSample=8 (7→null), feed status=2 gp=null.
4. CancellationWorld — отмены: событийная доля, порог 5 (4→null), rate 100% при единственном исходе, отмена прошлого периода, лента без отмен.
5. DeltaWorld — Δ-математика: рост/падение %, zero-base → null, margin/rate в п.п., bestManager delta по своей ВП, строки только из прошлого периода не создаются.
6. HourlyWorld — однодневный период: 24 точки во всех непрерывных сериях, sparse margin/AC, окно 24ч со сдвигом.
7. DailySeriesWorld — 7 дней/месяц через границу, дыры → нули, выравнивание timeSeries по индексу.
8. SegmentWorld — сегменты 1/2/3/null: изолированные срезы через все блоки, фильтрация предыдущего периода.
9. RankingWorld — ничьи: revenue tie-break у менеджеров, имя А→Я (ru-RU) у остальных, отрицательная ВП, TopN-обрезки (12 клиентов/менеджеров).
10. DynamicsWorld — рост/падение по размаху, топ-5, исключение null-Δ клиентов, нормализация к максимуму секции.
11. LossTopTailWorld — топ-10 + хвост потерь, инвариант top+tail=100%, tail null при одном объекте.
12. EmptyWorld — реестр без сделок: 0 vs null по всем блокам, rate null.
13. FeedWorld — лента: 25 сделок → 20, порядок по paidAt DESC, статусы, gp=null у возвратов.

## Замечания
- api.md блок 5 устарел (документ: плоский список; реализация: секции Рост/Падение топ-5) — тестируем реализацию.
- HasEnoughDynamicsBase в pipeline не вызывается — фильтр динамики = вычислимость обеих Δ.
- Округлений в мапперах нет — цены в seed подбираются под точные десятичные ожидания.

## Порядок
Инфраструктура + CanaryWorld (отладка механики) → остальные миры → dotnet build → dotnet test на backend/SalesDashboard.slnx. Контекст документации: docs/* кроме domain.md станут архивными, актуальные детали — в README.