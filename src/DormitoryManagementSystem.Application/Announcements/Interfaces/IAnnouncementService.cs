namespace DormitoryManagementSystem.Application.Announcements.Interfaces;

public interface IAnnouncementService
{
    Task<IEnumerable<AnnouncementDto>> GetActiveAnnouncementsAsync(string targetAudience, CancellationToken cancellationToken = default);
    Task<int> CreateAnnouncementAsync(CreateAnnouncementDto request, CancellationToken cancellationToken = default);
    Task DeactivateAnnouncementAsync(int id, CancellationToken cancellationToken = default);
}

public class AnnouncementDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public string TargetAudience { get; set; } = string.Empty;
}

public class CreateAnnouncementDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = "All"; // All, Students, Staff
}
