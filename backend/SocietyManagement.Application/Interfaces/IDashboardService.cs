using SocietyManagement.Application.DTOs.Dashboard;

namespace SocietyManagement.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetAdminDashboardAsync(int societyId);
    Task<ResidentDashboardDto> GetResidentDashboardAsync(int userId, int societyId);
    Task<SecurityDashboardDto> GetSecurityDashboardAsync(int societyId);
}
