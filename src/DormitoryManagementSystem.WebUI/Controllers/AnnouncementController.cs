using DormitoryManagementSystem.Application.Announcements.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/announcements")]
public sealed class AnnouncementController(IAnnouncementService announcementService) : ControllerBase
{
    private string GetCurrentRole()
    {
        return User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role")
            ?? "All";
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetActiveAnnouncements(CancellationToken cancellationToken)
    {
        var role = GetCurrentRole();
        var announcements = await announcementService.GetActiveAnnouncementsAsync(role, cancellationToken);
        return Ok(announcements);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDto request, CancellationToken cancellationToken)
    {
        var role = GetCurrentRole();
        if (role != "Admin" && role != "Staff") return Forbid();

        var id = await announcementService.CreateAnnouncementAsync(request, cancellationToken);
        return Ok(new { Id = id, Message = "Announcement created successfully." });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeactivateAnnouncement(int id, CancellationToken cancellationToken)
    {
        var role = GetCurrentRole();
        if (role != "Admin" && role != "Staff") return Forbid();

        await announcementService.DeactivateAnnouncementAsync(id, cancellationToken);
        return Ok(new { Message = "Announcement deactivated." });
    }
}
