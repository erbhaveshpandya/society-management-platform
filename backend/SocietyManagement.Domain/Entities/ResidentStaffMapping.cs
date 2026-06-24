using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class ResidentStaffMapping : ITenantEntity
{
    public int Id { get; set; }
    public int ResidentProfileId { get; set; }
    public int StaffId { get; set; }
    public int SocietyId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ResidentProfile ResidentProfile { get; set; } = null!;
    public Staff Staff { get; set; } = null!;
}
