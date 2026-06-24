namespace SocietyManagement.Application.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(int? societyId, int? userId, string action, string entityType, int? entityId, string details);
}
