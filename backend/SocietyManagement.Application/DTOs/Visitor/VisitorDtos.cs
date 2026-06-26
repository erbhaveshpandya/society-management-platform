using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Visitor;

public class VisitorLogDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string VehicleNumber { get; set; } = string.Empty;
    public int FlatId { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime EntryTime { get; set; }
    public DateTime? ExitTime { get; set; }
    public bool IsActive { get; set; }
    public string CheckedInByName { get; set; } = string.Empty;
}

public class CreateVisitorRequest
{
    [Required, MaxLength(100)]
    public string VisitorName { get; set; } = string.Empty;
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;
    [MaxLength(20)]
    public string VehicleNumber { get; set; } = string.Empty;
    public int FlatId { get; set; }
    [MaxLength(200)]
    public string Purpose { get; set; } = string.Empty;
}

public class ParkingAlertDto
{
    public int Id { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ReportedByName { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; }
    public bool IsResolved { get; set; }
}

public class CreateParkingAlertRequest
{
    [Required, MaxLength(20)]
    public string VehicleNumber { get; set; } = string.Empty;
    [MaxLength(200)]
    public string Location { get; set; } = string.Empty;
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
}

public class EmergencyAlertDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ReportedByName { get; set; } = string.Empty;
    public string ReportedByRole { get; set; } = string.Empty;
    public string FlatNumber { get; set; } = string.Empty;
    public string BuildingName { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; }
    public bool IsResolved { get; set; }
}

public class CreateEmergencyAlertRequest
{
    [Required]
    public string Type { get; set; } = string.Empty;
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
}

public class VisitorPassDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? VehicleNumber { get; set; }
    public int FlatId { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public DateTime ExpectedDate { get; set; }
    public string Passcode { get; set; } = string.Empty;
    public bool IsUsed { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PreRegisterVisitorRequest
{
    [Required, MaxLength(100)]
    public string VisitorName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? VehicleNumber { get; set; }

    public int FlatId { get; set; }

    [Required, MaxLength(200)]
    public string Purpose { get; set; } = string.Empty;

    public DateTime ExpectedDate { get; set; }
}

public class VerifyPasscodeRequest
{
    [Required]
    public string Passcode { get; set; } = string.Empty;
}

