using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using SocietyManagement.Application.Interfaces;

namespace SocietyManagement.Api.Controllers;

public abstract class BaseApiController : ControllerBase
{
    protected int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    
    protected string GetRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    
    protected int? GetSocietyId()
    {
        var tenantService = (ICurrentTenantService)HttpContext.RequestServices.GetService(typeof(ICurrentTenantService))!;
        return tenantService.TenantId;
    }
}
