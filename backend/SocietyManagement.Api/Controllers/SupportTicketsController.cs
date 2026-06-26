using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Support;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class SupportTicketsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _auditLog;
    private readonly IWebHostEnvironment _env;

    public SupportTicketsController(AppDbContext context, IAuditLogService auditLog, IWebHostEnvironment env)
    {
        _context = context;
        _auditLog = auditLog;
        _env = env;
    }

    [HttpPost("support-tickets")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<SupportTicketDto>> CreateSupportTicket([FromForm] CreateSupportTicketRequest request)
    {
        var userId = GetUserId();
        var societyId = GetSocietyId();

        string? attachmentUrl = null;
        if (request.File != null && request.File.Length > 0)
        {
            var uploadsPath = Path.Combine(_env.ContentRootPath, "uploads", "support");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }
            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(request.File.FileName)}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }
            attachmentUrl = $"/uploads/support/{uniqueFileName}";
        }

        var ticket = new SupportTicket
        {
            SocietyId = societyId,
            SubmittedById = userId,
            Subject = request.Subject,
            Description = request.Description,
            Category = request.Category,
            Status = SupportTicketStatus.Open,
            CreatedAt = DateTime.UtcNow,
            AttachmentUrl = attachmentUrl
        };

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(societyId, userId, "SupportTicketCreated", "SupportTicket", ticket.Id, $"Support ticket '{ticket.Subject}' was created");

        // Fetch created ticket with relation details for mapping
        var created = await _context.SupportTickets
            .Include(t => t.Society)
            .Include(t => t.SubmittedByUser)
            .FirstAsync(t => t.Id == ticket.Id);

        return Ok(MapToDto(created));
    }

    [HttpGet("support-tickets")]
    public async Task<ActionResult<IEnumerable<SupportTicketDto>>> GetSupportTickets()
    {
        var role = GetRole();
        var userId = GetUserId();
        var societyId = GetSocietyId();

        var query = _context.SupportTickets
            .Include(t => t.Society)
            .Include(t => t.SubmittedByUser)
            .AsQueryable();

        if (role == "SuperAdmin")
        {
            // SuperAdmin sees all
        }
        else if (role == "SocietyAdmin")
        {
            // SocietyAdmin sees tickets for their society
            query = query.Where(t => t.SocietyId == societyId);
        }
        else
        {
            // Residents and guards only see their own tickets
            query = query.Where(t => t.SubmittedById == userId);
        }

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(tickets.Select(MapToDto));
    }

    [HttpGet("support-tickets/{id}")]
    public async Task<ActionResult<SupportTicketDto>> GetSupportTicket(int id)
    {
        var role = GetRole();
        var userId = GetUserId();
        var societyId = GetSocietyId();

        var ticket = await _context.SupportTickets
            .Include(t => t.Society)
            .Include(t => t.SubmittedByUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return NotFound();

        // Authorization checks
        if (role != "SuperAdmin")
        {
            if (role == "SocietyAdmin")
            {
                if (ticket.SocietyId != societyId) return Forbid();
            }
            else
            {
                if (ticket.SubmittedById != userId) return Forbid();
            }
        }

        return Ok(MapToDto(ticket));
    }

    [HttpPut("support-tickets/{id}/status")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> UpdateTicketStatus(int id, [FromQuery] string status)
    {
        if (!Enum.TryParse<SupportTicketStatus>(status, true, out var ticketStatus))
            return BadRequest("Invalid ticket status");

        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();

        ticket.Status = ticketStatus;
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(ticket.SocietyId, GetUserId(), "SupportTicketStatusUpdated", "SupportTicket", ticket.Id, $"Support ticket ID {id} status updated to {status}");

        return Ok(new { message = "Status updated successfully" });
    }

    [HttpPost("support-tickets/{id}/resolve")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ResolveTicket(int id, [FromBody] ResolveSupportTicketRequest request)
    {
        var ticket = await _context.SupportTickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket == null) return NotFound();

        ticket.Status = SupportTicketStatus.Resolved;
        ticket.ResolvedAt = DateTime.UtcNow;
        ticket.ResolutionNotes = request.ResolutionNotes;

        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(ticket.SocietyId, GetUserId(), "SupportTicketResolved", "SupportTicket", ticket.Id, $"Support ticket ID {id} resolved with notes");

        return Ok(new { message = "Ticket resolved successfully" });
    }

    private static SupportTicketDto MapToDto(SupportTicket ticket)
    {
        return new SupportTicketDto
        {
            Id = ticket.Id,
            SocietyId = ticket.SocietyId,
            SocietyName = ticket.Society?.Name,
            SubmittedById = ticket.SubmittedById,
            SubmittedByUserName = ticket.SubmittedByUser.FullName,
            SubmittedByUserRole = ticket.SubmittedByUser.Role.ToString(),
            Subject = ticket.Subject,
            Description = ticket.Description,
            Category = ticket.Category,
            Status = ticket.Status.ToString(),
            CreatedAt = ticket.CreatedAt,
            ResolvedAt = ticket.ResolvedAt,
            ResolutionNotes = ticket.ResolutionNotes,
            AttachmentUrl = ticket.AttachmentUrl
        };
    }
}

public class CreateSupportTicketRequest
{
    [Required, MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    public IFormFile? File { get; set; }
}
