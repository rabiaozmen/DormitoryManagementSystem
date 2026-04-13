using DormitoryManagementSystem.Application.Maintenance.Interfaces;
using DormitoryManagementSystem.Application.Maintenance.Models;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Maintenance;

public sealed class MaintenanceService(DmsDbContext dbContext) : IMaintenanceService
{
    public async Task<MaintenanceRequest> CreateAsync(CreateMaintenanceRequest request, CancellationToken cancellationToken = default)
    {
        var ticket = $"TKT-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(1000, 9999)}";
        var entity = new MaintenanceRequest
        {
            RoomId = request.RoomId,
            StudentId = request.StudentId,
            Description = request.Description,
            Priority = request.Priority,
            TicketCode = ticket,
            Status = MaintenanceStatus.Open
        };
        dbContext.MaintenanceRequests.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<MaintenanceRequest?> UpdateStatusAsync(UpdateMaintenanceStatusRequest request, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.MaintenanceRequests.FirstOrDefaultAsync(x => x.Id == request.RequestId, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        var isValidTransition =
            (entity.Status == MaintenanceStatus.Open && request.NewStatus == MaintenanceStatus.Assigned) ||
            (entity.Status == MaintenanceStatus.Assigned && request.NewStatus == MaintenanceStatus.InProgress) ||
            (entity.Status == MaintenanceStatus.InProgress && request.NewStatus == MaintenanceStatus.Resolved);

        if (!isValidTransition)
        {
            return null;
        }

        entity.Status = request.NewStatus;
        if (request.NewStatus == MaintenanceStatus.Resolved)
        {
            entity.ResolvedAtUtc = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<IReadOnlyList<MaintenanceRequest>> GetOpenRequestsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.MaintenanceRequests
            .Where(x => x.Status != MaintenanceStatus.Resolved)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }
}
