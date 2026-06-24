using System.ComponentModel.DataAnnotations;

namespace SocietyManagement.Application.DTOs.Maintenance;

public class InvoiceDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public int FlatId { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public string BuildingName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string BillingMonth { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public DateTime GeneratedDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public PaymentDto? Payment { get; set; }
}

public class PaymentDto
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string Method { get; set; } = string.Empty;
    public string TransactionRef { get; set; } = string.Empty;
    public string ReceiptNumber { get; set; } = string.Empty;
}

public class GenerateInvoiceRequest
{
    public int FlatId { get; set; }
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    [MaxLength(100)]
    public string Description { get; set; } = "Monthly Maintenance";
    [Required]
    public string BillingMonth { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
}

public class MakePaymentRequest
{
    public int InvoiceId { get; set; }
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    [MaxLength(50)]
    public string Method { get; set; } = "Online";
    [MaxLength(100)]
    public string TransactionRef { get; set; } = string.Empty;
}

public class ExpenseDto
{
    public int Id { get; set; }
    public int SocietyId { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string VoucherNumber { get; set; } = string.Empty;
    public int? VendorId { get; set; }
    public string? VendorName { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class CreateExpenseRequest
{
    [Required, MaxLength(100)]
    public string Category { get; set; } = string.Empty;
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    [MaxLength(50)]
    public string VoucherNumber { get; set; } = string.Empty;
    public int? VendorId { get; set; }
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
}

public class VendorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
