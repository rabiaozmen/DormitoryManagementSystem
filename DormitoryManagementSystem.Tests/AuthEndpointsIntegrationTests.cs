using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using DormitoryManagementSystem.Tests.Infrastructure;

namespace DormitoryManagementSystem.Tests;

public sealed class AuthEndpointsIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client;

    public AuthEndpointsIntegrationTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithSeededAdminCredentials_ReturnsAccessTokenAndRefreshCookie()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "admin@dms.local",
            Password = "P@ssw0rd!"
        });

        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await loginResponse.Content.ReadFromJsonAsync<LoginPayload>(JsonOptions);
        payload.Should().NotBeNull();
        payload!.AccessToken.Should().NotBeNullOrWhiteSpace();

        loginResponse.Headers.TryGetValues("Set-Cookie", out var setCookieHeaders).Should().BeTrue();
        setCookieHeaders.Should().NotBeNull();
        setCookieHeaders!.Any(value => value.Contains("dms_refresh_token=")).Should().BeTrue();
    }

    [Fact]
    public async Task AdminDashboard_WithoutBearerToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/admin/dashboard");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AdminDashboard_WithValidAdminToken_ReturnsDashboardPayload()
    {
        var token = await LoginAndGetAccessTokenAsync("admin@dms.local", "P@ssw0rd!");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/admin/dashboard");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.TryGetProperty("totalStudents", out _).Should().BeTrue();
        payload.TryGetProperty("occupancyRate", out _).Should().BeTrue();
        payload.TryGetProperty("openTickets", out _).Should().BeTrue();
        payload.TryGetProperty("totalRevenue", out _).Should().BeTrue();
    }

    private async Task<string> LoginAndGetAccessTokenAsync(string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email,
            Password = password
        });

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<LoginPayload>(JsonOptions);
        payload.Should().NotBeNull();

        return payload!.AccessToken;
    }

    private sealed class LoginPayload
    {
        public string AccessToken { get; init; } = string.Empty;
    }
}
