using System.Security.Claims;
using DormitoryManagementSystem.Application.Operations.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/student/operations")]
[Authorize(Policy = "StudentOnly")]
public sealed class StudentOperationsController(ILeaveAndLogService service) : ControllerBase
{
    [HttpGet("leave-requests")]
    public async Task<IActionResult> LeaveRequests(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var studentId))
        {
            return Unauthorized();
        }

        var result = await service.GetStudentLeaveRequestsAsync(studentId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("leave-requests")]
    public async Task<IActionResult> CreateLeave([FromBody] CreateLeaveRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var studentId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await service.CreateLeaveRequestAsync(studentId, request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpGet("entry-exit-logs")]
    public async Task<IActionResult> EntryExitLogs(CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var studentId))
        {
            return Unauthorized();
        }

        var result = await service.GetStudentEntryExitLogsAsync(studentId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("entry-exit-logs")]
    public async Task<IActionResult> AddEntryExit([FromBody] CreateEntryExitLogDto request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var studentId))
        {
            return Unauthorized();
        }

        try
        {
            var result = await service.AddEntryExitLogAsync(studentId, request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out userId);
    }
}
