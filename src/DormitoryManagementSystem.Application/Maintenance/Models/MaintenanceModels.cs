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

public sealed class MaintenanceTicketDto
{
    public long Id { get; init; }
    public string TicketCode { get; init; } = string.Empty;
    public Guid StudentId { get; init; }
    public string StudentName { get; init; } = string.Empty;
    public string RoomNumber { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public MaintenancePriority Priority { get; init; }
    public MaintenanceStatus Status { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? ResolvedAtUtc { get; init; }
}
