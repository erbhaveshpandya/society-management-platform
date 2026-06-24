using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class User : INullableTenantEntity
{
    public int Id { get; set; }
    public int? SocietyId { get; set; } // null for SuperAdmin

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation
    public Society? Society { get; set; }
    public ResidentProfile? ResidentProfile { get; set; }
}
