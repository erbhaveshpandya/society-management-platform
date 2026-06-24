using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Staff;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize]
public class StaffController : BaseApiController
{
    private readonly AppDbContext _context;
    public StaffController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StaffDto>>> GetAll()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        var today = DateTime.UtcNow.Date;

        var staffList = await _context.Staff
            .Where(s => s.SocietyId == societyId)
            .Include(s => s.AttendanceRecords)
            .Select(s => new StaffDto
            {
                Id = s.Id, SocietyId = s.SocietyId, Name = s.Name,
                Phone = s.Phone, Role = s.Role, IsActive = s.IsActive,
                IsCheckedIn = s.AttendanceRecords.Any(a => a.CheckInTime.Date == today && a.CheckOutTime == null),
                LastCheckIn = s.AttendanceRecords.OrderByDescending(a => a.CheckInTime).Select(a => (DateTime?)a.CheckInTime).FirstOrDefault(),
                LastCheckOut = s.AttendanceRecords.OrderByDescending(a => a.CheckInTime).Select(a => a.CheckOutTime).FirstOrDefault()
            })
            .ToListAsync();
        return Ok(staffList);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<StaffDto>> Create([FromBody] CreateStaffRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var staff = new Staff
        {
            SocietyId = societyId.Value, Name = request.Name,
            Phone = request.Phone, Role = request.Role, Address = request.Address
        };
        _context.Staff.Add(staff);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new StaffDto { Id = staff.Id, Name = staff.Name, Role = staff.Role });
    }

    [HttpPost("{id}/checkin")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<IActionResult> CheckIn(int id)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var staff = await _context.Staff.FirstOrDefaultAsync(s => s.Id == id && s.SocietyId == societyId);
        if (staff == null) return NotFound();

        var attendance = new StaffAttendance
        {
            StaffId = id, SocietyId = societyId.Value,
            CheckInTime = DateTime.UtcNow, MarkedBy = GetUserId()
        };
        _context.StaffAttendances.Add(attendance);
        await _context.SaveChangesAsync();
        return Ok(new StaffAttendanceDto { Id = attendance.Id, StaffId = id, StaffName = staff.Name, CheckInTime = attendance.CheckInTime });
    }

    [HttpPost("{id}/checkout")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<IActionResult> CheckOut(int id)
    {
        var societyId = GetSocietyId();
        var today = DateTime.UtcNow.Date;
        var attendance = await _context.StaffAttendances
            .FirstOrDefaultAsync(a => a.StaffId == id && a.SocietyId == societyId && a.CheckInTime.Date == today && a.CheckOutTime == null);

        if (attendance == null) return NotFound("No active check-in found");

        attendance.CheckOutTime = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Staff checked out", checkOutTime = attendance.CheckOutTime });
    }

    [HttpGet("attendance")]
    public async Task<ActionResult<IEnumerable<StaffAttendanceDto>>> GetAttendance([FromQuery] DateTime? date)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        var targetDate = date?.Date ?? DateTime.UtcNow.Date;

        var records = await _context.StaffAttendances
            .Where(a => a.SocietyId == societyId && a.CheckInTime.Date == targetDate)
            .Include(a => a.Staff)
            .Include(a => a.MarkedByUser)
            .Select(a => new StaffAttendanceDto
            {
                Id = a.Id, StaffId = a.StaffId, StaffName = a.Staff.Name,
                StaffRole = a.Staff.Role, CheckInTime = a.CheckInTime,
                CheckOutTime = a.CheckOutTime, MarkedByName = a.MarkedByUser.FullName
            })
            .ToListAsync();
        return Ok(records);
    }
}
