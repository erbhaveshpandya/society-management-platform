using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Flat;

public class FlatDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int BuildingId { get; set; }
    public string BuildingName { get; set; } = string.Empty;
    public string FlatNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    public string Type { get; set; } = string.Empty;
    public double Area { get; set; }
    public int? OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public bool IsOccupied { get; set; }
    public List<ResidentDto> Residents { get; set; } = new();
}

public class ResidentDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string ResidentType { get; set; } = string.Empty;
    public DateTime? MoveInDate { get; set; }
    public List<VehicleDto> Vehicles { get; set; } = new();
}

public class VehicleDto
{
    public int Id { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
}

public class CreateFlatRequest
{
    public int BuildingId { get; set; }
    [Required, MaxLength(20)]
    public string FlatNumber { get; set; } = string.Empty;
    public int Floor { get; set; }
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
    public double Area { get; set; }
}

public class AssignResidentRequest
{
    public int FlatId { get; set; }
    public int UserId { get; set; }
    [MaxLength(20)]
    public string ResidentType { get; set; } = "Owner";
    public DateTime? MoveInDate { get; set; }
}

public class CreateVehicleRequest
{
    [Required, MaxLength(20)]
    public string VehicleNumber { get; set; } = string.Empty;
    [MaxLength(20)]
    public string Type { get; set; } = string.Empty;
    [MaxLength(50)]
    public string Make { get; set; } = string.Empty;
    [MaxLength(50)]
    public string Model { get; set; } = string.Empty;
}
