using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Amenity;

public class AmenityDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string OpenTime { get; set; } = string.Empty;
    public string CloseTime { get; set; } = string.Empty;
}

public class CreateAmenityRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    [MaxLength(200)]
    public string Location { get; set; } = string.Empty;
    public string OpenTime { get; set; } = "06:00";
    public string CloseTime { get; set; } = "22:00";
}

public class BookingDto
{
    public int Id { get; set; }
    public int AmenityId { get; set; }
    public string AmenityName { get; set; } = string.Empty;
    public int ResidentId { get; set; }
    public string ResidentName { get; set; } = string.Empty;
    public string FlatNumber { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public string TimeSlot { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateBookingRequest
{
    public int AmenityId { get; set; }
    public DateTime BookingDate { get; set; }
    [Required, MaxLength(50)]
    public string TimeSlot { get; set; } = string.Empty;
    [MaxLength(500)]
    public string Purpose { get; set; } = string.Empty;
}

public class UpdateBookingStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
