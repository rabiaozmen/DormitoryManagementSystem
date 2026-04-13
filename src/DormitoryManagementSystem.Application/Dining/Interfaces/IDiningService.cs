using DormitoryManagementSystem.Domain.Entities;

namespace DormitoryManagementSystem.Application.Dining.Interfaces;

public interface IDiningService
{
    Task<IEnumerable<DiningMenu>> GetWeeklyMenuAsync(DateTime startDate, CancellationToken cancellationToken = default);
    Task<IEnumerable<DiningMenu>> GetMonthlyMenuAsync(DateTime monthStart, CancellationToken cancellationToken = default);
    Task<DiningMenu> UpsertMenuAsync(DiningMenu menu, CancellationToken cancellationToken = default);
}
