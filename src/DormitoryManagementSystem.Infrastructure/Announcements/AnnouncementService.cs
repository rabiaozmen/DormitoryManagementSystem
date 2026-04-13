using DormitoryManagementSystem.Application.Announcements.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Announcements;

public sealed class AnnouncementService(DmsDbContext dbContext) : IAnnouncementService
{
    public async Task<int> CreateAnnouncementAsync(CreateAnnouncementDto request, CancellationToken cancellationToken = default)
    {
        var announcement = new Announcement
        {
            Title = request.Title,
            Content = request.Content,
            TargetAudience = request.TargetAudience,
            CreatedAtUtc = DateTime.UtcNow,
            IsActive = true
        };

        dbContext.Announcements.Add(announcement);
        await dbContext.SaveChangesAsync(cancellationToken);

        return announcement.Id;
    }

    public async Task DeactivateAnnouncementAsync(int id, CancellationToken cancellationToken = default)
    {
        var announcement = await dbContext.Announcements.FindAsync(new object[] { id }, cancellationToken);
        if (announcement != null)
        {
            announcement.IsActive = false;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IEnumerable<AnnouncementDto>> GetActiveAnnouncementsAsync(string targetAudience, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Announcements.Where(a => a.IsActive);

        if (!string.IsNullOrEmpty(targetAudience) && targetAudience != "Admin")
        {
            query = query.Where(a => a.TargetAudience == "All" || a.TargetAudience == targetAudience);
        }

        return await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new AnnouncementDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                CreatedAtUtc = a.CreatedAtUtc,
                TargetAudience = a.TargetAudience
            })
            .ToListAsync(cancellationToken);
    }
}
