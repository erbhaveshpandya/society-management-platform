using System;
using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Support;

public class SupportTicketDto
{
    public int Id { get; set; }
    public int? SocietyId { get; set; }
    public string? SocietyName { get; set; }
    public int SubmittedById { get; set; }
    public string SubmittedByUserName { get; set; } = string.Empty;
    public string SubmittedByUserRole { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? AttachmentUrl { get; set; }
}


public class ResolveSupportTicketRequest
{
    [MaxLength(2000)]
    public string ResolutionNotes { get; set; } = string.Empty;
}
