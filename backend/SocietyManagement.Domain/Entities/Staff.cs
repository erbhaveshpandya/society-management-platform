using System.ComponentModel.DataAnnotations;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Staff : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Role { get; set; } = string.Empty; // Maid, Cook, Driver, Gardener, Plumber

    [MaxLength(500)]
    public string Photo { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Society Society { get; set; } = null!;
    public ICollection<StaffAttendance> AttendanceRecords { get; set; } = new List<StaffAttendance>();
    public ICollection<ResidentStaffMapping> ResidentMappings { get; set; } = new List<ResidentStaffMapping>();
}
