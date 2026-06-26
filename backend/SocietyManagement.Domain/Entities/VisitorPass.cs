using System;
using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class VisitorPass : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }

    [Required, MaxLength(100)]
    public string VisitorName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? VehicleNumber { get; set; }

    public int FlatId { get; set; }

    [Required, MaxLength(200)]
    public string Purpose { get; set; } = string.Empty;

    public DateTime ExpectedDate { get; set; }

    [Required, MaxLength(20)]
    public string Passcode { get; set; } = string.Empty;

    public bool IsUsed { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Society Society { get; set; } = null!;
    public Flat Flat { get; set; } = null!;
}
