using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Notification;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, int societyId)
    {
        return await _context.Notifications
            .Where(n => n.SocietyId == societyId && (n.UserId == userId || n.UserId == null))
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                ReferenceUrl = n.ReferenceUrl
            })
            .ToListAsync();
    }

    public async Task<int> GetUnreadCountAsync(int userId, int societyId)
    {
        return await _context.Notifications
            .CountAsync(n => n.SocietyId == societyId && (n.UserId == userId || n.UserId == null) && !n.IsRead);
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && (n.UserId == userId || n.UserId == null));

        if (notification != null)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(int userId, int societyId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.SocietyId == societyId && (n.UserId == userId || n.UserId == null) && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    public async Task CreateNotificationAsync(int societyId, int? userId, string title, string message, string type)
    {
        var notification = new Notification
        {
            SocietyId = societyId,
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }
}
