using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocietyManagement.Application.DTOs.Dashboard;
using SocietyManagement.Application.Interfaces;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : BaseApiController
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet]
    public async Task<IActionResult> GetDashboard()
    {
        var societyId = GetSocietyId();
        if (societyId == null && GetRole() != "SuperAdmin") return Forbid();

        var role = GetRole();
        return role switch
        {
            "SocietyAdmin" or "SuperAdmin" => Ok(await _dashboardService.GetAdminDashboardAsync(societyId ?? 1)),
            "Resident" => Ok(await _dashboardService.GetResidentDashboardAsync(GetUserId(), societyId!.Value)),
            "SecurityGuard" => Ok(await _dashboardService.GetSecurityDashboardAsync(societyId!.Value)),
            _ => Forbid()
        };
    }

    [HttpGet("admin")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<DashboardDto>> GetAdminDashboard()
    {
        var societyId = GetSocietyId();
        if (societyId == null && GetRole() != "SuperAdmin") return Forbid();
        return Ok(await _dashboardService.GetAdminDashboardAsync(societyId ?? 1));
    }

    [HttpGet("resident")]
    [Authorize(Roles = "Resident")]
    public async Task<ActionResult<ResidentDashboardDto>> GetResidentDashboard()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        return Ok(await _dashboardService.GetResidentDashboardAsync(GetUserId(), societyId.Value));
    }

    [HttpGet("security")]
    [Authorize(Roles = "SecurityGuard")]
    public async Task<ActionResult<SecurityDashboardDto>> GetSecurityDashboard()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        return Ok(await _dashboardService.GetSecurityDashboardAsync(societyId.Value));
    }
}
