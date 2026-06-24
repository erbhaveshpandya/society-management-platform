using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SocietyManagement.Application.DTOs.Auth;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Society)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        var inputHash = BCryptHash(request.Password);
        if (user.PasswordHash != inputHash)
        {
            throw new UnauthorizedAccessException("Invalid credentials");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var expiryMinutes = double.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "480");
        var expiration = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var roleString = user.Role.ToString();
        var permissions = GetPermissionsForRole(roleString);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new("userId", user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, roleString),
            new("role", roleString),
            new("permissions", string.Join(",", permissions))
        };

        if (user.SocietyId.HasValue)
        {
            claims.Add(new Claim("SocietyId", user.SocietyId.Value.ToString()));
            claims.Add(new Claim("societyId", user.SocietyId.Value.ToString()));
        }

        if (user.Society != null)
        {
            claims.Add(new Claim("societyName", user.Society.Name));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return new LoginResponse
        {
            Token = tokenString,
            FullName = user.FullName,
            Email = user.Email,
            Role = roleString,
            UserId = user.Id,
            SocietyId = user.SocietyId,
            SocietyName = user.Society?.Name,
            Expiration = expiration,
            Permissions = permissions
        };
    }

    private static List<string> GetPermissionsForRole(string role)
    {
        return role switch
        {
            "SuperAdmin" => new List<string> { "manage_societies", "view_all" },
            "SocietyAdmin" => new List<string> { "manage_flats", "manage_maintenance", "manage_complaints", "manage_notices", "manage_polls", "manage_amenities", "manage_staff", "manage_visitors" },
            "Resident" => new List<string> { "view_dashboard", "pay_dues", "view_notices", "vote_polls", "book_amenities", "view_visitors" },
            "SecurityGuard" => new List<string> { "manage_visitors", "mark_attendance", "view_visitors" },
            _ => new List<string>()
        };
    }

    private static string BCryptHash(string password)
    {
        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes("SocietyManagementPlatformSecretKey2026!"));
        var hash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hash);
    }
}
