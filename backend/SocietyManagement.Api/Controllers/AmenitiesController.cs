using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Amenity;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class AmenitiesController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public AmenitiesController(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    [HttpGet("amenities")]
    public async Task<ActionResult<IEnumerable<AmenityDto>>> GetAmenities()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var amenities = await _context.Amenities
            .Where(a => a.SocietyId == societyId)
            .Select(a => new AmenityDto
            {
                Id = a.Id, SocietyId = a.SocietyId, Name = a.Name,
                Description = a.Description, Location = a.Location,
                IsActive = a.IsActive, OpenTime = a.OpenTime, CloseTime = a.CloseTime
            })
            .ToListAsync();
        return Ok(amenities);
    }

    [HttpPost("amenities")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<ActionResult<AmenityDto>> CreateAmenity([FromBody] CreateAmenityRequest request)
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var amenity = new Amenity
        {
            SocietyId = societyId.Value, Name = request.Name,
            Description = request.Description, Location = request.Location,
            OpenTime = request.OpenTime, CloseTime = request.CloseTime
        };
        _context.Amenities.Add(amenity);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAmenities), new AmenityDto { Id = amenity.Id, Name = amenity.Name });
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<IEnumerable<BookingDto>>> GetBookings()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();
        var role = User.FindFirst(ClaimTypes.Role)!.Value;
        var userId = GetUserId();

        var query = _context.AmenityBookings
            .Where(b => b.SocietyId == societyId)
            .Include(b => b.Amenity)
            .Include(b => b.Resident).ThenInclude(r => r.ResidentProfile).ThenInclude(p => p!.Flat)
            .AsQueryable();

        if (role == "Resident")
            query = query.Where(b => b.ResidentId == userId);

        var bookings = await query.OrderByDescending(b => b.BookingDate)
            .Select(b => new BookingDto
            {
                Id = b.Id, AmenityId = b.AmenityId, AmenityName = b.Amenity.Name,
                ResidentId = b.ResidentId, ResidentName = b.Resident.FullName,
                FlatNumber = b.Resident.ResidentProfile != null ? b.Resident.ResidentProfile.Flat.FlatNumber : "",
                BookingDate = b.BookingDate, TimeSlot = b.TimeSlot,
                Purpose = b.Purpose, Status = b.Status.ToString(), CreatedAt = b.CreatedAt
            })
            .ToListAsync();
        return Ok(bookings);
    }

    [HttpGet("bookings/occupied")]
    public async Task<ActionResult<IEnumerable<OccupiedSlotDto>>> GetOccupiedSlots()
    {
        var societyId = GetSocietyId();
        if (societyId == null) return Forbid();

        var occupied = await _context.AmenityBookings
            .Where(b => b.SocietyId == societyId && b.Status != BookingStatus.Rejected && b.Status != BookingStatus.Cancelled)
            .Select(b => new OccupiedSlotDto
            {
                AmenityId = b.AmenityId,
                BookingDate = b.BookingDate,
                TimeSlot = b.TimeSlot
            })
            .ToListAsync();

        return Ok(occupied);
    }

    [HttpPost("bookings")]
    [Authorize(Roles = "Resident")]
    public async Task<ActionResult<BookingDto>> CreateBooking([FromBody] CreateBookingRequest request)
    {
        var societyId = GetSocietyId();
        var userId = GetUserId();
        if (societyId == null) return Forbid();

        // Check if amenity exists and belongs to user's society
        var amenityExists = await _context.Amenities.AnyAsync(a => a.Id == request.AmenityId);
        if (!amenityExists) return BadRequest("Invalid AmenityId");

        // Check for duplicate booking
        var exists = await _context.AmenityBookings.AnyAsync(b =>
            b.AmenityId == request.AmenityId && b.BookingDate.Date == request.BookingDate.Date &&
            b.TimeSlot == request.TimeSlot && b.Status != BookingStatus.Rejected && b.Status != BookingStatus.Cancelled);

        if (exists) return BadRequest("This time slot is already booked");

        var booking = new AmenityBooking
        {
            SocietyId = societyId.Value, AmenityId = request.AmenityId,
            ResidentId = userId, BookingDate = request.BookingDate,
            TimeSlot = request.TimeSlot, Purpose = request.Purpose
        };
        _context.AmenityBookings.Add(booking);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetBookings), new BookingDto { Id = booking.Id, Status = booking.Status.ToString() });
    }

    [HttpPut("bookings/{id}/status")]
    [Authorize(Roles = "SuperAdmin,SocietyAdmin")]
    public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] UpdateBookingStatusRequest request)
    {
        var societyId = GetSocietyId();
        var booking = await _context.AmenityBookings.FirstOrDefaultAsync(b => b.Id == id && b.SocietyId == societyId);
        if (booking == null) return NotFound();

        if (Enum.TryParse<BookingStatus>(request.Status, true, out var status))
        {
            booking.Status = status;
            await _context.SaveChangesAsync();
            await _notificationService.CreateNotificationAsync(societyId!.Value, booking.ResidentId, "Booking Update", $"Your amenity booking has been {request.Status}.", "Amenity");
        }
        return Ok(new { message = "Booking status updated" });
    }
}
