using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Society;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/societies")]
[Authorize]
public class SocietiesController : BaseApiController
{
    private readonly AppDbContext _context;

    public SocietiesController(AppDbContext context) => _context = context;

    [HttpGet]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<IEnumerable<SocietyDto>>> GetAll()
    {
        var societies = await _context.Societies
            .Select(s => new SocietyDto
            {
                Id = s.Id, Name = s.Name, Address = s.Address, City = s.City,
                State = s.State, PinCode = s.PinCode, RegistrationNumber = s.RegistrationNumber,
                ContactPhone = s.ContactPhone, ContactEmail = s.ContactEmail,
                IsActive = s.IsActive, CreatedAt = s.CreatedAt,
                TotalBuildings = s.Buildings.Count,
                TotalFlats = s.Flats.Count,
                TotalResidents = s.Users.Count(u => u.Role == Domain.Enums.UserRole.Resident)
            })
            .ToListAsync();
        return Ok(societies);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SocietyDto>> GetById(int id)
    {
        var role = GetRole();
        var societyId = GetSocietyId();

        if (role != "SuperAdmin" && societyId != id)
            return Forbid();

        var society = await _context.Societies
            .Where(s => s.Id == id)
            .Select(s => new SocietyDto
            {
                Id = s.Id, Name = s.Name, Address = s.Address, City = s.City,
                State = s.State, PinCode = s.PinCode, RegistrationNumber = s.RegistrationNumber,
                ContactPhone = s.ContactPhone, ContactEmail = s.ContactEmail,
                IsActive = s.IsActive, CreatedAt = s.CreatedAt,
                TotalBuildings = s.Buildings.Count,
                TotalFlats = s.Flats.Count,
                TotalResidents = s.Users.Count(u => u.Role == Domain.Enums.UserRole.Resident)
            })
            .FirstOrDefaultAsync();

        return society == null ? NotFound() : Ok(society);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<ActionResult<SocietyDto>> Create([FromBody] CreateSocietyRequest request)
    {
        var society = new Domain.Entities.Society
        {
            Name = request.Name, Address = request.Address, City = request.City,
            State = request.State, PinCode = request.PinCode,
            RegistrationNumber = request.RegistrationNumber,
            ContactPhone = request.ContactPhone, ContactEmail = request.ContactEmail
        };
        _context.Societies.Add(society);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = society.Id },
            new SocietyDto { Id = society.Id, Name = society.Name, Address = society.Address, City = society.City, State = society.State, PinCode = society.PinCode, RegistrationNumber = society.RegistrationNumber, ContactPhone = society.ContactPhone, ContactEmail = society.ContactEmail, IsActive = society.IsActive, CreatedAt = society.CreatedAt });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSocietyRequest request)
    {
        var role = GetRole();
        var societyId = GetSocietyId();

        if (role != "SuperAdmin" && societyId != id)
            return Forbid();

        var society = await _context.Societies.FirstOrDefaultAsync(s => s.Id == id);
        if (society == null) return NotFound();

        society.Name = request.Name;
        society.Address = request.Address;
        society.City = request.City;
        society.State = request.State;
        society.PinCode = request.PinCode;
        society.ContactPhone = request.ContactPhone;
        society.ContactEmail = request.ContactEmail;
        if (role == "SuperAdmin" && request.IsActive.HasValue)
        {
            society.IsActive = request.IsActive.Value;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Society updated successfully", id = society.Id });
    }
}

public class UpdateSocietyRequest
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public bool? IsActive { get; set; }
}
