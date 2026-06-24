using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class VisitorLog : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }

    [Required, MaxLength(100)]
    public string VisitorName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(20)]
    public string VehicleNumber { get; set; } = string.Empty;

    public int FlatId { get; set; }

    [MaxLength(200)]
    public string Purpose { get; set; } = string.Empty;

    public DateTime EntryTime { get; set; } = DateTime.UtcNow;
    public DateTime? ExitTime { get; set; }
    public int CheckedInBy { get; set; } // Security guard UserId
    public bool IsActive { get; set; } = true;

    // Navigation
    public Society Society { get; set; } = null!;
    public Flat Flat { get; set; } = null!;
    public User CheckedInByUser { get; set; } = null!;
}
