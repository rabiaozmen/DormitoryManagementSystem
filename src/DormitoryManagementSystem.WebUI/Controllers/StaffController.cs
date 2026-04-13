using DormitoryManagementSystem.Application.Allocations.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DormitoryManagementSystem.WebUI.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Policy = "StaffOnly")]
public sealed class StaffController(IAllocationService allocationService) : ControllerBase
{
    [HttpGet("allocations/rooms")]
    public async Task<IActionResult> GetRooms(CancellationToken cancellationToken)
    {
        var rooms = await allocationService.GetRoomsAsync(cancellationToken);
        return Ok(rooms);
    }

    [HttpGet("allocations/students/unassigned")]
    public async Task<IActionResult> GetUnassignedStudents(CancellationToken cancellationToken)
    {
        var students = await allocationService.GetUnassignedStudentsAsync(cancellationToken);
        return Ok(students);
    }

    [HttpPost("allocations/assign")]
    public async Task<IActionResult> AssignStudent([FromBody] AssignRequest request, CancellationToken cancellationToken)
    {
        await allocationService.AssignStudentToRoomAsync(request.StudentId, request.RoomId, cancellationToken);
        return Ok(new { Message = "Student assigned successfully" });
    }

    [HttpPost("allocations/remove")]
    public async Task<IActionResult> RemoveStudent([FromBody] RemoveRequest request, CancellationToken cancellationToken)
    {
        await allocationService.RemoveStudentFromRoomAsync(request.StudentId, cancellationToken);
        return Ok(new { Message = "Student removed successfully" });
    }
}

public class AssignRequest
{
    public Guid StudentId { get; set; }
    public int RoomId { get; set; }
}

public class RemoveRequest
{
    public Guid StudentId { get; set; }
}
