using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Complaint : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int FlatId { get; set; }
    public int ResidentId { get; set; }

    [Required, MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public ComplaintStatus Status { get; set; } = ComplaintStatus.Open;
    public ComplaintPriority Priority { get; set; } = ComplaintPriority.Medium;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    // Navigation
    public Society Society { get; set; } = null!;
    public Flat Flat { get; set; } = null!;
    public User Resident { get; set; } = null!;
    public ICollection<ComplaintComment> Comments { get; set; } = new List<ComplaintComment>();
    public ICollection<ComplaintAttachment> Attachments { get; set; } = new List<ComplaintAttachment>();
}
