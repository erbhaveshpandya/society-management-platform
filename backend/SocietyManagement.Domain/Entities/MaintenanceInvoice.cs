using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class MaintenanceInvoice : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int FlatId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [MaxLength(100)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(50)]
    public string BillingMonth { get; set; } = string.Empty; // e.g., "June 2026"

    public DateTime DueDate { get; set; }
    public DateTime GeneratedDate { get; set; } = DateTime.UtcNow;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

    // Navigation
    public Society Society { get; set; } = null!;
    public Flat Flat { get; set; } = null!;
    public Payment? Payment { get; set; }
}
