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
                .ThenInclude(u => u.ResidentProfile)
                    .ThenInclude(rp => rp.Flat)
                        .ThenInclude(f => f.Building)
            .OrderByDescending(e => e.ReportedAt)
            .Select(e => new EmergencyAlertDto
            {
                Id = e.Id, Type = e.Type.ToString(), Description = e.Description,
                ReportedByName = e.ReportedByUser.FullName,
                ReportedByRole = e.ReportedByUser.Role.ToString(),
                FlatNumber = (e.ReportedByUser.ResidentProfile != null && e.ReportedByUser.ResidentProfile.Flat != null) ? e.ReportedByUser.ResidentProfile.Flat.FlatNumber : string.Empty,
                BuildingName = (e.ReportedByUser.ResidentProfile != null && e.ReportedByUser.ResidentProfile.Flat != null && e.ReportedByUser.ResidentProfile.Flat.Building != null) ? e.ReportedByUser.ResidentProfile.Flat.Building.Name : string.Empty,
                ReportedAt = e.ReportedAt, IsResolved = e.IsResolved
            })
            .ToListAsync();
        return Ok(alerts);
    }

    [HttpPost("emergency-alerts")]
    [Authorize(Roles = "SocietyAdmin,SecurityGuard,Resident")]
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

    [HttpPost("emergency-alerts/{id}/resolve")]
    [Authorize(Roles = "SocietyAdmin,SecurityGuard")]
    public async Task<IActionResult> ResolveEmergencyAlert(int id)
    {
        var societyId = GetSocietyId();
        var alert = await _context.EmergencyAlerts.FirstOrDefaultAsync(e => e.Id == id && e.SocietyId == societyId);
        if (alert == null) return NotFound();
        
        alert.IsResolved = true;
        await _context.SaveChangesAsync();
        
        await _auditLog.LogAsync(societyId, GetUserId(), "EmergencyAlertResolved", "EmergencyAlert", id, $"Emergency Alert {alert.Type} (ID: {id}) was resolved");
        return Ok(new { message = "Emergency alert resolved successfully" });
    }

    // --- Visitor Passes (Pre-Registration) ---

    [HttpGet("visitors/pre-registered")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin,Resident")]
    public async Task<ActionResult<IEnumerable<VisitorPassDto>>> GetPreRegisteredPasses()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        var role = User.FindFirst(ClaimTypes.Role)!.Value;
        var userId = GetUserId();

        var query = _context.VisitorPasses
            .Where(p => p.SocietyId == societyId && !p.IsUsed && !p.IsRevoked)
            .Include(p => p.Flat)
            .AsQueryable();

        if (role == "Resident")
        {
            var profile = await _context.ResidentProfiles.FirstOrDefaultAsync(r => r.UserId == userId && r.SocietyId == societyId);
            if (profile != null)
            {
                query = query.Where(p => p.FlatId == profile.FlatId);
            }
            else
            {
                return Ok(Enumerable.Empty<VisitorPassDto>());
            }
        }

        var passes = await query.OrderByDescending(p => p.ExpectedDate)
            .Select(p => new VisitorPassDto
            {
                Id = p.Id, SocietyId = p.SocietyId, VisitorName = p.VisitorName,
                Phone = p.Phone, VehicleNumber = p.VehicleNumber,
                FlatId = p.FlatId, FlatNumber = p.Flat.FlatNumber,
                Purpose = p.Purpose, ExpectedDate = p.ExpectedDate,
                Passcode = p.Passcode, IsUsed = p.IsUsed,
                IsRevoked = p.IsRevoked, CreatedAt = p.CreatedAt
            })
            .ToListAsync();
        return Ok(passes);
    }

    [HttpPost("visitors/pre-register")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin,Resident")]
    public async Task<ActionResult<VisitorPassDto>> PreRegisterVisitor([FromBody] PreRegisterVisitorRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var passcode = $"INV-{new Random().Next(100000, 999999)}";
        while (await _context.VisitorPasses.AnyAsync(p => p.Passcode == passcode))
        {
            passcode = $"INV-{new Random().Next(100000, 999999)}";
        }

        var pass = new VisitorPass
        {
            SocietyId = societyId.Value, VisitorName = request.VisitorName,
            Phone = request.Phone, VehicleNumber = request.VehicleNumber,
            FlatId = request.FlatId, Purpose = request.Purpose,
            ExpectedDate = request.ExpectedDate, Passcode = passcode,
            IsUsed = false, IsRevoked = false, CreatedAt = DateTime.UtcNow
        };
        _context.VisitorPasses.Add(pass);
        await _context.SaveChangesAsync();

        var flat = await _context.Flats.FirstOrDefaultAsync(f => f.Id == request.FlatId);
        await _auditLog.LogAsync(societyId, GetUserId(), "VisitorPreRegistered", "VisitorPass", pass.Id, $"Pass generated for guest {pass.VisitorName} visiting Flat {flat?.FlatNumber ?? "N/A"}");

        return Ok(new VisitorPassDto
        {
            Id = pass.Id, SocietyId = pass.SocietyId, VisitorName = pass.VisitorName,
            Phone = pass.Phone, VehicleNumber = pass.VehicleNumber,
            FlatId = pass.FlatId, FlatNumber = flat?.FlatNumber ?? "N/A",
            Purpose = pass.Purpose, ExpectedDate = pass.ExpectedDate,
            Passcode = pass.Passcode, IsUsed = pass.IsUsed,
            IsRevoked = pass.IsRevoked, CreatedAt = pass.CreatedAt
        });
    }

    [HttpDelete("visitors/pre-registered/{id}")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin,Resident")]
    public async Task<IActionResult> RevokePreRegisteredPass(int id)
    {
        var societyId = GetSocietyId();
        var pass = await _context.VisitorPasses.FirstOrDefaultAsync(p => p.Id == id && p.SocietyId == societyId);
        if (pass == null) return NotFound("Pass not found");

        if (pass.IsUsed) return BadRequest("Pass has already been used");
        if (pass.IsRevoked) return BadRequest("Pass has already been revoked");

        pass.IsRevoked = true;
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(societyId, GetUserId(), "VisitorPassRevoked", "VisitorPass", id, $"Pass revoked for guest {pass.VisitorName}");
        return Ok(new { message = "Visitor invitation pass revoked successfully" });
    }

    [HttpPost("visitors/verify-pass")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<ActionResult<VisitorLogDto>> VerifyAndCheckInPass([FromBody] VerifyPasscodeRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var pass = await _context.VisitorPasses
            .Include(p => p.Flat)
            .FirstOrDefaultAsync(p => p.Passcode == request.Passcode && p.SocietyId == societyId);

        if (pass == null) return NotFound(new { message = "Invalid passcode. Pass not found." });
        if (pass.IsUsed) return BadRequest(new { message = "This gate pass has already been used." });
        if (pass.IsRevoked) return BadRequest(new { message = "This gate pass has been revoked by the resident." });

        var visitor = new VisitorLog
        {
            SocietyId = societyId.Value, VisitorName = pass.VisitorName,
            Phone = pass.Phone, VehicleNumber = pass.VehicleNumber ?? string.Empty,
            FlatId = pass.FlatId, Purpose = $"{pass.Purpose} (Pass: {pass.Passcode})",
            CheckedInBy = GetUserId(), EntryTime = DateTime.UtcNow,
            IsActive = true
        };
        _context.VisitorLogs.Add(visitor);
        pass.IsUsed = true;
        await _context.SaveChangesAsync();

        if (pass.Flat?.OwnerId != null)
        {
            await _notificationService.CreateNotificationAsync(societyId.Value, pass.Flat.OwnerId.Value, "Visitor Checked In (Pass)", $"Guest {pass.VisitorName} has checked in using gate pass {pass.Passcode}.", "Visitor");
        }

        var guardUser = await _context.Users.FindAsync(GetUserId());
        var guardName = guardUser?.FullName ?? "Security Guard";

        await _auditLog.LogAsync(societyId, GetUserId(), "VisitorCheckedInViaPass", "VisitorLog", visitor.Id, $"Visitor {pass.VisitorName} checked in using passcode {pass.Passcode}");

        return Ok(new VisitorLogDto
        {
            Id = visitor.Id, SocietyId = visitor.SocietyId, VisitorName = visitor.VisitorName,
            Phone = visitor.Phone, VehicleNumber = visitor.VehicleNumber,
            FlatId = visitor.FlatId, FlatNumber = pass.Flat != null ? pass.Flat.FlatNumber : string.Empty,
            Purpose = visitor.Purpose, EntryTime = visitor.EntryTime,
            IsActive = visitor.IsActive, CheckedInByName = guardName
        });
    }
}

