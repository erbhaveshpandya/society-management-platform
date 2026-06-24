using SocietyManagement.Application.DTOs.Auth;

namespace SocietyManagement.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
}
