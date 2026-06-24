using Microsoft.AspNetCore.Mvc;
using SocietyManagement.Application.DTOs.Auth;
using SocietyManagement.Application.Interfaces;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuditLogService _auditLogService;

    public AuthController(IAuthService authService, IAuditLogService auditLogService)
    {
        _authService = authService;
        _auditLogService = auditLogService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            await _auditLogService.LogAsync(response.SocietyId, response.UserId, "Login", "User", response.UserId, $"{response.FullName} logged in");
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }
}
