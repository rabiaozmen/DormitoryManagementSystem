using DormitoryManagementSystem.Application.Finance.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Finance;

public sealed class ExpenseService(DmsDbContext dbContext) : IExpenseService
{
    public async Task<IEnumerable<Expense>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Expenses
            .OrderByDescending(x => x.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task<Expense> CreateAsync(CreateExpenseDto request, CancellationToken cancellationToken = default)
    {
        var expense = new Expense
        {
            Description = request.Description,
            Amount = request.Amount,
            Category = request.Category,
            Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc)
        };

        dbContext.Expenses.Add(expense);
        await dbContext.SaveChangesAsync(cancellationToken);
        return expense;
    }
}
