using DormitoryManagementSystem.Domain.Entities;

namespace DormitoryManagementSystem.Application.Maintenance.Models;

public sealed class CreateMaintenanceRequest
{
    public int RoomId { get; init; }
    public Guid StudentId { get; init; }
    public string Description { get; init; } = string.Empty;
    public MaintenancePriority Priority { get; init; } = MaintenancePriority.Medium;
}

public sealed class UpdateMaintenanceStatusRequest
{
    public long RequestId { get; init; }
    public MaintenanceStatus NewStatus { get; init; }
}
