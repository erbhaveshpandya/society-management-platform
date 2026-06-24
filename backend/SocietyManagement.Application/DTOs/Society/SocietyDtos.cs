using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Society;

public class SocietyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TotalBuildings { get; set; }
    public int TotalFlats { get; set; }
    public int TotalResidents { get; set; }
}

public class CreateSocietyRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;
    [MaxLength(100)]
    public string State { get; set; } = string.Empty;
    [MaxLength(10)]
    public string PinCode { get; set; } = string.Empty;
    [MaxLength(100)]
    public string RegistrationNumber { get; set; } = string.Empty;
    [MaxLength(20)]
    public string ContactPhone { get; set; } = string.Empty;
    [MaxLength(200), EmailAddress]
    public string ContactEmail { get; set; } = string.Empty;
}
