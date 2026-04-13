namespace DormitoryManagementSystem.Application.Operations.Interfaces;

public interface ILeaveAndLogService
{
    Task<IReadOnlyList<LeaveRequestDto>> GetStudentLeaveRequestsAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<LeaveRequestDto> CreateLeaveRequestAsync(Guid studentId, CreateLeaveRequestDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EntryExitLogDto>> GetStudentEntryExitLogsAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<EntryExitLogDto> AddEntryExitLogAsync(Guid studentId, CreateEntryExitLogDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LeaveRequestDto>> GetPendingLeaveRequestsAsync(CancellationToken cancellationToken = default);
    Task<LeaveRequestDto?> ReviewLeaveRequestAsync(Guid staffId, ReviewLeaveRequestDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EntryExitLogDto>> GetRecentEntryExitLogsAsync(int take = 100, CancellationToken cancellationToken = default);
}

public class LeaveRequestDto
{
    public long Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int Type { get; set; }
    public DateTime StartAtUtc { get; set; }
    public DateTime EndAtUtc { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int Status { get; set; }
    public string? StaffNote { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateLeaveRequestDto
{
    public int Type { get; set; }
    public DateTime StartAtUtc { get; set; }
    public DateTime EndAtUtc { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ReviewLeaveRequestDto
{
    public long LeaveRequestId { get; set; }
    public bool Approve { get; set; }
    public string? StaffNote { get; set; }
}

public class EntryExitLogDto
{
    public long Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int EventType { get; set; }
    public DateTime EventAtUtc { get; set; }
    public string Source { get; set; } = string.Empty;
}

public class CreateEntryExitLogDto
{
    public int EventType { get; set; }
}
