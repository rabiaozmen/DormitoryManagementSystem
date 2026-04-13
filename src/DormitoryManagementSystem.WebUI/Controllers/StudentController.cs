using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Policy = "StudentOnly")]
public sealed class StudentController : ControllerBase
{
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        return Ok(new { UserId = userId, Email = email, Role = "Student" });
    }

    [HttpGet("profile")]
    public IActionResult Profile()
    {
        return Ok(new
        {
            Message = "Student area is protected by StudentOnly policy."
        });
    }
}
