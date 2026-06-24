using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocietyManagement.Application.DTOs.Notification;
using SocietyManagement.Application.Interfaces;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService) => _notificationService = notificationService;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetAll()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Ok(new List<NotificationDto>());
        return Ok(await _notificationService.GetUserNotificationsAsync(GetUserId(), societyId.Value));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Ok(0);
        return Ok(await _notificationService.GetUnreadCountAsync(GetUserId(), societyId.Value));
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        await _notificationService.MarkAsReadAsync(id, GetUserId());
        return Ok(new { message = "Marked as read" });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Ok();
        await _notificationService.MarkAllAsReadAsync(GetUserId(), societyId.Value);
        return Ok(new { message = "All marked as read" });
    }
}
