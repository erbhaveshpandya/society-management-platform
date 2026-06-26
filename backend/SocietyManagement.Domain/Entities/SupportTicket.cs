using System;
using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class SupportTicket : INullableTenantEntity
{
    public int Id { get; set; }
    public int? SocietyId { get; set; }
    public int SubmittedById { get; set; }

    [Required, MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    [MaxLength(2000)]
    public string? ResolutionNotes { get; set; }

    [MaxLength(500)]
    public string? AttachmentUrl { get; set; }

    // Navigation
    public Society? Society { get; set; }
    public User SubmittedByUser { get; set; } = null!;
}
