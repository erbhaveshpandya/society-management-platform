using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SocietyManagement.Domain.Interfaces;

namespace SocietyManagement.Domain.Entities;

public class Payment : ITenantEntity
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int InvoiceId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string Method { get; set; } = string.Empty; // Online, Cash, Cheque, UPI

    [MaxLength(100)]
    public string TransactionRef { get; set; } = string.Empty;

    [MaxLength(500)]
    public string ReceiptNumber { get; set; } = string.Empty;

    // Navigation
    public MaintenanceInvoice Invoice { get; set; } = null!;
}
