using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Expense : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }

    [Required, MaxLength(100)]
    public string Category { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    [MaxLength(50)]
    public string VoucherNumber { get; set; } = string.Empty;

    public int? VendorId { get; set; }

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    public ExpenseStatus Status { get; set; } = ExpenseStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Society Society { get; set; } = null!;
    public Vendor? Vendor { get; set; }
}
