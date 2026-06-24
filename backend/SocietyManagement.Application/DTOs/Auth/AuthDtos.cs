using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Auth;

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int? SocietyId { get; set; }
    public string? SocietyName { get; set; }
    public DateTime Expiration { get; set; }
    public List<string> Permissions { get; set; } = new();
}
