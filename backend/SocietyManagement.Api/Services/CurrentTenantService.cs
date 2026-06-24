using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SocietyManagement.Application.Interfaces;

namespace SocietyManagement.Api.Services;

public class CurrentTenantService : ICurrentTenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? TenantId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext?.User == null) return null;

            // Check if SuperAdmin bypassed filtering
            if (IsSuperAdmin)
            {
                // Check X-Society-Id header
                if (httpContext.Request.Headers.TryGetValue("X-Society-Id", out var headerVal) &&
                    int.TryParse(headerVal, out var selectedId))
                {
                    return selectedId;
                }

                // Check query string
                if (httpContext.Request.Query.TryGetValue("societyId", out var queryVal) &&
                    int.TryParse(queryVal, out var selectedIdQuery))
                {
                    return selectedIdQuery;
                }

                return 1; // Default fallback for SuperAdmin
            }

            var sid = httpContext.User.FindFirst("SocietyId")?.Value 
                      ?? httpContext.User.FindFirst("societyId")?.Value;
            return string.IsNullOrEmpty(sid) ? null : int.Parse(sid);
        }
    }

    public string Role => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value 
                          ?? _httpContextAccessor.HttpContext?.User?.FindFirst("role")?.Value 
                          ?? string.Empty;

    public bool IsSuperAdmin => string.Equals(Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase);
}
