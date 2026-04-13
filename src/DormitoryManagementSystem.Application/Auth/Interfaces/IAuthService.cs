using DormitoryManagementSystem.Application.Auth.Models;

namespace DormitoryManagementSystem.Application.Auth.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> RefreshAsync(RefreshRequest request, CancellationToken cancellationToken = default);
}
