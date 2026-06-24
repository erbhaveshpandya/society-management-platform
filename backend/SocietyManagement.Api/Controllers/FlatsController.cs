using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Flat;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/flats")]
[Authorize]
public class FlatsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLog;

    public FlatsController(AppDbContext context, IAuditLogService auditLog)
    {
        _context = context;
        _auditLog = auditLog;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FlatDto>>> GetAll()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var flats = await _context.Flats
            .Where(f => f.SocietyId == societyId)
            .Include(f => f.Building)
            .Include(f => f.Owner)
            .Include(f => f.Residents).ThenInclude(r => r.User)
            .Include(f => f.Residents).ThenInclude(r => r.Vehicles)
            .Select(f => new FlatDto
            {
                Id = f.Id, SocietyId = f.SocietyId, BuildingId = f.BuildingId,
                BuildingName = f.Building.Name, FlatNumber = f.FlatNumber,
                Floor = f.Floor, Type = f.Type, Area = f.Area,
                OwnerId = f.OwnerId, OwnerName = f.Owner != null ? f.Owner.FullName : null,
                IsOccupied = f.IsOccupied,
                Residents = f.Residents.Where(r => r.IsActive).Select(r => new ResidentDto
                {
                    Id = r.Id, UserId = r.UserId, FullName = r.User.FullName,
                    Email = r.User.Email, Phone = r.User.Phone,
                    ResidentType = r.ResidentType, MoveInDate = r.MoveInDate,
                    Vehicles = r.Vehicles.Select(v => new VehicleDto
                    {
                        Id = v.Id, VehicleNumber = v.VehicleNumber,
                        Type = v.Type, Make = v.Make, Model = v.Model
                    }).ToList()
                }).ToList()
            })
            .ToListAsync();
        return Ok(flats);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<FlatDto>> Create([FromBody] CreateFlatRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var flat = new Flat
        {
            SocietyId = societyId.Value, BuildingId = request.BuildingId,
            FlatNumber = request.FlatNumber, Floor = request.Floor,
            Type = request.Type, Area = request.Area
        };
        _context.Flats.Add(flat);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new FlatDto { Id = flat.Id, FlatNumber = flat.FlatNumber, BuildingId = flat.BuildingId, Floor = flat.Floor, Type = flat.Type, Area = flat.Area, SocietyId = flat.SocietyId });
    }

    [HttpPost("{flatId}/residents")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> AssignResident(int flatId, [FromBody] AssignResidentRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var flat = await _context.Flats.FirstOrDefaultAsync(f => f.Id == flatId && f.SocietyId == societyId);
        if (flat == null) return NotFound("Flat not found");

        var profile = new ResidentProfile
        {
            SocietyId = societyId.Value, UserId = request.UserId,
            FlatId = flatId, ResidentType = request.ResidentType,
            MoveInDate = request.MoveInDate ?? DateTime.UtcNow
        };
        _context.ResidentProfiles.Add(profile);
        flat.IsOccupied = true;
        if (request.ResidentType == "Owner") flat.OwnerId = request.UserId;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Resident assigned successfully" });
    }

    [HttpPost("vehicles")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin,Resident")]
    public async Task<IActionResult> AddVehicle([FromBody] CreateVehicleRequest request)
    {
        var userId = GetUserId();
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var profile = await _context.ResidentProfiles.FirstOrDefaultAsync(r => r.UserId == userId && r.SocietyId == societyId);
        if (profile == null) return BadRequest("Resident profile not found");

        var vehicle = new Vehicle
        {
            SocietyId = societyId.Value, ResidentProfileId = profile.Id,
            VehicleNumber = request.VehicleNumber, Type = request.Type,
            Make = request.Make, Model = request.Model
        };
        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();
        return Ok(new VehicleDto { Id = vehicle.Id, VehicleNumber = vehicle.VehicleNumber, Type = vehicle.Type, Make = vehicle.Make, Model = vehicle.Model });
    }

    [HttpDelete("vehicles/{id}")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin,Resident")]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return NotFound();
        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
