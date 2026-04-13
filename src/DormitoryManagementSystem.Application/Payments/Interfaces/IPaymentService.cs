using DormitoryManagementSystem.Domain.Entities;

namespace DormitoryManagementSystem.Application.Payments.Interfaces;

public interface IPaymentService
{
    Task<IReadOnlyList<Payment>> GetStudentPaymentsAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Payment>> GetPendingPaymentsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Payment>> GetAllPaymentsAsync(CancellationToken cancellationToken = default);
    Task<Payment> CreatePaymentAsync(Guid studentId, decimal amount, DateTime dueDate, CancellationToken cancellationToken = default);
    Task<Payment?> MarkPaidAsync(long paymentId, string externalTransactionId, CancellationToken cancellationToken = default);
}
