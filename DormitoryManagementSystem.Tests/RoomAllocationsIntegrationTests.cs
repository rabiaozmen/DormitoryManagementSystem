using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using DormitoryManagementSystem.Tests.Infrastructure;

namespace DormitoryManagementSystem.Tests;

public sealed class RoomAllocationsIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RoomAllocationsIntegrationTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task StaffAllocationsRooms_WithAdminToken_ReturnsRoomsWithOccupancyData()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "admin@dms.local",
            Password = "P@ssw0rd!"
        });
        loginResponse.EnsureSuccessStatusCode();

        var authPayload = await loginResponse.Content.ReadFromJsonAsync<LoginPayload>();
        authPayload.Should().NotBeNull();

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", authPayload!.AccessToken);

        var roomsResponse = await _client.GetAsync("/api/staff/allocations/rooms");

        roomsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var rooms = await roomsResponse.Content.ReadFromJsonAsync<List<RoomPayload>>();
        rooms.Should().NotBeNull();
        rooms!.Should().NotBeEmpty();
        rooms[0].Capacity.Should().BeGreaterThan(0);
        rooms[0].Occupancy.Should().BeGreaterThanOrEqualTo(0);
    }

    private sealed class LoginPayload
    {
        public string AccessToken { get; init; } = string.Empty;
    }

    private sealed class RoomPayload
    {
        public int Capacity { get; init; }
        public int Occupancy { get; init; }
    }
}
