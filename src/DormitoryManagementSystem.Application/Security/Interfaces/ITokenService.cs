using DormitoryManagementSystem.Application.Security.Models;

namespace DormitoryManagementSystem.Application.Security.Interfaces;

public interface ITokenService
{
    string CreateAccessToken(TokenRequest request);
}
