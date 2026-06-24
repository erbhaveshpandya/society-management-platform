using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class ParkingAlert : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }

    [Required, MaxLength(20)]
    public string VehicleNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Location { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public int ReportedBy { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public bool IsResolved { get; set; }

    // Navigation
    public Society Society { get; set; } = null!;
    public User ReportedByUser { get; set; } = null!;
}
