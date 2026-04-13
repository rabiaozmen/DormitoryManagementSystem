using DormitoryManagementSystem.Application.Auth.Interfaces;
using DormitoryManagementSystem.Application.Auth.Models;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    private const string RefreshTokenCookieName = "dms_refresh_token";

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);
        if (result is null)
        {
            return Unauthorized();
        }

        Response.Cookies.Append(RefreshTokenCookieName, result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest? request, CancellationToken cancellationToken)
    {
        var refreshToken = string.IsNullOrWhiteSpace(request?.RefreshToken)
            ? Request.Cookies[RefreshTokenCookieName]
            : request!.RefreshToken;

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized();
        }

        var result = await authService.RefreshAsync(new RefreshRequest { RefreshToken = refreshToken }, cancellationToken);
        if (result is null)
        {
            return Unauthorized();
        }

        Response.Cookies.Append(RefreshTokenCookieName, result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(result);
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete(RefreshTokenCookieName);
        return NoContent();
    }
}
