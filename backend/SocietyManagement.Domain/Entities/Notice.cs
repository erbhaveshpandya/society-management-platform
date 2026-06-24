using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Notice : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(5000)]
    public string Content { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Category { get; set; } = string.Empty; // General, Maintenance, Event, Emergency

    public bool IsPublished { get; set; } = true;
    public DateTime PublishedDate { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }

    // Navigation
    public Society Society { get; set; } = null!;
    public User Creator { get; set; } = null!;
}
