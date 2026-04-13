using DormitoryManagementSystem.Application.Maintenance.Models;
using DormitoryManagementSystem.Domain.Entities;

namespace DormitoryManagementSystem.Application.Maintenance.Interfaces;

public interface IMaintenanceService
{
    Task<MaintenanceRequest> CreateAsync(CreateMaintenanceRequest request, CancellationToken cancellationToken = default);
    Task<MaintenanceRequest?> UpdateStatusAsync(UpdateMaintenanceStatusRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceRequest>> GetOpenRequestsAsync(CancellationToken cancellationToken = default);
}
