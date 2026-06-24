using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class StaffAttendance : ITenantEntity
{
    public int Id { get; set; }
    public int StaffId { get; set; }
    public int SocietyId { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public int MarkedBy { get; set; } // UserId of security guard

    // Navigation
    public Staff Staff { get; set; } = null!;
    public User MarkedByUser { get; set; } = null!;
}
