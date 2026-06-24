using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Flat : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int BuildingId { get; set; }

    [Required, MaxLength(20)]
    public string FlatNumber { get; set; } = string.Empty;

    public int Floor { get; set; }

    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // 1BHK, 2BHK, 3BHK

    public double Area { get; set; } // in sq ft
    public int? OwnerId { get; set; }
    public bool IsOccupied { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Society Society { get; set; } = null!;
    public Building Building { get; set; } = null!;
    public User? Owner { get; set; }
    public ICollection<ResidentProfile> Residents { get; set; } = new List<ResidentProfile>();
}
