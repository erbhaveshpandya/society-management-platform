using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Maintenance;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api/expenses")]
[Authorize(Roles = "SuperAdmin,SocietyAdmin")]
public class ExpensesController : BaseApiController
{
    private readonly AppDbContext _context;
    public ExpensesController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpenseDto>>> GetAll()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var expenses = await _context.Expenses
            .Where(e => e.SocietyId == societyId)
            .Include(e => e.Vendor)
            .OrderByDescending(e => e.Date)
            .Select(e => new ExpenseDto
            {
                Id = e.Id, SocietyId = e.SocietyId, Category = e.Category,
                Amount = e.Amount, Date = e.Date, VoucherNumber = e.VoucherNumber,
                VendorId = e.VendorId, VendorName = e.Vendor != null ? e.Vendor.Name : null,
                Description = e.Description, Status = e.Status.ToString()
            })
            .ToListAsync();
        return Ok(expenses);
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> Create([FromBody] CreateExpenseRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var expense = new Expense
        {
            SocietyId = societyId.Value, Category = request.Category,
            Amount = request.Amount, Date = request.Date,
            VoucherNumber = string.IsNullOrEmpty(request.VoucherNumber) ? $"VCH-{DateTime.UtcNow:yyyyMMddHHmm}" : request.VoucherNumber,
            VendorId = request.VendorId, Description = request.Description
        };
        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new ExpenseDto { Id = expense.Id, Category = expense.Category, Amount = expense.Amount, Status = expense.Status.ToString() });
    }

    [HttpGet("vendors")]
    public async Task<ActionResult<IEnumerable<VendorDto>>> GetVendors()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var vendors = await _context.Vendors
            .Where(v => v.SocietyId == societyId)
            .Select(v => new VendorDto { Id = v.Id, Name = v.Name, Contact = v.Contact, Email = v.Email, ServiceType = v.ServiceType, IsActive = v.IsActive })
            .ToListAsync();
        return Ok(vendors);
    }
}
