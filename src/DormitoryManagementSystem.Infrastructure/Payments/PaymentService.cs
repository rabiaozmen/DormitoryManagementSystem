using DormitoryManagementSystem.Application.Payments.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Payments;

public sealed class PaymentService(DmsDbContext dbContext) : IPaymentService
{
    public async Task<IReadOnlyList<Payment>> GetStudentPaymentsAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Payments
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.DueDateUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Payment>> GetPendingPaymentsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Payments
            .Where(x => x.Status == PaymentStatus.Pending)
            .OrderBy(x => x.DueDateUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Payment>> GetAllPaymentsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Payments
            .OrderByDescending(x => x.DueDateUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Payment> CreatePaymentAsync(Guid studentId, decimal amount, DateTime dueDate, CancellationToken cancellationToken = default)
    {
        var utcDueDate = DateTime.SpecifyKind(dueDate, DateTimeKind.Utc);
        var monthStart = new DateTime(utcDueDate.Year, utcDueDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = monthStart.AddMonths(1);

        var alreadyExists = await dbContext.Payments.AnyAsync(
            x => x.StudentId == studentId && x.DueDateUtc >= monthStart && x.DueDateUtc < nextMonthStart,
            cancellationToken);

        if (alreadyExists)
        {
            throw new InvalidOperationException("Bu öğrenci için bu ay faturası zaten oluşturulmuş.");
        }

        var payment = new Payment
        {
            StudentId = studentId,
            Amount = amount,
            DueDateUtc = utcDueDate,
            Status = PaymentStatus.Pending
        };

        dbContext.Payments.Add(payment);
        await dbContext.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Payment?> MarkPaidAsync(long paymentId, string externalTransactionId, CancellationToken cancellationToken = default)
    {
        var payment = await dbContext.Payments.FirstOrDefaultAsync(x => x.Id == paymentId, cancellationToken);
        if (payment is null)
        {
            return null;
        }

        payment.Status = PaymentStatus.Paid;
        payment.PaidAtUtc = DateTime.UtcNow;
        payment.ExternalTransactionId = externalTransactionId;
        await dbContext.SaveChangesAsync(cancellationToken);
        return payment;
    }
}
