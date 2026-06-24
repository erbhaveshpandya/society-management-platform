using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : BaseApiController
{
    private readonly AppDbContext _context;
    public UsersController(AppDbContext context) => _context = context;

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> GetAll()
    {
        var societyId = GetSocietyId();
        var role = User.FindFirst(ClaimTypes.Role)!.Value;

        var query = _context.Users.AsQueryable();
        if (role != "SuperAdmin" && societyId != null)
            query = query.Where(u => u.SocietyId == societyId);

        var users = await query.Select(u => new
        {
            u.Id, u.FullName, u.Email, u.Phone,
            Role = u.Role.ToString(), u.SocietyId, u.IsActive, u.CreatedAt
        }).ToListAsync();
        return Ok(users);
    }

    [HttpGet("residents")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> GetResidents()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var residents = await _context.Users
            .Where(u => u.SocietyId == societyId && u.Role == UserRole.Resident)
            .Select(u => new { u.Id, u.FullName, u.Email, u.Phone })
            .ToListAsync();
        return Ok(residents);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var currentRole = GetRole();
        var currentSocietyId = GetSocietyId();

        // Validate role assignment permissions
        if (!Enum.TryParse<UserRole>(request.Role, true, out var userRole))
            return BadRequest("Invalid role specified");

        // SocietyAdmin can only create Resident or SecurityGuard within their own society
        if (currentRole == "SocietyAdmin")
        {
            if (userRole != UserRole.Resident && userRole != UserRole.SecurityGuard)
                return Forbid();

            if (request.SocietyId != null && request.SocietyId != currentSocietyId)
                return Forbid();

            request.SocietyId = currentSocietyId;
        }

        // SuperAdmin can create any role for any society
        if (currentRole == "SuperAdmin" && userRole != UserRole.SuperAdmin && request.SocietyId == null)
            return BadRequest("SocietyId is required for non-SuperAdmin users");

        // Check for duplicate email
        var emailExists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Email == request.Email);
        if (emailExists)
            return BadRequest("A user with this email already exists");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone ?? "",
            PasswordHash = BCryptHash(request.Password),
            Role = userRole,
            SocietyId = userRole == UserRole.SuperAdmin ? null : request.SocietyId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new
        {
            user.Id,
            user.FullName,
            user.Email,
            Role = user.Role.ToString(),
            user.SocietyId,
            user.IsActive,
            user.CreatedAt
        });
    }

    [HttpPut("{id}/toggle-active")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var currentRole = GetRole();
        var currentSocietyId = GetSocietyId();

        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound();

        // SocietyAdmin can only toggle users in their own society
        if (currentRole == "SocietyAdmin" && user.SocietyId != currentSocietyId)
            return Forbid();

        // Cannot deactivate SuperAdmin
        if (user.Role == UserRole.SuperAdmin)
            return BadRequest("Cannot deactivate SuperAdmin users");

        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"User {(user.IsActive ? "activated" : "deactivated")}", user.Id, user.IsActive });
    }

    private static string BCryptHash(string password)
    {
        using var hmac = new System.Security.Cryptography.HMACSHA256(
            System.Text.Encoding.UTF8.GetBytes("SocietyManagementPlatformSecretKey2026!"));
        var hash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hash);
    }
}

public class CreateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? SocietyId { get; set; }
}
