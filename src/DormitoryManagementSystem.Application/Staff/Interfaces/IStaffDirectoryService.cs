namespace DormitoryManagementSystem.Application.Staff.Interfaces;

public interface IStaffDirectoryService
{
    Task<IEnumerable<StaffListItemDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task UpdateMonthlySalaryAsync(Guid staffId, decimal monthlySalary, CancellationToken cancellationToken = default);
}

public class StaffListItemDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string StaffNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public decimal MonthlySalary { get; set; }
}