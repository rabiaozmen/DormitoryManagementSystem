using DormitoryManagementSystem.Application.Departments.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/departments")]
public sealed class DepartmentController(IDepartmentService departmentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await departmentService.GetAllDepartmentsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request, CancellationToken cancellationToken)
    {
        var id = await departmentService.CreateDepartmentAsync(request.Name, request.Code, cancellationToken);
        return Ok(new { Id = id });
    }
}

public class CreateDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
}
