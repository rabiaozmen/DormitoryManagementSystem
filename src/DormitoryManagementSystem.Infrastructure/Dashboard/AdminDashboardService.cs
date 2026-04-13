using DormitoryManagementSystem.Application.Dashboard.Interfaces;
using DormitoryManagementSystem.Application.Dashboard.Models;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Dashboard;

public sealed class AdminDashboardService(DmsDbContext dbContext) : IAdminDashboardService
{
    public async Task<AdminDashboardDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var totalStudents = await dbContext.Students.CountAsync(cancellationToken);
        var totalRooms = await dbContext.Rooms.CountAsync(cancellationToken);
        var occupiedBeds = await dbContext.Rooms.SumAsync(x => x.Occupancy, cancellationToken);
        var totalBeds = await dbContext.Rooms.SumAsync(x => x.Capacity, cancellationToken);
        var paidPayments = await dbContext.Payments.Where(x => x.Status == Domain.Entities.PaymentStatus.Paid)
            .ToListAsync(cancellationToken);
        var allPayments = await dbContext.Payments.CountAsync(cancellationToken);

        var occupancyRate = totalBeds == 0 ? 0 : Math.Round((decimal)occupiedBeds / totalBeds * 100, 2);
        var settlementRate = allPayments == 0 ? 0 : Math.Round((decimal)paidPayments.Count / allPayments * 100, 2);
        var totalRevenue = paidPayments.Sum(x => x.Amount);

        // Chart Data - Last 6 Months
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-5);
        sixMonthsAgo = new DateTime(sixMonthsAgo.Year, sixMonthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var monthlyPayments = await dbContext.Payments
            .Where(x => x.PaidAtUtc >= sixMonthsAgo && x.Status == Domain.Entities.PaymentStatus.Paid)
            .ToListAsync(cancellationToken);

        var monthlyExpenses = await dbContext.Expenses
            .Where(x => x.Date >= sixMonthsAgo)
            .ToListAsync(cancellationToken);

        var monthlyStats = new List<MonthlyStatDto>();
        for (int i = 0; i < 6; i++)
        {
            var date = sixMonthsAgo.AddMonths(i);
            var monthName = date.ToString("MMM");
            var res = monthlyPayments.Where(x => x.PaidAtUtc?.Month == date.Month && x.PaidAtUtc?.Year == date.Year).Sum(x => x.Amount);
            var exp = monthlyExpenses.Where(x => x.Date.Month == date.Month && x.Date.Year == date.Year).Sum(x => x.Amount);
            
            monthlyStats.Add(new MonthlyStatDto { Month = monthName, Revenue = res, Expenses = exp });
        }

        var expenseStats = monthlyExpenses
            .GroupBy(x => x.Category)
            .Select(g => new CategoryStatDto { Category = g.Key.ToString(), Amount = g.Sum(x => x.Amount) })
            .ToList();

        return new AdminDashboardDto
        {
            TotalStudents = totalStudents,
            OccupancyRate = occupancyRate,
            OpenTickets = await dbContext.MaintenanceRequests.CountAsync(x => x.Status != Domain.Entities.MaintenanceStatus.Resolved, cancellationToken),
            TotalRevenue = totalRevenue,
            SettlementRate = settlementRate,
            MonthlyStats = monthlyStats,
            ExpenseStats = expenseStats
        };
    }
}
