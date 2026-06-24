using Microsoft.EntityFrameworkCore;
using SocietyManagement.Application.DTOs.Dashboard;
using SocietyManagement.Application.Interfaces;
using SocietyManagement.Domain.Enums;
using SocietyManagement.Infrastructure.Data;

namespace SocietyManagement.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetAdminDashboardAsync(int societyId)
    {
        // 1. Total Maintenance Collected
        var totalCollected = await _context.Payments
            .Where(p => p.SocietyId == societyId)
            .SumAsync(p => p.Amount);

        // 2. Pending Maintenance Amount
        var pendingAmount = await _context.MaintenanceInvoices
            .Where(i => i.SocietyId == societyId && (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.Overdue))
            .SumAsync(i => i.Amount);

        // 3. Open Complaints
        var openComplaints = await _context.Complaints
            .CountAsync(c => c.SocietyId == societyId && (c.Status == ComplaintStatus.Open || c.Status == ComplaintStatus.InProgress));

        // 4. Active Visitors
        var activeVisitors = await _context.VisitorLogs
            .CountAsync(v => v.SocietyId == societyId && v.IsActive);

        // 5. Upcoming Meetings (Event Notices)
        var upcomingMeetings = await _context.Notices
            .CountAsync(n => n.SocietyId == societyId && n.Category == "Event" && n.PublishedDate >= DateTime.UtcNow.AddDays(-30));

        // 6. Flats Stats
        var totalFlats = await _context.Flats.CountAsync(f => f.SocietyId == societyId);
        var occupiedFlats = await _context.Flats.CountAsync(f => f.SocietyId == societyId && f.IsOccupied);
        var vacantFlats = totalFlats - occupiedFlats;

        // 7. Monthly Collections
        var payments = await _context.Payments
            .Where(p => p.SocietyId == societyId)
            .Select(p => new { p.PaymentDate, p.Amount })
            .ToListAsync();

        var monthlyCollections = payments
            .GroupBy(p => new { p.PaymentDate.Year, p.PaymentDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new MonthlyCollectionDto
            {
                Month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                Amount = g.Sum(p => p.Amount)
            })
            .ToList();

        // 8. Complaints By Category
        var complaintsByCategory = await _context.Complaints
            .Where(c => c.SocietyId == societyId)
            .GroupBy(c => c.Category)
            .Select(g => new ComplaintsByCategoryDto
            {
                Category = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return new DashboardDto
        {
            TotalMaintenanceCollected = totalCollected,
            PendingMaintenanceAmount = pendingAmount,
            OpenComplaints = openComplaints,
            ActiveVisitors = activeVisitors,
            UpcomingMeetings = upcomingMeetings,
            TotalFlats = totalFlats,
            OccupiedFlats = occupiedFlats,
            VacantFlats = vacantFlats,
            MonthlyCollections = monthlyCollections,
            ComplaintsByCategory = complaintsByCategory
        };
    }

    public async Task<ResidentDashboardDto> GetResidentDashboardAsync(int userId, int societyId)
    {
        var profile = await _context.ResidentProfiles
            .Include(p => p.Flat).ThenInclude(f => f.Building)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.SocietyId == societyId);

        if (profile == null)
        {
            return new ResidentDashboardDto
            {
                TotalDues = 0,
                OpenComplaints = 0,
                ActiveBookings = 0,
                UnreadNotifications = 0,
                FlatNumber = string.Empty,
                BuildingName = string.Empty,
                RecentNotices = new()
            };
        }

        var totalDues = await _context.MaintenanceInvoices
            .Where(i => i.FlatId == profile.FlatId && (i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.Overdue))
            .SumAsync(i => i.Amount);

        var openComplaints = await _context.Complaints
            .CountAsync(c => c.ResidentId == userId && (c.Status == ComplaintStatus.Open || c.Status == ComplaintStatus.InProgress));

        var activeBookings = await _context.AmenityBookings
            .CountAsync(b => b.ResidentId == userId && 
                             (b.Status == BookingStatus.Requested || b.Status == BookingStatus.Approved) && 
                             b.BookingDate.Date >= DateTime.UtcNow.Date);

        var unreadNotifications = await _context.Notifications
            .CountAsync(n => n.UserId == userId && n.SocietyId == societyId && !n.IsRead);

        var recentNotices = await _context.Notices
            .Where(n => n.SocietyId == societyId && n.IsPublished)
            .OrderByDescending(n => n.PublishedDate)
            .Take(5)
            .Select(n => new RecentNoticeDto
            {
                Id = n.Id,
                Title = n.Title,
                Category = n.Category,
                PublishedDate = n.PublishedDate
            })
            .ToListAsync();

        return new ResidentDashboardDto
        {
            TotalDues = totalDues,
            OpenComplaints = openComplaints,
            ActiveBookings = activeBookings,
            UnreadNotifications = unreadNotifications,
            FlatNumber = profile.Flat.FlatNumber,
            BuildingName = profile.Flat.Building.Name,
            RecentNotices = recentNotices
        };
    }

    public async Task<SecurityDashboardDto> GetSecurityDashboardAsync(int societyId)
    {
        var activeVisitors = await _context.VisitorLogs
            .CountAsync(v => v.SocietyId == societyId && v.IsActive);

        var todayVisitors = await _context.VisitorLogs
            .CountAsync(v => v.SocietyId == societyId && v.EntryTime >= DateTime.UtcNow.Date);

        var staffCheckedIn = await _context.StaffAttendances
            .CountAsync(a => a.SocietyId == societyId && a.CheckInTime >= DateTime.UtcNow.Date && a.CheckOutTime == null);

        var parkingAlerts = await _context.ParkingAlerts
            .CountAsync(a => a.SocietyId == societyId && !a.IsResolved);

        var emergencyAlerts = await _context.EmergencyAlerts
            .CountAsync(a => a.SocietyId == societyId && !a.IsResolved);

        return new SecurityDashboardDto
        {
            ActiveVisitors = activeVisitors,
            TodayVisitors = todayVisitors,
            StaffCheckedIn = staffCheckedIn,
            ParkingAlerts = parkingAlerts,
            EmergencyAlerts = emergencyAlerts
        };
    }
}
