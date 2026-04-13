using DormitoryManagementSystem.Application.Dashboard.Models;

namespace DormitoryManagementSystem.Application.Dashboard.Interfaces;

public interface IAdminDashboardService
{
    Task<AdminDashboardDto> GetAsync(CancellationToken cancellationToken = default);
}
