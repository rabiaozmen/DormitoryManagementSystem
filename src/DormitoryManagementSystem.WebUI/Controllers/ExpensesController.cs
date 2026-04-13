using DormitoryManagementSystem.Application.Finance.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/admin/expenses")]
[Authorize(Policy = "AdminOnly")]
public sealed class ExpensesController(IExpenseService expenseService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await expenseService.GetAllAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto request, CancellationToken cancellationToken)
    {
        var result = await expenseService.CreateAsync(request, cancellationToken);
        return Ok(result);
    }
}
