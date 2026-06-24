using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Vehicle : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int ResidentProfileId { get; set; }

    [Required, MaxLength(20)]
    public string VehicleNumber { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Type { get; set; } = string.Empty; // Car, Bike, Scooter

    [MaxLength(50)]
    public string Make { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Model { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ResidentProfile ResidentProfile { get; set; } = null!;
}
