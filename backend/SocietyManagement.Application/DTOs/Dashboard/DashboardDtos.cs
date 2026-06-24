namespace SocietyManagement.Application.DTOs.Dashboard;

public class DashboardDto
{
    public decimal TotalMaintenanceCollected { get; set; }
    public decimal PendingMaintenanceAmount { get; set; }
    public int OpenComplaints { get; set; }
    public int ActiveVisitors { get; set; }
    public int UpcomingMeetings { get; set; }
    public int TotalFlats { get; set; }
    public int OccupiedFlats { get; set; }
    public int VacantFlats { get; set; }
    public List<MonthlyCollectionDto> MonthlyCollections { get; set; } = new();
    public List<ComplaintsByCategoryDto> ComplaintsByCategory { get; set; } = new();
}

public class MonthlyCollectionDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class ComplaintsByCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ResidentDashboardDto
{
    public decimal TotalDues { get; set; }
    public int OpenComplaints { get; set; }
    public int ActiveBookings { get; set; }
    public int UnreadNotifications { get; set; }
    public string FlatNumber { get; set; } = string.Empty;
    public string BuildingName { get; set; } = string.Empty;
    public List<RecentNoticeDto> RecentNotices { get; set; } = new();
}

public class RecentNoticeDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public DateTime PublishedDate { get; set; }
}

public class SecurityDashboardDto
{
    public int ActiveVisitors { get; set; }
    public int TodayVisitors { get; set; }
    public int StaffCheckedIn { get; set; }
    public int ParkingAlerts { get; set; }
    public int EmergencyAlerts { get; set; }
}
