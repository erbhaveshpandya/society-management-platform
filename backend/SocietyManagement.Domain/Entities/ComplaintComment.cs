using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class ComplaintComment : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int ComplaintId { get; set; }
    public int UserId { get; set; }

    [Required, MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Complaint Complaint { get; set; } = null!;
    public User User { get; set; } = null!;
}
