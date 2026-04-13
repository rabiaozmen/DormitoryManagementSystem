using DormitoryManagementSystem.Application.Staff.Interfaces;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.StaffDirectory;

public sealed class StaffDirectoryService(DmsDbContext dbContext) : IStaffDirectoryService
{
    public async Task<IEnumerable<StaffListItemDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Staff
            .OrderBy(x => x.FirstName)
            .ThenBy(x => x.LastName)
            .Select(x => new StaffListItemDto
            {
                Id = x.Id,
                FullName = string.IsNullOrWhiteSpace($"{x.FirstName} {x.LastName}".Trim()) ? x.Email : $"{x.FirstName} {x.LastName}".Trim(),
                Position = x.IsAdmin ? "Administrator" : "Dormitory Staff",
                StaffNumber = x.StaffNumber,
                Email = x.Email,
                MonthlySalary = x.MonthlySalary
            })
            .ToListAsync(cancellationToken);
    }

    public async Task UpdateMonthlySalaryAsync(Guid staffId, decimal monthlySalary, CancellationToken cancellationToken = default)
    {
        var staff = await dbContext.Staff.FirstOrDefaultAsync(x => x.Id == staffId, cancellationToken);
        if (staff is null)
        {
            throw new InvalidOperationException("Staff record could not be found.");
        }

        staff.MonthlySalary = monthlySalary;
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}