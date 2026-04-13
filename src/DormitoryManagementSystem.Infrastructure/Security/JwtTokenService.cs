using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DormitoryManagementSystem.Application.Security.Interfaces;
using DormitoryManagementSystem.Application.Security.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DormitoryManagementSystem.Infrastructure.Security;

public sealed class JwtTokenService(IOptions<JwtOptions> options) : ITokenService
{
    private readonly JwtOptions _options = options.Value;

    public string CreateAccessToken(TokenRequest request)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, request.UserId.ToString()),
            new(ClaimTypes.NameIdentifier, request.UserId.ToString()),
            new(JwtRegisteredClaimNames.Email, request.Email),
            new(ClaimTypes.Role, request.Role)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
