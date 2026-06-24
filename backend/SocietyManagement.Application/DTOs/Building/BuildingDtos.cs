using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Building;

public class BuildingDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int TotalFloors { get; set; }
    public string Description { get; set; } = string.Empty;
    public int TotalFlats { get; set; }
}

public class CreateBuildingRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public int TotalFloors { get; set; }
    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;
}
