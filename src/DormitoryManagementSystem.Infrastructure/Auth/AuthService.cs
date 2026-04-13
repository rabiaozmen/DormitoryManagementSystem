using System.Security.Cryptography;
using DormitoryManagementSystem.Application.Auth.Interfaces;
using DormitoryManagementSystem.Application.Auth.Models;
using DormitoryManagementSystem.Application.Security.Interfaces;
using DormitoryManagementSystem.Application.Security.Models;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using DormitoryManagementSystem.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;

namespace DormitoryManagementSystem.Infrastructure.Auth;

public sealed class AuthService(
    DmsDbContext dbContext,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IOptions<JwtOptions> jwtOptions,
    IOptions<RefreshTokenOptions> refreshOptions) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var student = await ExecuteWithRetryAsync(
            () => dbContext.Students.FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken),
            cancellationToken);
        if (student is not null && passwordHasher.Verify(request.Password, student.PasswordHash))
        {
            return await IssueTokensAsync(student.Id, student.Email, "Student", cancellationToken);
        }

        var staff = await ExecuteWithRetryAsync(
            () => dbContext.Staff.FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken),
            cancellationToken);
        if (staff is null || !passwordHasher.Verify(request.Password, staff.PasswordHash))
        {
            return null;
        }

        var role = staff.IsAdmin ? "Admin" : "Staff";
        return await IssueTokensAsync(staff.Id, staff.Email, role, cancellationToken);
    }

    public async Task<AuthResponse?> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default)
    {
        var candidates = await dbContext.RefreshTokens
            .Where(x => !x.IsRevoked && x.ExpiresAtUtc > DateTime.UtcNow)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(50)
            .ToListAsync(cancellationToken);

        var tokenRow = candidates.FirstOrDefault(x => passwordHasher.Verify(request.RefreshToken, x.TokenHash));

        if (tokenRow is null)
        {
            return null;
        }

        tokenRow.IsRevoked = true;
        tokenRow.RevokedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        var email = tokenRow.Role == "Student"
            ? (await dbContext.Students.Where(x => x.Id == tokenRow.UserId).Select(x => x.Email).FirstOrDefaultAsync(cancellationToken))
            : (await dbContext.Staff.Where(x => x.Id == tokenRow.UserId).Select(x => x.Email).FirstOrDefaultAsync(cancellationToken));

        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        return await IssueTokensAsync(tokenRow.UserId, email, tokenRow.Role, cancellationToken);
    }

    private async Task<AuthResponse> IssueTokensAsync(Guid userId, string email, string role, CancellationToken cancellationToken)
    {
        var accessToken = tokenService.CreateAccessToken(new TokenRequest
        {
            UserId = userId,
            Email = email,
            Role = role
        });

        var refreshTokenPlain = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var refreshTokenHash = passwordHasher.Hash(refreshTokenPlain);

        dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            Role = role,
            TokenHash = refreshTokenHash,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(refreshOptions.Value.ExpiryDays)
        });
        await ExecuteWithRetryAsync(() => dbContext.SaveChangesAsync(cancellationToken), cancellationToken);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenPlain,
            Role = role,
            AccessTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(jwtOptions.Value.AccessTokenMinutes)
        };
    }

    private static bool IsTransient(Exception exception)
    {
        return exception is NpgsqlException || exception is TimeoutException;
    }

    private static async Task<T> ExecuteWithRetryAsync<T>(Func<Task<T>> operation, CancellationToken cancellationToken)
    {
        try
        {
            return await operation();
        }
        catch (Exception ex) when (IsTransient(ex))
        {
            await Task.Delay(150, cancellationToken);
            return await operation();
        }
    }

    private static async Task ExecuteWithRetryAsync(Func<Task> operation, CancellationToken cancellationToken)
    {
        try
        {
            await operation();
        }
        catch (Exception ex) when (IsTransient(ex))
        {
            await Task.Delay(150, cancellationToken);
            await operation();
        }
    }
}
