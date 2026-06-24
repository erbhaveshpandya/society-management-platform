using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class EmergencyAlert : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public EmergencyType Type { get; set; }

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public int ReportedBy { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public bool IsResolved { get; set; }

    // Navigation
    public Society Society { get; set; } = null!;
    public User ReportedByUser { get; set; } = null!;
}
