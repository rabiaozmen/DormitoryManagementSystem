using DormitoryManagementSystem.Application.Staff.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/admin/staff")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminStaffController(IStaffDirectoryService staffDirectoryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await staffDirectoryService.GetAllAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut("{staffId:guid}/monthly-salary")]
    public async Task<IActionResult> UpdateMonthlySalary(Guid staffId, [FromBody] UpdateMonthlySalaryRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await staffDirectoryService.UpdateMonthlySalaryAsync(staffId, request.MonthlySalary, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}

public sealed class UpdateMonthlySalaryRequest
{
    public decimal MonthlySalary { get; set; }
}