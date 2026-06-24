using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Notice;

public class NoticeDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime PublishedDate { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
}

public class CreateNoticeRequest
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;
    [Required, MaxLength(5000)]
    public string Content { get; set; } = string.Empty;
    [MaxLength(100)]
    public string Category { get; set; } = "General";
}
