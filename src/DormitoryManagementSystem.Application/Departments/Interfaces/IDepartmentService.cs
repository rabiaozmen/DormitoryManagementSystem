namespace DormitoryManagementSystem.Application.Departments.Interfaces;

public interface IDepartmentService
{
    Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<int> CreateDepartmentAsync(string name, string code, CancellationToken cancellationToken = default);
}

public class DepartmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
