using System.Security.Claims;
using DormitoryManagementSystem.Application.Operations.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/staff/operations")]
[Authorize(Policy = "StaffOnly")]
public sealed class StaffOperationsController(ILeaveAndLogService service) : ControllerBase
{
    [HttpGet("leave-requests/pending")]
    public async Task<IActionResult> PendingLeaveRequests(CancellationToken cancellationToken)
    {
        var result = await service.GetPendingLeaveRequestsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("leave-requests/review")]
    public async Task<IActionResult> ReviewLeave([FromBody] ReviewLeaveRequestDto request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var staffId))
        {
            return Unauthorized();
        }

        var result = await service.ReviewLeaveRequestAsync(staffId, request, cancellationToken);
        if (result is null)
        {
            return BadRequest(new { Message = "Request not found or already reviewed." });
        }

        return Ok(result);
    }

    [HttpGet("entry-exit-logs")]
    public async Task<IActionResult> EntryExitLogs([FromQuery] int take = 100, CancellationToken cancellationToken = default)
    {
        var result = await service.GetRecentEntryExitLogsAsync(take, cancellationToken);
        return Ok(result);
    }

    private bool TryGetUserId(out Guid userId)
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(raw, out userId);
    }
}
