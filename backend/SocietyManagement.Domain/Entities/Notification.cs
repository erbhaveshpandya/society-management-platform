using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Notification : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int? UserId { get; set; } // null means broadcast to all in society

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // Notice, Complaint, Maintenance, Visitor, Poll, Amenity, Emergency

    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(200)]
    public string? ReferenceUrl { get; set; }

    // Navigation
    public Society Society { get; set; } = null!;
    public User? User { get; set; }
}
