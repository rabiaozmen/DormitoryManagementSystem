using DormitoryManagementSystem.Application.Allocations.Interfaces;
using DormitoryManagementSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Allocations;

public sealed class AllocationService(DmsDbContext dbContext) : IAllocationService
{
    public async Task<IEnumerable<RoomDto>> GetRoomsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Rooms
            .Include(r => r.Building)
            .Include(r => r.Students)
            .OrderBy(r => r.RoomNumber)
            .Select(r => new RoomDto
            {
                Id = r.Id,
                RoomNumber = r.RoomNumber,
                BuildingName = r.Building != null ? r.Building.Name : "Unknown",
                BuildingZone = r.RoomNumber.StartsWith("A-") ? "North" :
                               r.RoomNumber.StartsWith("B-") ? "East" :
                               r.RoomNumber.StartsWith("C-") ? "South" :
                               r.RoomNumber.StartsWith("D-") ? "West" : "Central",
                Capacity = r.Capacity,
                Occupancy = r.Occupancy,
                GenderPolicy = r.GenderPolicy,
                MonthlyRate = r.MonthlyRate,
                CurrentStudents = r.Students.Select(s => new StudentSimpleDto
                {
                    Id = s.Id,
                    FullName = $"{s.FirstName} {s.LastName}"
                })
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<StudentDto>> GetUnassignedStudentsAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Students
            .Where(s => s.RoomId == 0)
            .OrderBy(s => s.FirstName)
            .Select(s => new StudentDto
            {
                Id = s.Id,
                FullName = $"{s.FirstName} {s.LastName}",
                StudentNumber = s.StudentNumber
            })
            .ToListAsync(cancellationToken);
    }

    public async Task AssignStudentToRoomAsync(Guid studentId, int roomId, CancellationToken cancellationToken = default)
    {
        var student = await dbContext.Students.FindAsync(new object[] { studentId }, cancellationToken);
        if (student == null) throw new Exception("Student not found");

        var room = await dbContext.Rooms.FindAsync(new object[] { roomId }, cancellationToken);
        if (room == null) throw new Exception("Room not found");

        if (room.Occupancy >= room.Capacity)
            throw new Exception("Room is already at full capacity");

        if (student.RoomId != 0 && student.RoomId != roomId)
        {
            // If dragging from another room, remove from old room
            var oldRoom = await dbContext.Rooms.FindAsync(new object[] { student.RoomId }, cancellationToken);
            if (oldRoom != null) oldRoom.Occupancy--;
        }

        if (student.RoomId != roomId)
        {
            student.RoomId = roomId;
            room.Occupancy++;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task RemoveStudentFromRoomAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var student = await dbContext.Students.FindAsync(new object[] { studentId }, cancellationToken);
        if (student == null || student.RoomId == 0) return;

        var room = await dbContext.Rooms.FindAsync(new object[] { student.RoomId }, cancellationToken);
        if (room != null)
        {
            room.Occupancy--;
        }
        
        student.RoomId = 0;
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
