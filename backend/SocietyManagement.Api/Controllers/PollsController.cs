using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Poll;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/polls")]
[Authorize]
public class PollsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditLogService _auditLog;

    public PollsController(AppDbContext context, INotificationService notificationService, IAuditLogService auditLog)
    {
        _context = context;
        _notificationService = notificationService;
        _auditLog = auditLog;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PollDto>>> GetAll()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        var userId = GetUserId();

        var polls = await _context.Polls
            .Where(p => p.SocietyId == societyId)
            .Include(p => p.Creator)
            .Include(p => p.Options)
            .Include(p => p.Votes)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PollDto
            {
                Id = p.Id, SocietyId = p.SocietyId, Question = p.Question,
                Description = p.Description, Status = p.Status.ToString(),
                StartDate = p.StartDate, EndDate = p.EndDate,
                CreatedByName = p.Creator.FullName,
                TotalVotes = p.Options.Sum(o => o.VoteCount),
                HasUserVoted = p.Votes.Any(v => v.UserId == userId),
                VotedOptionId = p.Votes.Where(v => v.UserId == userId).Select(v => (int?)v.PollOptionId).FirstOrDefault(),
                Options = p.Options.Select(o => new PollOptionDto
                {
                    Id = o.Id, OptionText = o.OptionText, VoteCount = o.VoteCount,
                    Percentage = p.Options.Sum(x => x.VoteCount) > 0
                        ? Math.Round((double)o.VoteCount / p.Options.Sum(x => x.VoteCount) * 100, 1) : 0
                }).ToList()
            })
            .ToListAsync();
        return Ok(polls);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<PollDto>> Create([FromBody] CreatePollRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var poll = new Poll
        {
            SocietyId = societyId.Value, Question = request.Question,
            Description = request.Description, Status = PollStatus.Active,
            StartDate = request.StartDate, EndDate = request.EndDate,
            CreatedBy = GetUserId()
        };
        _context.Polls.Add(poll);
        await _context.SaveChangesAsync();

        foreach (var optionText in request.Options)
        {
            _context.PollOptions.Add(new PollOption { PollId = poll.Id, OptionText = optionText });
        }
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(societyId.Value, null, "New Poll", $"New poll: {request.Question}", "Poll");

        return CreatedAtAction(nameof(GetAll), new PollDto { Id = poll.Id, Question = poll.Question, Status = poll.Status.ToString() });
    }

    [HttpPost("{id}/vote")]
    [Authorize(Roles = "Resident")]
    public async Task<IActionResult> Vote(int id, [FromBody] VoteRequest request)
    {
        var societyId = GetSocietyId();
        var userId = GetUserId();
        if (societyId == null) return Forbid();

        var poll = await _context.Polls.FirstOrDefaultAsync(p => p.Id == id && p.SocietyId == societyId);
        if (poll == null) return NotFound();
        if (poll.Status != PollStatus.Active) return BadRequest("Poll is not active");

        var hasVoted = await _context.PollVotes.AnyAsync(v => v.PollId == id && v.UserId == userId);
        if (hasVoted) return BadRequest("You have already voted");

        var option = await _context.PollOptions.FirstOrDefaultAsync(o => o.Id == request.PollOptionId && o.PollId == id);
        if (option == null) return BadRequest("Invalid option");

        var vote = new PollVote { PollId = id, PollOptionId = request.PollOptionId, UserId = userId };
        _context.PollVotes.Add(vote);
        option.VoteCount++;
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(societyId, userId, "PollVoteSubmitted", "Poll", id, $"User voted on poll: {poll.Question}");

        return Ok(new { message = "Vote recorded successfully" });
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] PollStatusUpdateRequest request)
    {
        var societyId = GetSocietyId();
        var poll = await _context.Polls.FirstOrDefaultAsync(p => p.Id == id && p.SocietyId == societyId);
        if (poll == null) return NotFound();

        if (Enum.TryParse<PollStatus>(request.Status, true, out var status))
        {
            poll.Status = status;
            await _context.SaveChangesAsync();
        }
        return Ok(new { message = "Status updated" });
    }
}

public class PollStatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
}
