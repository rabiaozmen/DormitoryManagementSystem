using DormitoryManagementSystem.Application.Maintenance.Interfaces;
using DormitoryManagementSystem.Application.Maintenance.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/maintenance")]
public sealed class MaintenanceController(IMaintenanceService maintenanceService) : ControllerBase
{
    [HttpGet("tickets")]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> Tickets(CancellationToken cancellationToken)
    {
        var result = await maintenanceService.GetTicketsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "StudentOnly")]
    public async Task<IActionResult> Create([FromBody] CreateMaintenanceRequest request, CancellationToken cancellationToken)
    {
        var result = await maintenanceService.CreateAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("status")]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateMaintenanceStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await maintenanceService.UpdateStatusAsync(request, cancellationToken);
        return result is null ? BadRequest("Invalid status transition or request not found.") : Ok(result);
    }

    [HttpGet("open")]
    [Authorize(Policy = "StaffOnly")]
    public async Task<IActionResult> Open(CancellationToken cancellationToken)
    {
        var result = await maintenanceService.GetOpenRequestsAsync(cancellationToken);
        return Ok(result);
    }
}
