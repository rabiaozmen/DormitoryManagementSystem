using DormitoryManagementSystem.Application.Dining.Interfaces;
using DormitoryManagementSystem.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/dining")]
public sealed class DiningController(IDiningService diningService) : ControllerBase
{
    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeekly([FromQuery] DateTime startDate, CancellationToken cancellationToken)
    {
        var result = await diningService.GetWeeklyMenuAsync(startDate, cancellationToken);
        return Ok(result);
    }

    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthly([FromQuery] DateTime monthStart, CancellationToken cancellationToken)
    {
        var result = await diningService.GetMonthlyMenuAsync(monthStart, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Upsert([FromBody] DiningMenu menu, CancellationToken cancellationToken)
    {
        var result = await diningService.UpsertMenuAsync(menu, cancellationToken);
        return Ok(result);
    }
}
