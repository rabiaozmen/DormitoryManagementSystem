namespace DormitoryManagementSystem.Application.Allocations.Interfaces;

public interface IAllocationService
{
    Task<IEnumerable<RoomDto>> GetRoomsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<StudentDto>> GetUnassignedStudentsAsync(CancellationToken cancellationToken = default);
    Task AssignStudentToRoomAsync(Guid studentId, int roomId, CancellationToken cancellationToken = default);
    Task RemoveStudentFromRoomAsync(Guid studentId, CancellationToken cancellationToken = default);
}

public class RoomDto
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string BuildingName { get; set; } = string.Empty;
    public string BuildingZone { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int Occupancy { get; set; }
    public string GenderPolicy { get; set; } = string.Empty;
    public decimal MonthlyRate { get; set; }
    public IEnumerable<StudentSimpleDto> CurrentStudents { get; set; } = new List<StudentSimpleDto>();
}

public class StudentDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string StudentNumber { get; set; } = string.Empty;
}

public class StudentSimpleDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
}
