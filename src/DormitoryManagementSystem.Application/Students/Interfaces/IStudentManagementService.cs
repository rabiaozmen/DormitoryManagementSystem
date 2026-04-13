namespace DormitoryManagementSystem.Application.Students.Interfaces;

public interface IStudentManagementService
{
    Task<IEnumerable<StudentSummaryDto>> GetAllStudentsAsync(CancellationToken cancellationToken = default);
    Task<StudentDetailDto?> GetStudentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Guid> CreateStudentAsync(CreateStudentDto request, CancellationToken cancellationToken = default);
    Task UpdateStudentAsync(Guid id, UpdateStudentDto request, CancellationToken cancellationToken = default);
    Task ToggleStudentActiveAsync(Guid id, CancellationToken cancellationToken = default);
}

public class StudentSummaryDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public string BloodType { get; set; } = string.Empty;
    public string GuardianFullName { get; set; } = string.Empty;
    public string GuardianPhone { get; set; } = string.Empty;
    public bool HasOverduePayment { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class StudentDetailDto : StudentSummaryDto
{
    public string Phone { get; set; } = string.Empty;
    public string HealthStatus { get; set; } = string.Empty;
    public string AllergenFoodInfo { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
    public decimal OutstandingDues { get; set; }
    public int DepartmentId { get; set; }
}

public class CreateStudentDto
{
    public Guid? Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
    public string TcIdentityNumber { get; set; } = string.Empty;
    public string? BloodType { get; set; }
    public string? HealthStatus { get; set; }
    public string? AllergenFoodInfo { get; set; }
    public int DepartmentId { get; set; }
    public int? RoomId { get; set; }
    public DateOnly BirthDate { get; set; }
}

public class UpdateStudentDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
}
