using DormitoryManagementSystem.Application.Students.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/admin/students")]
[Authorize(Policy = "AdminOnly")]
public sealed class AdminStudentController(IStudentManagementService studentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await studentService.GetAllStudentsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await studentService.GetStudentByIdAsync(id, cancellationToken);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStudentDto request, CancellationToken cancellationToken)
    {
        try
        {
            var id = await studentService.CreateStudentAsync(request, cancellationToken);
            return Ok(new { Id = id });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStudentDto request, CancellationToken cancellationToken)
    {
        try
        {
            await studentService.UpdateStudentAsync(id, request, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken cancellationToken)
    {
        await studentService.ToggleStudentActiveAsync(id, cancellationToken);
        return Ok();
    }
}
