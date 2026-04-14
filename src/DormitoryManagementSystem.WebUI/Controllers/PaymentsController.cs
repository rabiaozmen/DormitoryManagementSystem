using System.Security.Claims;
using DormitoryManagementSystem.Domain.Entities;
using DormitoryManagementSystem.Application.Payments.Interfaces;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/payments")]
public sealed class PaymentsController(IPaymentService paymentService, DmsDbContext dbContext) : ControllerBase
{
    [HttpGet("pending")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Pending(CancellationToken cancellationToken)
    {
        var result = await dbContext.Payments
            .AsNoTracking()
            .Include(payment => payment.Student)
            .Where(payment => payment.Status == PaymentStatus.Pending)
            .OrderBy(payment => payment.DueDateUtc)
            .Select(payment => new PendingPaymentDto
            {
                Id = payment.Id,
                StudentId = payment.StudentId,
                StudentFullName = payment.Student != null
                    ? $"{payment.Student.FirstName} {payment.Student.LastName}".Trim()
                    : "Unknown Student",
                Amount = payment.Amount,
                DueDateUtc = payment.DueDateUtc,
                Status = payment.Status,
                ExternalTransactionId = payment.ExternalTransactionId,
            })
            .ToListAsync(cancellationToken);

        return Ok(result);
    }

    [HttpGet("all")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await paymentService.GetAllPaymentsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await paymentService.CreatePaymentAsync(request.StudentId, request.Amount, request.DueDate, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { Message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize(Policy = "StudentOnly")]
    public async Task<IActionResult> MyPayments(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(userId, out var studentId))
        {
            return Unauthorized();
        }

        var result = await paymentService.GetStudentPaymentsAsync(studentId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{paymentId:long}/mark-paid")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> MarkPaid(long paymentId, CancellationToken cancellationToken)
    {
        var result = await paymentService.MarkPaidAsync(paymentId, $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}

public sealed class CreatePaymentRequest
{
    public Guid StudentId { get; init; }
    public decimal Amount { get; init; }
    public DateTime DueDate { get; init; }
}

public sealed class PendingPaymentDto
{
    public long Id { get; init; }
    public Guid StudentId { get; init; }
    public string StudentFullName { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public DateTime DueDateUtc { get; init; }
    public PaymentStatus Status { get; init; }
    public string? ExternalTransactionId { get; init; }
}
