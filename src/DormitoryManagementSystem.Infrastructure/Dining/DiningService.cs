using DormitoryManagementSystem.Application.Dining.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Dining;

public sealed class DiningService(DmsDbContext dbContext) : IDiningService
{
    public async Task<IEnumerable<DiningMenu>> GetWeeklyMenuAsync(DateTime startDate, CancellationToken cancellationToken = default)
    {
        var start = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
        var end = start.AddDays(7);

        return await dbContext.DiningMenus
            .Where(x => x.Date >= start && x.Date < end)
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<DiningMenu>> GetMonthlyMenuAsync(DateTime monthStart, CancellationToken cancellationToken = default)
    {
        var start = new DateTime(monthStart.Year, monthStart.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);

        return await dbContext.DiningMenus
            .Where(x => x.Date >= start && x.Date < end)
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task<DiningMenu> UpsertMenuAsync(DiningMenu menu, CancellationToken cancellationToken = default)
    {
        menu.Date = DateTime.SpecifyKind(menu.Date.Date, DateTimeKind.Utc);
        
        var existing = await dbContext.DiningMenus
            .FirstOrDefaultAsync(x => x.Date == menu.Date, cancellationToken);

        if (existing != null)
        {
            existing.Breakfast = menu.Breakfast;
            existing.Lunch = menu.Lunch;
            existing.Dinner = menu.Dinner;
            existing.ImageUrl = menu.ImageUrl;
        }
        else
        {
            dbContext.DiningMenus.Add(menu);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return existing ?? menu;
    }
}
