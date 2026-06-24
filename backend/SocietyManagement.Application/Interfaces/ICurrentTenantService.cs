namespace SocietyManagement.Application.Interfaces;

public interface ICurrentTenantService
{
    int? TenantId { get; }
    string Role { get; }
    bool IsSuperAdmin { get; }
}
