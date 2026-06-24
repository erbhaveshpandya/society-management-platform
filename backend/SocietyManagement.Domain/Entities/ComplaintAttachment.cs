using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class ComplaintAttachment : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int ComplaintId { get; set; }

    [Required, MaxLength(200)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Complaint Complaint { get; set; } = null!;
}
