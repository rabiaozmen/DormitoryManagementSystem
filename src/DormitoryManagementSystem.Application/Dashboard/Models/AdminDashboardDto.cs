namespace DormitoryManagementSystem.Application.Dashboard.Models;

public sealed class AdminDashboardDto
{
    public int TotalStudents { get; init; }
    public decimal OccupancyRate { get; init; }
    public int OpenTickets { get; init; }
    public decimal TotalRevenue { get; init; }
    public decimal SettlementRate { get; init; }
    public List<MonthlyStatDto> MonthlyStats { get; init; } = new();
    public List<CategoryStatDto> ExpenseStats { get; init; } = new();
}

public sealed class MonthlyStatDto
{
    public string Month { get; init; } = string.Empty;
    public decimal Revenue { get; init; }
    public decimal Expenses { get; init; }
}

public sealed class CategoryStatDto
{
    public string Category { get; init; } = string.Empty;
    public decimal Amount { get; init; }
}
