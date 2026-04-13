namespace DormitoryManagementSystem.Domain.Entities;

public abstract class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // bcrypt hash
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class Student : User
{
    public int RoomId { get; set; }
    public int DepartmentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string TrIdentityNumberEncrypted { get; set; } = string.Empty; // AES-256 at rest
    public string BloodType { get; set; } = string.Empty;
    public string HealthStatus { get; set; } = string.Empty;
    public string AllergenFoodInfo { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
    public decimal OutstandingDues { get; set; }
    public DateTime CheckInDateUtc { get; set; }

    public Room? Room { get; set; }
    public Department? Department { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Guardian> Guardians { get; set; } = new List<Guardian>();
}

public sealed class Staff : User
{
    public string StaffNumber { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public ICollection<Building> ManagedBuildings { get; set; } = new List<Building>();
}

public sealed class Building
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public Guid StaffId { get; set; } // one-to-one warden relation

    public Staff? Staff { get; set; }
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}

public sealed class Room
{
    public int Id { get; set; }
    public int BuildingId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int Occupancy { get; set; }
    public decimal MonthlyRate { get; set; }
    public string GenderPolicy { get; set; } = string.Empty;

    public Building? Building { get; set; }
    public ICollection<Student> Students { get; set; } = new List<Student>();
    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
}

public sealed class Payment
{
    public long Id { get; set; }
    public Guid StudentId { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDateUtc { get; set; }
    public DateTime? PaidAtUtc { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? ExternalTransactionId { get; set; }

    public Student? Student { get; set; }
}

public sealed class Guardian
{
    public int Id { get; set; }
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;

    public Student? Student { get; set; }
}

public sealed class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;

    public ICollection<Student> Students { get; set; } = new List<Student>();
}

public sealed class RefreshToken
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAtUtc { get; set; }
    public bool IsRevoked { get; set; }
}

public enum PaymentStatus
{
    Pending = 0,
    Paid = 1,
    Failed = 2
}

public enum MaintenanceStatus
{
    Open = 0,
    Assigned = 1,
    InProgress = 2,
    Resolved = 3
}

public enum MaintenancePriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

public sealed class MaintenanceRequest
{
    public long Id { get; set; }
    public int RoomId { get; set; }
    public Guid StudentId { get; set; }
    public string TicketCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Open;
    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAtUtc { get; set; }

    public Room? Room { get; set; }
    public Student? Student { get; set; }
}

public sealed class Announcement
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public string TargetAudience { get; set; } = "All"; // All, Students, Staff
}

public enum ExpenseCategory
{
    Salary = 0,
    Kitchen = 1,
    Utility = 2,
    Maintenance = 3,
    Other = 4
}

public sealed class Expense
{
    public long Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public ExpenseCategory Category { get; set; }
}

public sealed class DiningMenu
{
    public int Id { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string Breakfast { get; set; } = string.Empty;
    public string Lunch { get; set; } = string.Empty;
    public string Dinner { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public enum LeaveType
{
    DayLeave = 0,
    OvernightLeave = 1
}

public enum LeaveStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public sealed class LeaveRequest
{
    public long Id { get; set; }
    public Guid StudentId { get; set; }
    public LeaveType Type { get; set; }
    public DateTime StartAtUtc { get; set; }
    public DateTime EndAtUtc { get; set; }
    public string Reason { get; set; } = string.Empty;
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public string? StaffNote { get; set; }
    public Guid? ReviewedByStaffId { get; set; }
    public DateTime? ReviewedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Student? Student { get; set; }
}

public enum EntryExitEventType
{
    CheckIn = 0,
    CheckOut = 1
}

public sealed class EntryExitLog
{
    public long Id { get; set; }
    public Guid StudentId { get; set; }
    public EntryExitEventType EventType { get; set; }
    public DateTime EventAtUtc { get; set; } = DateTime.UtcNow;
    public string Source { get; set; } = "Manual";

    public Student? Student { get; set; }
}
