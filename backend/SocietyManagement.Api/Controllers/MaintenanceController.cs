using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Maintenance;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/maintenance")]
[Authorize]
public class MaintenanceController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IAuditLogService _auditLog;

    public MaintenanceController(AppDbContext context, INotificationService notificationService, IAuditLogService auditLog)
    {
        _context = context;
        _notificationService = notificationService;
        _auditLog = auditLog;
    }

    [HttpGet("invoices")]
    public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetInvoices([FromQuery] string? status, [FromQuery] string? search)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        var role = User.FindFirst(ClaimTypes.Role)!.Value;
        var userId = GetUserId();

        var query = _context.MaintenanceInvoices
            .Where(i => i.SocietyId == societyId)
            .Include(i => i.Flat).ThenInclude(f => f.Building)
            .Include(i => i.Flat).ThenInclude(f => f.Owner)
            .Include(i => i.Payment)
            .AsQueryable();

        // Residents can only see their own flat invoices
        if (role == "Resident")
        {
            var profile = await _context.ResidentProfiles.FirstOrDefaultAsync(r => r.UserId == userId && r.SocietyId == societyId);
            if (profile != null) query = query.Where(i => i.FlatId == profile.FlatId);
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<InvoiceStatus>(status, true, out var st))
            query = query.Where(i => i.Status == st);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(i => i.Flat.FlatNumber.Contains(search) || (i.Flat.Owner != null && i.Flat.Owner.FullName.Contains(search)));

        var invoices = await query.OrderByDescending(i => i.GeneratedDate)
            .Select(i => new InvoiceDto
            {
                Id = i.Id, SocietyId = i.SocietyId, FlatId = i.FlatId,
                FlatNumber = i.Flat.FlatNumber, BuildingName = i.Flat.Building.Name,
                OwnerName = i.Flat.Owner != null ? i.Flat.Owner.FullName : "N/A",
                Amount = i.Amount, Description = i.Description,
                BillingMonth = i.BillingMonth, DueDate = i.DueDate,
                GeneratedDate = i.GeneratedDate, Status = i.Status.ToString(),
                Payment = i.Payment != null ? new PaymentDto
                {
                    Id = i.Payment.Id, Amount = i.Payment.Amount,
                    PaymentDate = i.Payment.PaymentDate, Method = i.Payment.Method,
                    TransactionRef = i.Payment.TransactionRef, ReceiptNumber = i.Payment.ReceiptNumber
                } : null
            })
            .ToListAsync();
        return Ok(invoices);
    }

    [HttpPost("invoices")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<InvoiceDto>> GenerateInvoice([FromBody] GenerateInvoiceRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var invoice = new MaintenanceInvoice
        {
            SocietyId = societyId.Value, FlatId = request.FlatId,
            Amount = request.Amount, Description = request.Description,
            BillingMonth = request.BillingMonth, DueDate = request.DueDate
        };
        _context.MaintenanceInvoices.Add(invoice);
        await _context.SaveChangesAsync();

        // Notify flat owner
        var flat = await _context.Flats.Include(f => f.Owner).FirstOrDefaultAsync(f => f.Id == request.FlatId);
        if (flat?.OwnerId != null)
        {
            await _notificationService.CreateNotificationAsync(societyId.Value, flat.OwnerId, "Maintenance Invoice Generated", $"Your maintenance invoice of ₹{request.Amount} for {request.BillingMonth} has been generated.", "Maintenance");
        }

        await _auditLog.LogAsync(societyId, GetUserId(), "InvoiceGenerated", "MaintenanceInvoice", invoice.Id, $"Invoice generated for Flat {flat?.FlatNumber}");

        return CreatedAtAction(nameof(GetInvoices), new InvoiceDto { Id = invoice.Id, Amount = invoice.Amount, BillingMonth = invoice.BillingMonth, Status = invoice.Status.ToString() });
    }

    [HttpPost("payments")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin,Resident")]
    public async Task<IActionResult> MakePayment([FromBody] MakePaymentRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var invoice = await _context.MaintenanceInvoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId && i.SocietyId == societyId);
        if (invoice == null) return NotFound("Invoice not found");
        if (invoice.Status == InvoiceStatus.Paid) return BadRequest("Invoice is already paid");

        var payment = new Payment
        {
            SocietyId = societyId.Value, InvoiceId = request.InvoiceId,
            Amount = request.Amount, Method = request.Method,
            TransactionRef = string.IsNullOrEmpty(request.TransactionRef) ? $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{invoice.Id}" : request.TransactionRef,
            ReceiptNumber = $"RCP-{DateTime.UtcNow:yyyyMMdd}-{invoice.Id}"
        };
        _context.Payments.Add(payment);
        invoice.Status = InvoiceStatus.Paid;
        await _context.SaveChangesAsync();

        await _auditLog.LogAsync(societyId, GetUserId(), "PaymentMade", "Payment", payment.Id, $"Payment of ₹{payment.Amount} for invoice #{invoice.Id}");

        return Ok(new PaymentDto
        {
            Id = payment.Id, Amount = payment.Amount, PaymentDate = payment.PaymentDate,
            Method = payment.Method, TransactionRef = payment.TransactionRef, ReceiptNumber = payment.ReceiptNumber
        });
    }

    [HttpPost("invoices/{id}/remind")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> SendReminder(int id)
    {
        var societyId = GetSocietyId();
        var invoice = await _context.MaintenanceInvoices.Include(i => i.Flat).FirstOrDefaultAsync(i => i.Id == id && i.SocietyId == societyId);
        if (invoice == null) return NotFound();

        // Simulated SMS/Email log
        var flat = invoice.Flat;
        if (flat.OwnerId != null)
        {
            await _notificationService.CreateNotificationAsync(societyId!.Value, flat.OwnerId, "Payment Reminder", $"Reminder: Your maintenance payment of ₹{invoice.Amount} for {invoice.BillingMonth} is pending. Please pay before {invoice.DueDate:dd MMM yyyy}.", "Maintenance");
        }

        return Ok(new { message = "Reminder sent successfully (simulated)" });
    }
}
