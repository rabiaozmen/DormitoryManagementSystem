using DormitoryManagementSystem.Application.Operations.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Operations;

public sealed class LeaveAndLogService(DmsDbContext dbContext) : ILeaveAndLogService
{
    public async Task<IReadOnlyList<LeaveRequestDto>> GetStudentLeaveRequestsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        return await dbContext.LeaveRequests
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new LeaveRequestDto
            {
                Id = x.Id,
                StudentId = x.StudentId,
                StudentName = x.Student != null ? $"{x.Student.FirstName} {x.Student.LastName}" : string.Empty,
                Type = (int)x.Type,
                StartAtUtc = x.StartAtUtc,
                EndAtUtc = x.EndAtUtc,
                Reason = x.Reason,
                Status = (int)x.Status,
                StaffNote = x.StaffNote,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<LeaveRequestDto> CreateLeaveRequestAsync(Guid studentId, CreateLeaveRequestDto request, CancellationToken cancellationToken = default)
    {
        if (request.EndAtUtc <= request.StartAtUtc)
        {
            throw new InvalidOperationException("End date must be after start date.");
        }

        var leave = new LeaveRequest
        {
            StudentId = studentId,
            Type = Enum.IsDefined(typeof(LeaveType), request.Type) ? (LeaveType)request.Type : LeaveType.DayLeave,
            StartAtUtc = DateTime.SpecifyKind(request.StartAtUtc, DateTimeKind.Utc),
            EndAtUtc = DateTime.SpecifyKind(request.EndAtUtc, DateTimeKind.Utc),
            Reason = request.Reason.Trim(),
            Status = LeaveStatus.Pending,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.LeaveRequests.Add(leave);
        await dbContext.SaveChangesAsync(cancellationToken);

        var studentName = await dbContext.Students
            .Where(x => x.Id == studentId)
            .Select(x => x.FirstName + " " + x.LastName)
            .FirstOrDefaultAsync(cancellationToken) ?? string.Empty;

        return new LeaveRequestDto
        {
            Id = leave.Id,
            StudentId = leave.StudentId,
            StudentName = studentName,
            Type = (int)leave.Type,
            StartAtUtc = leave.StartAtUtc,
            EndAtUtc = leave.EndAtUtc,
            Reason = leave.Reason,
            Status = (int)leave.Status,
            StaffNote = leave.StaffNote,
            CreatedAtUtc = leave.CreatedAtUtc
        };
    }

    public async Task<IReadOnlyList<EntryExitLogDto>> GetStudentEntryExitLogsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        return await dbContext.EntryExitLogs
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.EventAtUtc)
            .Take(100)
            .Select(x => new EntryExitLogDto
            {
                Id = x.Id,
                StudentId = x.StudentId,
                StudentName = x.Student != null ? $"{x.Student.FirstName} {x.Student.LastName}" : string.Empty,
                EventType = (int)x.EventType,
                EventAtUtc = x.EventAtUtc,
                Source = x.Source
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<EntryExitLogDto> AddEntryExitLogAsync(Guid studentId, CreateEntryExitLogDto request, CancellationToken cancellationToken = default)
    {
        var student = await dbContext.Students.FirstOrDefaultAsync(x => x.Id == studentId, cancellationToken);
        if (student is null)
        {
            throw new InvalidOperationException("Student not found.");
        }

        var eventType = Enum.IsDefined(typeof(EntryExitEventType), request.EventType)
            ? (EntryExitEventType)request.EventType
            : EntryExitEventType.CheckOut;

        var log = new EntryExitLog
        {
            StudentId = studentId,
            EventType = eventType,
            EventAtUtc = DateTime.UtcNow,
            Source = "StudentPortal"
        };

        dbContext.EntryExitLogs.Add(log);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new EntryExitLogDto
        {
            Id = log.Id,
            StudentId = studentId,
            StudentName = $"{student.FirstName} {student.LastName}",
            EventType = (int)log.EventType,
            EventAtUtc = log.EventAtUtc,
            Source = log.Source
        };
    }

    public async Task<IReadOnlyList<LeaveRequestDto>> GetPendingLeaveRequestsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.LeaveRequests
            .Where(x => x.Status == LeaveStatus.Pending)
            .OrderBy(x => x.StartAtUtc)
            .Select(x => new LeaveRequestDto
            {
                Id = x.Id,
                StudentId = x.StudentId,
                StudentName = x.Student != null ? $"{x.Student.FirstName} {x.Student.LastName}" : string.Empty,
                Type = (int)x.Type,
                StartAtUtc = x.StartAtUtc,
                EndAtUtc = x.EndAtUtc,
                Reason = x.Reason,
                Status = (int)x.Status,
                StaffNote = x.StaffNote,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<LeaveRequestDto?> ReviewLeaveRequestAsync(Guid staffId, ReviewLeaveRequestDto request, CancellationToken cancellationToken = default)
    {
        var leave = await dbContext.LeaveRequests
            .Include(x => x.Student)
            .FirstOrDefaultAsync(x => x.Id == request.LeaveRequestId, cancellationToken);

        if (leave is null || leave.Status != LeaveStatus.Pending)
        {
            return null;
        }

        leave.Status = request.Approve ? LeaveStatus.Approved : LeaveStatus.Rejected;
        leave.StaffNote = request.StaffNote?.Trim();
        leave.ReviewedByStaffId = staffId;
        leave.ReviewedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new LeaveRequestDto
        {
            Id = leave.Id,
            StudentId = leave.StudentId,
            StudentName = leave.Student != null ? $"{leave.Student.FirstName} {leave.Student.LastName}" : string.Empty,
            Type = (int)leave.Type,
            StartAtUtc = leave.StartAtUtc,
            EndAtUtc = leave.EndAtUtc,
            Reason = leave.Reason,
            Status = (int)leave.Status,
            StaffNote = leave.StaffNote,
            CreatedAtUtc = leave.CreatedAtUtc
        };
    }

    public async Task<IReadOnlyList<EntryExitLogDto>> GetRecentEntryExitLogsAsync(int take = 100, CancellationToken cancellationToken = default)
    {
        var limit = Math.Clamp(take, 1, 500);

        return await dbContext.EntryExitLogs
            .OrderByDescending(x => x.EventAtUtc)
            .Take(limit)
            .Select(x => new EntryExitLogDto
            {
                Id = x.Id,
                StudentId = x.StudentId,
                StudentName = x.Student != null ? $"{x.Student.FirstName} {x.Student.LastName}" : string.Empty,
                EventType = (int)x.EventType,
                EventAtUtc = x.EventAtUtc,
                Source = x.Source
            })
            .ToListAsync(cancellationToken);
    }
}
