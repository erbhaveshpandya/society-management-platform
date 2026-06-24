using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class PollOption : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int PollId { get; set; }

    [Required, MaxLength(500)]
    public string OptionText { get; set; } = string.Empty;

    public int VoteCount { get; set; }

    // Navigation
    public Poll Poll { get; set; } = null!;
}
