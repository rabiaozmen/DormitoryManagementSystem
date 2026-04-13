namespace DormitoryManagementSystem.Application.Auth.Models;

public sealed class LoginRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}

public sealed class RefreshRequest
{
    public string RefreshToken { get; init; } = string.Empty;
}

public sealed class AuthResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public DateTime AccessTokenExpiresAtUtc { get; init; }
}
