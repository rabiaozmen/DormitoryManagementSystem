using DormitoryManagementSystem.Application.Departments.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Departments;

public sealed class DepartmentService(DmsDbContext dbContext) : IDepartmentService
{
    public async Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Departments
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Code = d.Code
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CreateDepartmentAsync(string name, string code, CancellationToken cancellationToken = default)
    {
        var department = new Department { Name = name, Code = code };
        dbContext.Departments.Add(department);
        await dbContext.SaveChangesAsync(cancellationToken);
        return department.Id;
    }
}
