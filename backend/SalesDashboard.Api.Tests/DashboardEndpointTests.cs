using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace SalesDashboard.Api.Tests;

[Collection(PostgresCollection.Name)]
public sealed class DashboardEndpointTests : IClassFixture<DashboardApiFactory>
{
    private readonly HttpClient _client;

    public DashboardEndpointTests(DashboardApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    private static object RecentPeriodBody(int? segment = null)
    {
        var to = DateTime.UtcNow;
        var from = to.AddDays(-29);
        return new { from = from.ToString("O"), to = to.ToString("O"), segment };
    }

    [Fact]
    public async Task Valid_request_returns_the_full_dashboard_contract()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/dashboard", RecentPeriodBody());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = document.RootElement;

        foreach (var block in new[]
                 {
                     "kpi", "managerRating", "managerComparison", "topCustomers", "customerDynamics",
                     "timeSeries", "categories", "topProducts", "recentSales", "refunds", "cancellations",
                 })
        {
            Assert.True(root.TryGetProperty(block, out _), $"Missing block '{block}'.");
        }

        // Enum'ы ходят по сети числами (api.md); проверяем статус seeded-строки ленты.
        var sales = root.GetProperty("recentSales").GetProperty("sales");
        
        if (sales.GetArrayLength() > 0)
            Assert.Equal(JsonValueKind.Number, sales[0].GetProperty("status").ValueKind);
    }

    [Fact]
    public async Task From_after_to_returns_period_invalid_order()
    {
        var body = new
        {
            from = DateTime.UtcNow.ToString("O"),
            to = DateTime.UtcNow.AddDays(-5).ToString("O"),
            segment = (int?)null,
        };

        var response = await _client.PostAsJsonAsync("/api/v1/dashboard", body);
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("PERIOD_INVALID_ORDER", problem.GetProperty("errors")[0].GetProperty("code").GetString());
    }

    [Fact]
    public async Task Missing_period_returns_period_required()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/dashboard", new { segment = 1 });
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("PERIOD_REQUIRED", problem.GetProperty("errors")[0].GetProperty("code").GetString());
    }

    [Fact]
    public async Task Segment_outside_enum_returns_segment_invalid()
    {
        var body = new
        {
            from = DateTime.UtcNow.AddDays(-29).ToString("O"),
            to = DateTime.UtcNow.ToString("O"),
            segment = 99,
        };

        var response = await _client.PostAsJsonAsync("/api/v1/dashboard", body);
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("SEGMENT_INVALID", problem.GetProperty("errors")[0].GetProperty("code").GetString());
    }

    [Fact]
    public async Task Invalid_json_returns_default_framework_problem_details()
    {
        var content = new StringContent("{ not json", Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/v1/dashboard", content);
        var problem = await ReadProblemAsync(response);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(400, problem.GetProperty("status").GetInt32());
    }

    private static async Task<JsonElement> ReadProblemAsync(HttpResponseMessage response)
    {
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return document.RootElement.Clone();
    }
}
