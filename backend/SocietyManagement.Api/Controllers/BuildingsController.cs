using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Building;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/buildings")]
[Authorize]
public class BuildingsController : BaseApiController
{
    private readonly AppDbContext _context;
    public BuildingsController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BuildingDto>>> GetAll()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var buildings = await _context.Buildings
            .Where(b => b.SocietyId == societyId)
            .Select(b => new BuildingDto
            {
                Id = b.Id, SocietyId = b.SocietyId, Name = b.Name,
                TotalFloors = b.TotalFloors, Description = b.Description,
                TotalFlats = b.Flats.Count
            })
            .ToListAsync();
        return Ok(buildings);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<BuildingDto>> Create([FromBody] CreateBuildingRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var building = new Domain.Entities.Building
        {
            SocietyId = societyId.Value,
            Name = request.Name,
            TotalFloors = request.TotalFloors,
            Description = request.Description
        };
        _context.Buildings.Add(building);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new BuildingDto { Id = building.Id, SocietyId = building.SocietyId, Name = building.Name, TotalFloors = building.TotalFloors, Description = building.Description });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var societyId = GetSocietyId();
        var building = await _context.Buildings.FirstOrDefaultAsync(b => b.Id == id && b.SocietyId == societyId);
        if (building == null) return NotFound();

        _context.Buildings.Remove(building);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
