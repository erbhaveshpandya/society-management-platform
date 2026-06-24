using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class ResidentProfile : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int UserId { get; set; }
    public int FlatId { get; set; }

    [MaxLength(20)]
    public string ResidentType { get; set; } = "Owner"; // Owner, Tenant

    public DateTime? MoveInDate { get; set; }
    public DateTime? MoveOutDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Society Society { get; set; } = null!;
    public User User { get; set; } = null!;
    public Flat Flat { get; set; } = null!;
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
