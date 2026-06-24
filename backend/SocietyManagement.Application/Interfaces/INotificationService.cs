using SocietyManagement.Application.DTOs.Notification;

namespace SocietyManagement.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, int societyId);
    Task<int> GetUnreadCountAsync(int userId, int societyId);
    Task MarkAsReadAsync(int notificationId, int userId);
    Task MarkAllAsReadAsync(int userId, int societyId);
    Task CreateNotificationAsync(int societyId, int? userId, string title, string message, string type);
}
