using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class PollVote : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int PollId { get; set; }
    public int PollOptionId { get; set; }
    public int UserId { get; set; }
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Poll Poll { get; set; } = null!;
    public PollOption PollOption { get; set; } = null!;
    public User User { get; set; } = null!;
}
