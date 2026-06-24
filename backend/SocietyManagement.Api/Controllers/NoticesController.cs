using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Notice;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/notices")]
[Authorize]
public class NoticesController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public NoticesController(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NoticeDto>>> GetAll()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var notices = await _context.Notices
            .Where(n => n.SocietyId == societyId && n.IsPublished)
            .Include(n => n.Creator)
            .OrderByDescending(n => n.PublishedDate)
            .Select(n => new NoticeDto
            {
                Id = n.Id, SocietyId = n.SocietyId, Title = n.Title,
                Content = n.Content, Category = n.Category,
                IsPublished = n.IsPublished, PublishedDate = n.PublishedDate,
                CreatedByName = n.Creator.FullName
            })
            .ToListAsync();
        return Ok(notices);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<NoticeDto>> Create([FromBody] CreateNoticeRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var notice = new Notice
        {
            SocietyId = societyId.Value, Title = request.Title,
            Content = request.Content, Category = request.Category,
            CreatedBy = GetUserId()
        };
        _context.Notices.Add(notice);
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(societyId.Value, null, "New Notice", $"New notice: {request.Title}", "Notice");

        return CreatedAtAction(nameof(GetAll), new NoticeDto { Id = notice.Id, Title = notice.Title, Category = notice.Category, PublishedDate = notice.PublishedDate });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var societyId = GetSocietyId();
        var notice = await _context.Notices.FirstOrDefaultAsync(n => n.Id == id && n.SocietyId == societyId);
        if (notice == null) return NotFound();
        _context.Notices.Remove(notice);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
