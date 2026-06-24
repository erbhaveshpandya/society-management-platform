using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Complaint;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/complaints")]
[Authorize]
public class ComplaintsController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditLogService _auditLog;

    public ComplaintsController(AppDbContext context, INotificationService notificationService, IAuditLogService auditLog)
    {
        _context = context;
        _notificationService = notificationService;
        _auditLog = auditLog;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ComplaintDto>>> GetAll([FromQuery] string? status)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        var role = GetRole();
        var userId = GetUserId();

        var query = _context.Complaints
            .Where(c => c.SocietyId == societyId)
            .Include(c => c.Flat)
            .Include(c => c.Resident)
            .Include(c => c.Comments).ThenInclude(cc => cc.User)
            .AsQueryable();

        if (role == "Resident")
            query = query.Where(c => c.ResidentId == userId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ComplaintStatus>(status, true, out var st))
            query = query.Where(c => c.Status == st);

        var complaints = await query.OrderByDescending(c => c.CreatedAt)
            .Select(c => new ComplaintDto
            {
                Id = c.Id, SocietyId = c.SocietyId, FlatId = c.FlatId,
                FlatNumber = c.Flat.FlatNumber, ResidentId = c.ResidentId,
                ResidentName = c.Resident.FullName, Subject = c.Subject,
                Description = c.Description, Category = c.Category,
                Status = c.Status.ToString(), Priority = c.Priority.ToString(),
                CreatedAt = c.CreatedAt, ResolvedAt = c.ResolvedAt,
                Comments = c.Comments.OrderBy(cc => cc.CreatedAt).Select(cc => new ComplaintCommentDto
                {
                    Id = cc.Id, UserId = cc.UserId, UserName = cc.User.FullName,
                    UserRole = cc.User.Role.ToString(), Comment = cc.Comment, CreatedAt = cc.CreatedAt
                }).ToList()
            })
            .ToListAsync();
        return Ok(complaints);
    }

    [HttpPost]
    [Authorize(Roles = "Resident")]
    public async Task<ActionResult<ComplaintDto>> Create([FromBody] CreateComplaintRequest request)
    {
        var societyId = GetSocietyId();
        var userId = GetUserId();
        if (societyId == null) return Forbid();

        // Check if flat exists and belongs to user's society
        var flatExists = await _context.Flats.AnyAsync(f => f.Id == request.FlatId);
        if (!flatExists) return BadRequest("Invalid FlatId");

        var complaint = new Complaint
        {
            SocietyId = societyId.Value, FlatId = request.FlatId,
            ResidentId = userId, Subject = request.Subject,
            Description = request.Description, Category = request.Category,
            Priority = Enum.TryParse<ComplaintPriority>(request.Priority, true, out var p) ? p : ComplaintPriority.Medium
        };
        _context.Complaints.Add(complaint);
        await _context.SaveChangesAsync();

        // Notify admin
        await _notificationService.CreateNotificationAsync(societyId.Value, null, "New Complaint", $"New complaint: {request.Subject}", "Complaint");
        return CreatedAtAction(nameof(GetAll), new ComplaintDto { Id = complaint.Id, Subject = complaint.Subject, Status = complaint.Status.ToString() });
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateComplaintStatusRequest request)
    {
        var societyId = GetSocietyId();
        var complaint = await _context.Complaints.FirstOrDefaultAsync(c => c.Id == id && c.SocietyId == societyId);
        if (complaint == null) return NotFound();

        if (Enum.TryParse<ComplaintStatus>(request.Status, true, out var status))
        {
            complaint.Status = status;
            if (status == ComplaintStatus.Resolved) complaint.ResolvedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _notificationService.CreateNotificationAsync(societyId!.Value, complaint.ResidentId, "Complaint Updated", $"Your complaint '{complaint.Subject}' status changed to {request.Status}.", "Complaint");
            await _auditLog.LogAsync(societyId, GetUserId(), "ComplaintStatusChanged", "Complaint", id, $"Status changed to {request.Status}");
        }
        return Ok(new { message = "Status updated" });
    }

    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddCommentRequest request)
    {
        var societyId = GetSocietyId();
        var complaint = await _context.Complaints.FirstOrDefaultAsync(c => c.Id == id && c.SocietyId == societyId);
        if (complaint == null) return NotFound();

        var comment = new ComplaintComment
        {
            ComplaintId = id, UserId = GetUserId(), Comment = request.Comment
        };
        _context.ComplaintComments.Add(comment);
        await _context.SaveChangesAsync();

        return Ok(new ComplaintCommentDto { Id = comment.Id, Comment = comment.Comment, CreatedAt = comment.CreatedAt });
    }
}
