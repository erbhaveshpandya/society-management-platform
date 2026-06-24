using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class AmenityBooking : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int AmenityId { get; set; }
    public int ResidentId { get; set; }
    public DateTime BookingDate { get; set; }

    [MaxLength(50)]
    public string TimeSlot { get; set; } = string.Empty; // e.g., "09:00-11:00"

    [MaxLength(500)]
    public string Purpose { get; set; } = string.Empty;

    public BookingStatus Status { get; set; } = BookingStatus.Requested;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Society Society { get; set; } = null!;
    public Amenity Amenity { get; set; } = null!;
    public User Resident { get; set; } = null!;
}
