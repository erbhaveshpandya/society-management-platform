using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Visitor;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class VisitorsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditLogService _auditLog;

    public VisitorsController(AppDbContext context, INotificationService notificationService, IAuditLogService auditLog)
    {
        _context = context;
        _notificationService = notificationService;
        _auditLog = auditLog;
    }

    [HttpGet("visitors")]
    public async Task<ActionResult<IEnumerable<VisitorLogDto>>> GetVisitors([FromQuery] bool? activeOnly)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var query = _context.VisitorLogs
            .Where(v => v.SocietyId == societyId)
            .Include(v => v.Flat)
            .Include(v => v.CheckedInByUser)
            .AsQueryable();

        if (activeOnly == true)
            query = query.Where(v => v.IsActive);

        var visitors = await query.OrderByDescending(v => v.EntryTime)
            .Select(v => new VisitorLogDto
            {
                Id = v.Id, SocietyId = v.SocietyId, VisitorName = v.VisitorName,
                Phone = v.Phone, VehicleNumber = v.VehicleNumber,
                FlatId = v.FlatId, FlatNumber = v.Flat.FlatNumber,
                Purpose = v.Purpose, EntryTime = v.EntryTime,
                ExitTime = v.ExitTime, IsActive = v.IsActive,
                CheckedInByName = v.CheckedInByUser.FullName
            })
            .ToListAsync();
        return Ok(visitors);
    }

    [HttpPost("visitors")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<ActionResult<VisitorLogDto>> CreateVisitor([FromBody] CreateVisitorRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var visitor = new VisitorLog
        {
            SocietyId = societyId.Value, VisitorName = request.VisitorName,
            Phone = request.Phone, VehicleNumber = request.VehicleNumber,
            FlatId = request.FlatId, Purpose = request.Purpose,
            CheckedInBy = GetUserId()
        };
        _context.VisitorLogs.Add(visitor);
        await _context.SaveChangesAsync();

        // Notify flat owner
        var flat = await _context.Flats.FirstOrDefaultAsync(f => f.Id == request.FlatId);
        if (flat?.OwnerId != null)
        {
            await _notificationService.CreateNotificationAsync(societyId.Value, flat.OwnerId, "Visitor Arrived", $"Visitor {request.VisitorName} has arrived for flat {flat.FlatNumber}.", "Visitor");
        }

        await _auditLog.LogAsync(societyId, GetUserId(), "VisitorCheckedIn", "VisitorLog", visitor.Id, $"Visitor {request.VisitorName} checked in");

        return CreatedAtAction(nameof(GetVisitors), new VisitorLogDto { Id = visitor.Id, VisitorName = visitor.VisitorName, EntryTime = visitor.EntryTime });
    }

    [HttpPost("visitors/{id}/checkout")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<IActionResult> CheckoutVisitor(int id)
    {
        var societyId = GetSocietyId();
        var visitor = await _context.VisitorLogs.FirstOrDefaultAsync(v => v.Id == id && v.SocietyId == societyId);
        if (visitor == null) return NotFound();

        visitor.ExitTime = DateTime.UtcNow;
        visitor.IsActive = false;
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(societyId, GetUserId(), "VisitorCheckedOut", "VisitorLog", id, $"Visitor {visitor.VisitorName} checked out");

        return Ok(new { message = "Visitor checked out", exitTime = visitor.ExitTime });
    }

    // --- Parking Alerts ---
    [HttpGet("parking-alerts")]
    public async Task<ActionResult<IEnumerable<ParkingAlertDto>>> GetParkingAlerts()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var alerts = await _context.ParkingAlerts
            .Where(p => p.SocietyId == societyId)
            .Include(p => p.ReportedByUser)
            .OrderByDescending(p => p.ReportedAt)
            .Select(p => new ParkingAlertDto
            {
                Id = p.Id, VehicleNumber = p.VehicleNumber, Location = p.Location,
                Description = p.Description, ReportedByName = p.ReportedByUser.FullName,
                ReportedAt = p.ReportedAt, IsResolved = p.IsResolved
            })
            .ToListAsync();
        return Ok(alerts);
    }

    [HttpPost("parking-alerts")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<ActionResult<ParkingAlertDto>> CreateParkingAlert([FromBody] CreateParkingAlertRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var alert = new ParkingAlert
        {
            SocietyId = societyId.Value, VehicleNumber = request.VehicleNumber,
            Location = request.Location, Description = request.Description,
            ReportedBy = GetUserId()
        };
        _context.ParkingAlerts.Add(alert);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetParkingAlerts), new ParkingAlertDto { Id = alert.Id, VehicleNumber = alert.VehicleNumber });
    }

    [HttpPost("parking-alerts/{id}/resolve")]
    [Authorize(Roles = "SecurityGuard,SocietyAdmin")]
    public async Task<IActionResult> ResolveParkingAlert(int id)
    {
        var societyId = GetSocietyId();
        var alert = await _context.ParkingAlerts.FirstOrDefaultAsync(p => p.Id == id && p.SocietyId == societyId);
        if (alert == null) return NotFound();
        alert.IsResolved = true;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Alert resolved" });
    }

    // --- Emergency Alerts ---
    [HttpGet("emergency-alerts")]
    public async Task<ActionResult<IEnumerable<EmergencyAlertDto>>> GetEmergencyAlerts()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var alerts = await _context.EmergencyAlerts
            .Where(e => e.SocietyId == societyId)
            .Include(e => e.ReportedByUser)
            .OrderByDescending(e => e.ReportedAt)
            .Select(e => new EmergencyAlertDto
            {
                Id = e.Id, Type = e.Type.ToString(), Description = e.Description,
                ReportedByName = e.ReportedByUser.FullName,
                ReportedAt = e.ReportedAt, IsResolved = e.IsResolved
            })
            .ToListAsync();
        return Ok(alerts);
    }

    [HttpPost("emergency-alerts")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<ActionResult<EmergencyAlertDto>> CreateEmergencyAlert([FromBody] CreateEmergencyAlertRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        if (!Enum.TryParse<EmergencyType>(request.Type, true, out var emergencyType))
            return BadRequest("Invalid emergency type");

        var alert = new EmergencyAlert
        {
            SocietyId = societyId.Value, Type = emergencyType,
            Description = request.Description, ReportedBy = GetUserId()
        };
        _context.EmergencyAlerts.Add(alert);
        await _context.SaveChangesAsync();

        // Notify all users in society
        await _notificationService.CreateNotificationAsync(societyId.Value, null, $"🚨 Emergency: {request.Type}", request.Description, "Emergency");

        return CreatedAtAction(nameof(GetEmergencyAlerts), new EmergencyAlertDto { Id = alert.Id, Type = alert.Type.ToString() });
    }
}
