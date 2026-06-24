using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Building : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int TotalFloors { get; set; }

    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Society Society { get; set; } = null!;
    public ICollection<Flat> Flats { get; set; } = new List<Flat>();
}
