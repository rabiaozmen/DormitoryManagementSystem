using System.Security.Claims;
using DormitoryManagementSystem.Application.Payments.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/payments")]
public sealed class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpGet("pending")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Pending(CancellationToken cancellationToken)
    {
        var result = await paymentService.GetPendingPaymentsAsync(cancellationToken);
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
