using DormitoryManagementSystem.Domain.Entities;

namespace DormitoryManagementSystem.Application.Finance.Interfaces;

public interface IExpenseService
{
    Task<IEnumerable<Expense>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Expense> CreateAsync(CreateExpenseDto request, CancellationToken cancellationToken = default);
}

public class CreateExpenseDto
{
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public ExpenseCategory Category { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
}
