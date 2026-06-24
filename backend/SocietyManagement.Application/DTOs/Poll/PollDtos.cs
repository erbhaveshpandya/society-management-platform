using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Poll;

public class PollDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public int TotalVotes { get; set; }
    public bool HasUserVoted { get; set; }
    public int? VotedOptionId { get; set; }
    public List<PollOptionDto> Options { get; set; } = new();
}

public class PollOptionDto
{
    public int Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public double Percentage { get; set; }
}

public class CreatePollRequest
{
    [Required, MaxLength(500)]
    public string Question { get; set; } = string.Empty;
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<string> Options { get; set; } = new();
}

public class VoteRequest
{
    public int PollOptionId { get; set; }
}
