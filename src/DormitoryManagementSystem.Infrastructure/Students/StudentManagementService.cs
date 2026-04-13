using DormitoryManagementSystem.Application.Security.Interfaces;
using DormitoryManagementSystem.Application.Students.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Students;

public sealed class StudentManagementService(
    DmsDbContext dbContext, 
    IPasswordHasher passwordHasher,
    IEncryptionService encryptionService) : IStudentManagementService
{
    public async Task<IEnumerable<StudentSummaryDto>> GetAllStudentsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await dbContext.Students
            .Include(s => s.Department)
            .Include(s => s.Room)
            .OrderByDescending(s => s.CreatedAtUtc)
            .Select(s => new StudentSummaryDto
            {
                Id = s.Id,
                FullName = $"{s.FirstName} {s.LastName}",
                StudentNumber = s.StudentNumber,
                Email = s.Email,
                DepartmentName = s.Department != null ? s.Department.Name : "N/A",
                RoomNumber = s.Room != null ? s.Room.RoomNumber : "N/A",
                BloodType = string.IsNullOrWhiteSpace(s.BloodType) ? "Belirtilmedi" : s.BloodType,
                GuardianFullName = dbContext.Guardians
                    .Where(g => g.StudentId == s.Id)
                    .OrderBy(g => g.Id)
                    .Select(g => g.FullName)
                    .FirstOrDefault() ?? string.Empty,
                GuardianPhone = dbContext.Guardians
                    .Where(g => g.StudentId == s.Id)
                    .OrderBy(g => g.Id)
                    .Select(g => g.Phone)
                    .FirstOrDefault() ?? string.Empty,
                HasOverduePayment = dbContext.Payments
                    .Any(p => p.StudentId == s.Id && p.Status == PaymentStatus.Pending && p.DueDateUtc < now),
                IsActive = s.IsActive,
                CreatedAtUtc = s.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<StudentDetailDto?> GetStudentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var s = await dbContext.Students
            .Include(s => s.Department)
            .Include(s => s.Room)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (s == null) return null;

        return new StudentDetailDto
        {
            Id = s.Id,
            FullName = $"{s.FirstName} {s.LastName}",
            StudentNumber = s.StudentNumber,
            Email = s.Email,
            Phone = s.Phone,
            BirthDate = s.BirthDate,
            DepartmentId = s.DepartmentId,
            DepartmentName = s.Department?.Name ?? "N/A",
            RoomNumber = s.Room?.RoomNumber ?? "N/A",
            BloodType = string.IsNullOrWhiteSpace(s.BloodType) ? "Belirtilmedi" : s.BloodType,
            HealthStatus = s.HealthStatus,
            AllergenFoodInfo = s.AllergenFoodInfo,
            OutstandingDues = s.OutstandingDues,
            IsActive = s.IsActive,
            CreatedAtUtc = s.CreatedAtUtc
        };
    }

    public async Task<Guid> CreateStudentAsync(CreateStudentDto request, CancellationToken cancellationToken = default)
    {
        await EnsureStudentValuesAreUniqueAsync(request.Email, request.Phone, request.StudentNumber, null, cancellationToken);

        var departmentExists = await dbContext.Departments.AnyAsync(x => x.Id == request.DepartmentId, cancellationToken);
        if (!departmentExists)
        {
            throw new InvalidOperationException("Selected department was not found.");
        }

        Room? selectedRoom = null;

        if (request.RoomId.HasValue)
        {
            selectedRoom = await dbContext.Rooms.FirstOrDefaultAsync(r => r.Id == request.RoomId.Value, cancellationToken);
            if (selectedRoom is null)
            {
                throw new InvalidOperationException("Selected room was not found.");
            }

            if (selectedRoom.Occupancy >= selectedRoom.Capacity)
            {
                throw new InvalidOperationException("Selected room is already full.");
            }
        }

        var availableRoom = selectedRoom ?? await dbContext.Rooms
            .Where(r => r.Occupancy < r.Capacity)
            .OrderBy(r => r.Occupancy)
            .ThenBy(r => r.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (availableRoom is null)
        {
            throw new InvalidOperationException("No available room found for new student.");
        }

        var student = new Student
        {
            Id = request.Id ?? Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            StudentNumber = request.StudentNumber,
            TrIdentityNumberEncrypted = encryptionService.Encrypt(request.TcIdentityNumber),
            BloodType = request.BloodType?.Trim() ?? string.Empty,
            HealthStatus = request.HealthStatus?.Trim() ?? string.Empty,
            AllergenFoodInfo = request.AllergenFoodInfo?.Trim() ?? string.Empty,
            RoomId = availableRoom.Id,
            DepartmentId = request.DepartmentId,
            BirthDate = request.BirthDate,
            PasswordHash = passwordHasher.Hash(request.Password),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        availableRoom.Occupancy += 1;
        dbContext.Students.Add(student);
        await dbContext.SaveChangesAsync(cancellationToken);
        return student.Id;
    }

    public async Task UpdateStudentAsync(Guid id, UpdateStudentDto request, CancellationToken cancellationToken = default)
    {
        var student = await dbContext.Students.FindAsync(new object[] { id }, cancellationToken);
        if (student == null) throw new Exception("Student not found");

        await EnsureStudentValuesAreUniqueAsync(request.Email, request.Phone, null, id, cancellationToken);

        student.FirstName = request.FirstName;
        student.LastName = request.LastName;
        student.Email = request.Email;
        student.Phone = request.Phone;
        student.DepartmentId = request.DepartmentId;

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ToggleStudentActiveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var student = await dbContext.Students.FindAsync(new object[] { id }, cancellationToken);
        if (student != null)
        {
            student.IsActive = !student.IsActive;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task EnsureStudentValuesAreUniqueAsync(
        string email,
        string phone,
        string? studentNumber,
        Guid? studentIdToExclude,
        CancellationToken cancellationToken)
    {
        var studentQuery = dbContext.Students.AsQueryable();
        if (studentIdToExclude.HasValue)
        {
            studentQuery = studentQuery.Where(x => x.Id != studentIdToExclude.Value);
        }

        if (await studentQuery.AnyAsync(x => x.Email == email, cancellationToken))
        {
            throw new InvalidOperationException("This email is already registered.");
        }

        if (await studentQuery.AnyAsync(x => x.Phone == phone, cancellationToken) ||
            await dbContext.Staff.AnyAsync(x => x.Phone == phone, cancellationToken))
        {
            throw new InvalidOperationException("This phone number is already registered.");
        }

        if (!string.IsNullOrWhiteSpace(studentNumber) && await studentQuery.AnyAsync(x => x.StudentNumber == studentNumber, cancellationToken))
        {
            throw new InvalidOperationException("This student number is already registered.");
        }
    }
}
