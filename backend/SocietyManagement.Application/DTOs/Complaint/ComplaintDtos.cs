using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Complaint;

public class ComplaintDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int FlatId { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public int ResidentId { get; set; }
    public string ResidentName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public List<ComplaintCommentDto> Comments { get; set; } = new();
}

public class ComplaintCommentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateComplaintRequest
{
    public int FlatId { get; set; }
    [Required, MaxLength(200)]
    public string Subject { get; set; } = string.Empty;
    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;
    public string Priority { get; set; } = "Medium";
}

public class UpdateComplaintStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}

public class AddCommentRequest
{
    [Required, MaxLength(2000)]
    public string Comment { get; set; } = string.Empty;
}
