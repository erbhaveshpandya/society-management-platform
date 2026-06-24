using Microsoft.EntityFrameworkCore;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Enums;

namespace SocietyManagement.Infrastructure.Data;

public static class SeedData
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        if (context.Societies.Any()) return; // Already seeded

        using var transaction = context.Database.BeginTransaction();
        try
        {
            // --- Societies ---
            var societies = new List<Society>
            {
                new() { Id = 1, Name = "Green Valley Residency", Address = "Plot 12, Sector 5, Wakad", City = "Pune", State = "Maharashtra", PinCode = "411057", RegistrationNumber = "MH-SOC-2020-001", ContactPhone = "9876543210", ContactEmail = "admin@greenvalley.com" },
                new() { Id = 2, Name = "Sunrise Heights", Address = "Tower Road, Baner", City = "Pune", State = "Maharashtra", PinCode = "411045", RegistrationNumber = "MH-SOC-2021-002", ContactPhone = "9876543211", ContactEmail = "admin@sunriseheights.com" }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Societies ON");
            context.Societies.AddRange(societies);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Societies OFF");

            // --- Buildings ---
            var buildings = new List<Building>
            {
                new() { Id = 1, SocietyId = 1, Name = "A Wing", TotalFloors = 10, Description = "Main residential building" },
                new() { Id = 2, SocietyId = 1, Name = "B Wing", TotalFloors = 8, Description = "Secondary residential building" },
                new() { Id = 3, SocietyId = 2, Name = "Tower 1", TotalFloors = 12, Description = "Premium tower" }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Buildings ON");
            context.Buildings.AddRange(buildings);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Buildings OFF");

            // --- Users ---
            var passwordHash = BCryptHash("Password123!");
            var users = new List<User>
            {
                new() { Id = 1, SocietyId = null, Email = "superadmin@smp.com", PasswordHash = passwordHash, FullName = "System Administrator", Phone = "9000000001", Role = UserRole.SuperAdmin },
                new() { Id = 2, SocietyId = 1, Email = "admin@greenvalley.com", PasswordHash = passwordHash, FullName = "Rajesh Sharma", Phone = "9000000002", Role = UserRole.SocietyAdmin },
                new() { Id = 3, SocietyId = 2, Email = "admin@sunriseheights.com", PasswordHash = passwordHash, FullName = "Priya Patel", Phone = "9000000003", Role = UserRole.SocietyAdmin },
                new() { Id = 4, SocietyId = 1, Email = "amit.kumar@email.com", PasswordHash = passwordHash, FullName = "Amit Kumar", Phone = "9000000004", Role = UserRole.Resident },
                new() { Id = 5, SocietyId = 1, Email = "sneha.joshi@email.com", PasswordHash = passwordHash, FullName = "Sneha Joshi", Phone = "9000000005", Role = UserRole.Resident },
                new() { Id = 6, SocietyId = 1, Email = "vikram.singh@email.com", PasswordHash = passwordHash, FullName = "Vikram Singh", Phone = "9000000006", Role = UserRole.Resident },
                new() { Id = 7, SocietyId = 2, Email = "neha.gupta@email.com", PasswordHash = passwordHash, FullName = "Neha Gupta", Phone = "9000000007", Role = UserRole.Resident },
                new() { Id = 8, SocietyId = 2, Email = "rahul.verma@email.com", PasswordHash = passwordHash, FullName = "Rahul Verma", Phone = "9000000008", Role = UserRole.Resident },
                new() { Id = 9, SocietyId = 1, Email = "security1@greenvalley.com", PasswordHash = passwordHash, FullName = "Ramesh Yadav", Phone = "9000000009", Role = UserRole.SecurityGuard },
                new() { Id = 10, SocietyId = 2, Email = "security1@sunriseheights.com", PasswordHash = passwordHash, FullName = "Suresh Patil", Phone = "9000000010", Role = UserRole.SecurityGuard },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Users ON");
            context.Users.AddRange(users);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Users OFF");

            // --- Flats ---
            var flats = new List<Flat>
            {
                new() { Id = 1, SocietyId = 1, BuildingId = 1, FlatNumber = "A-101", Floor = 1, Type = "2BHK", Area = 950, OwnerId = 4, IsOccupied = true },
                new() { Id = 2, SocietyId = 1, BuildingId = 1, FlatNumber = "A-102", Floor = 1, Type = "3BHK", Area = 1200, OwnerId = 5, IsOccupied = true },
                new() { Id = 3, SocietyId = 1, BuildingId = 1, FlatNumber = "A-201", Floor = 2, Type = "2BHK", Area = 950, IsOccupied = false },
                new() { Id = 4, SocietyId = 1, BuildingId = 2, FlatNumber = "B-101", Floor = 1, Type = "1BHK", Area = 650, OwnerId = 6, IsOccupied = true },
                new() { Id = 5, SocietyId = 1, BuildingId = 2, FlatNumber = "B-102", Floor = 1, Type = "2BHK", Area = 900, IsOccupied = false },
                new() { Id = 6, SocietyId = 1, BuildingId = 2, FlatNumber = "B-201", Floor = 2, Type = "3BHK", Area = 1300, IsOccupied = false },
                new() { Id = 7, SocietyId = 2, BuildingId = 3, FlatNumber = "T1-101", Floor = 1, Type = "2BHK", Area = 1000, OwnerId = 7, IsOccupied = true },
                new() { Id = 8, SocietyId = 2, BuildingId = 3, FlatNumber = "T1-102", Floor = 1, Type = "3BHK", Area = 1400, OwnerId = 8, IsOccupied = true },
                new() { Id = 9, SocietyId = 2, BuildingId = 3, FlatNumber = "T1-201", Floor = 2, Type = "1000", IsOccupied = false },
                new() { Id = 10, SocietyId = 2, BuildingId = 3, FlatNumber = "T1-202", Floor = 2, Type = "1BHK", Area = 700, IsOccupied = false },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Flats ON");
            context.Flats.AddRange(flats);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Flats OFF");

            // --- Resident Profiles ---
            var profiles = new List<ResidentProfile>
            {
                new() { Id = 1, SocietyId = 1, UserId = 4, FlatId = 1, ResidentType = "Owner", MoveInDate = new DateTime(2022, 1, 15) },
                new() { Id = 2, SocietyId = 1, UserId = 5, FlatId = 2, ResidentType = "Owner", MoveInDate = new DateTime(2021, 6, 1) },
                new() { Id = 3, SocietyId = 1, UserId = 6, FlatId = 4, ResidentType = "Tenant", MoveInDate = new DateTime(2023, 3, 10) },
                new() { Id = 4, SocietyId = 2, UserId = 7, FlatId = 7, ResidentType = "Owner", MoveInDate = new DateTime(2022, 8, 20) },
                new() { Id = 5, SocietyId = 2, UserId = 8, FlatId = 8, ResidentType = "Tenant", MoveInDate = new DateTime(2023, 11, 1) },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT ResidentProfiles ON");
            context.ResidentProfiles.AddRange(profiles);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT ResidentProfiles OFF");

            // --- Vehicles ---
            var vehicles = new List<Vehicle>
            {
                new() { Id = 1, SocietyId = 1, ResidentProfileId = 1, VehicleNumber = "MH-12-AB-1234", Type = "Car", Make = "Maruti", Model = "Swift" },
                new() { Id = 2, SocietyId = 1, ResidentProfileId = 1, VehicleNumber = "MH-12-CD-5678", Type = "Bike", Make = "Honda", Model = "Activa" },
                new() { Id = 3, SocietyId = 1, ResidentProfileId = 2, VehicleNumber = "MH-12-EF-9012", Type = "Car", Make = "Hyundai", Model = "Creta" },
                new() { Id = 4, SocietyId = 2, ResidentProfileId = 4, VehicleNumber = "MH-14-GH-3456", Type = "Car", Make = "Tata", Model = "Nexon" },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Vehicles ON");
            context.Vehicles.AddRange(vehicles);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Vehicles OFF");

            // --- Vendors ---
            var vendors = new List<Vendor>
            {
                new() { Id = 1, SocietyId = 1, Name = "CleanPro Services", Contact = "9111000001", ServiceType = "Housekeeping", Email = "cleanpro@email.com" },
                new() { Id = 2, SocietyId = 1, Name = "GreenGarden Landscaping", Contact = "9111000002", ServiceType = "Gardening", Email = "greengarden@email.com" },
                new() { Id = 3, SocietyId = 2, Name = "FixIt Plumbing", Contact = "9111000003", ServiceType = "Plumbing", Email = "fixit@email.com" },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Vendors ON");
            context.Vendors.AddRange(vendors);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Vendors OFF");

            // --- Maintenance Invoices ---
            var invoices = new List<MaintenanceInvoice>
            {
                new() { Id = 1, SocietyId = 1, FlatId = 1, Amount = 3500, Description = "Monthly Maintenance", BillingMonth = "June 2026", DueDate = new DateTime(2026, 6, 30), Status = InvoiceStatus.Paid },
                new() { Id = 2, SocietyId = 1, FlatId = 2, Amount = 4500, Description = "Monthly Maintenance", BillingMonth = "June 2026", DueDate = new DateTime(2026, 6, 30), Status = InvoiceStatus.Pending },
                new() { Id = 3, SocietyId = 1, FlatId = 4, Amount = 2500, Description = "Monthly Maintenance", BillingMonth = "June 2026", DueDate = new DateTime(2026, 6, 30), Status = InvoiceStatus.Overdue },
                new() { Id = 4, SocietyId = 2, FlatId = 7, Amount = 5000, Description = "Monthly Maintenance", BillingMonth = "June 2026", DueDate = new DateTime(2026, 6, 30), Status = InvoiceStatus.Pending },
                new() { Id = 5, SocietyId = 2, FlatId = 8, Amount = 6000, Description = "Monthly Maintenance", BillingMonth = "June 2026", DueDate = new DateTime(2026, 6, 30), Status = InvoiceStatus.PendingApproval },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT MaintenanceInvoices ON");
            context.MaintenanceInvoices.AddRange(invoices);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT MaintenanceInvoices OFF");

            // --- Payments ---
            var payments = new List<Payment>
            {
                new() { Id = 1, SocietyId = 1, InvoiceId = 1, Amount = 3500, PaymentDate = new DateTime(2026, 6, 15), Method = "UPI", TransactionRef = "TXN-20260615-001", ReceiptNumber = "RCP-001" }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Payments ON");
            context.Payments.AddRange(payments);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Payments OFF");

            // --- Expenses ---
            var expenses = new List<Expense>
            {
                new() { Id = 1, SocietyId = 1, Category = "Housekeeping", Amount = 15000, Date = new DateTime(2026, 6, 1), VoucherNumber = "VCH-001", VendorId = 1, Description = "Monthly housekeeping charges", Status = ExpenseStatus.Paid },
                new() { Id = 2, SocietyId = 1, Category = "Gardening", Amount = 8000, Date = new DateTime(2026, 6, 5), VoucherNumber = "VCH-002", VendorId = 2, Description = "Garden maintenance", Status = ExpenseStatus.Approved },
                new() { Id = 3, SocietyId = 1, Category = "Electricity", Amount = 25000, Date = new DateTime(2026, 6, 10), VoucherNumber = "VCH-003", Description = "Common area electricity bill", Status = ExpenseStatus.Pending },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Expenses ON");
            context.Expenses.AddRange(expenses);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Expenses OFF");

            // --- Complaints ---
            var complaints = new List<Complaint>
            {
                new() { Id = 1, SocietyId = 1, FlatId = 1, ResidentId = 4, Subject = "Water leakage in bathroom", Description = "There is continuous water leakage from the ceiling of my bathroom. Please send a plumber.", Category = "Plumbing", Status = ComplaintStatus.Open, Priority = ComplaintPriority.High },
                new() { Id = 2, SocietyId = 1, FlatId = 2, ResidentId = 5, Subject = "Elevator not working", Description = "The elevator in A Wing has been out of service since yesterday evening.", Category = "Infrastructure", Status = ComplaintStatus.InProgress, Priority = ComplaintPriority.Critical },
                new() { Id = 3, SocietyId = 2, FlatId = 7, ResidentId = 7, Subject = "Noisy construction nearby", Description = "Construction work is happening after 10 PM which is causing disturbance.", Category = "Noise", Status = ComplaintStatus.Open, Priority = ComplaintPriority.Medium },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Complaints ON");
            context.Complaints.AddRange(complaints);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Complaints OFF");

            // --- Complaint Comments ---
            var comments = new List<ComplaintComment>
            {
                new() { Id = 1, ComplaintId = 2, UserId = 2, Comment = "We have contacted the elevator maintenance company. They will visit tomorrow.", CreatedAt = DateTime.UtcNow.AddHours(-2) },
                new() { Id = 2, ComplaintId = 2, UserId = 5, Comment = "Thank you for the update. Please expedite.", CreatedAt = DateTime.UtcNow.AddHours(-1) }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT ComplaintComments ON");
            context.ComplaintComments.AddRange(comments);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT ComplaintComments OFF");

            // --- Notices ---
            var notices = new List<Notice>
            {
                new() { Id = 1, SocietyId = 1, Title = "Annual General Meeting", Content = "The Annual General Meeting of Green Valley Residency will be held on June 30, 2026, at 6:00 PM in the community hall. All members are requested to attend.", Category = "General", CreatedBy = 2 },
                new() { Id = 2, SocietyId = 1, Title = "Water Supply Disruption", Content = "Due to pipeline maintenance, water supply will be disrupted on June 25, 2026, from 10:00 AM to 2:00 PM. Please store water accordingly.", Category = "Maintenance", CreatedBy = 2 },
                new() { Id = 3, SocietyId = 2, Title = "Diwali Celebration", Content = "Sunrise Heights is organizing a Diwali celebration on November 1, 2026, at the clubhouse. All residents are invited with their families.", Category = "Event", CreatedBy = 3 },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Notices ON");
            context.Notices.AddRange(notices);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Notices OFF");

            // --- Polls ---
            var polls = new List<Poll>
            {
                new() { Id = 1, SocietyId = 1, Question = "Should we install CCTV cameras in parking area?", Description = "Proposal to install 8 CCTV cameras in the parking area for enhanced security.", Status = PollStatus.Active, StartDate = DateTime.UtcNow.AddDays(-5), EndDate = DateTime.UtcNow.AddDays(10), CreatedBy = 2 },
                new() { Id = 2, SocietyId = 1, Question = "Preferred time for society meeting?", Description = "Please vote for your preferred meeting time.", Status = PollStatus.Active, StartDate = DateTime.UtcNow.AddDays(-2), EndDate = DateTime.UtcNow.AddDays(5), CreatedBy = 2 },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Polls ON");
            context.Polls.AddRange(polls);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Polls OFF");

            // --- Poll Options ---
            var pollOptions = new List<PollOption>
            {
                new() { Id = 1, PollId = 1, OptionText = "Yes, install cameras", VoteCount = 3 },
                new() { Id = 2, PollId = 1, OptionText = "No, not needed", VoteCount = 1 },
                new() { Id = 3, PollId = 1, OptionText = "Yes, but only at entry/exit points", VoteCount = 2 },
                new() { Id = 4, PollId = 2, OptionText = "6:00 PM - 7:00 PM", VoteCount = 2 },
                new() { Id = 5, PollId = 2, OptionText = "7:00 PM - 8:00 PM", VoteCount = 1 },
                new() { Id = 6, PollId = 2, OptionText = "8:00 PM - 9:00 PM", VoteCount = 0 },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT PollOptions ON");
            context.PollOptions.AddRange(pollOptions);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT PollOptions OFF");

            // --- Amenities ---
            var amenities = new List<Amenity>
            {
                new() { Id = 1, SocietyId = 1, Name = "Clubhouse", Description = "Community clubhouse with AC hall, kitchen and restrooms", Location = "Ground Floor, A Wing", OpenTime = "08:00", CloseTime = "22:00" },
                new() { Id = 2, SocietyId = 1, Name = "Swimming Pool", Description = "25m Olympic-style swimming pool", Location = "Behind B Wing", OpenTime = "06:00", CloseTime = "20:00" },
                new() { Id = 3, SocietyId = 2, Name = "Tennis Court", Description = "Professional synthetic tennis court", Location = "Sports Complex", OpenTime = "06:00", CloseTime = "21:00" },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Amenities ON");
            context.Amenities.AddRange(amenities);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Amenities OFF");

            // --- Amenity Bookings ---
            var bookings = new List<AmenityBooking>
            {
                new() { Id = 1, SocietyId = 1, AmenityId = 1, ResidentId = 4, BookingDate = DateTime.UtcNow.AddDays(3), TimeSlot = "18:00-21:00", Purpose = "Birthday party", Status = BookingStatus.Approved }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT AmenityBookings ON");
            context.AmenityBookings.AddRange(bookings);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT AmenityBookings OFF");

            // --- Staff ---
            var staffMembers = new List<Staff>
            {
                new() { Id = 1, SocietyId = 1, Name = "Lakshmi Devi", Phone = "9222000001", Role = "Maid" },
                new() { Id = 2, SocietyId = 1, Name = "Raju Kumar", Phone = "9222000002", Role = "Cook" },
                new() { Id = 3, SocietyId = 1, Name = "Mohan Singh", Phone = "9222000003", Role = "Driver" },
                new() { Id = 4, SocietyId = 2, Name = "Sunita Bai", Phone = "9222000004", Role = "Maid" },
                new() { Id = 5, SocietyId = 2, Name = "Ganesh Pawar", Phone = "9222000005", Role = "Gardener" },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Staff ON");
            context.Staff.AddRange(staffMembers);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Staff OFF");

            // --- Resident-Staff Mappings ---
            var mappings = new List<ResidentStaffMapping>
            {
                new() { Id = 1, SocietyId = 1, ResidentProfileId = 1, StaffId = 1 },
                new() { Id = 2, SocietyId = 1, ResidentProfileId = 1, StaffId = 3 },
                new() { Id = 3, SocietyId = 1, ResidentProfileId = 2, StaffId = 1 },
                new() { Id = 4, SocietyId = 1, ResidentProfileId = 2, StaffId = 2 }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT ResidentStaffMappings ON");
            context.ResidentStaffMappings.AddRange(mappings);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT ResidentStaffMappings OFF");

            // --- Visitor Logs ---
            var visitors = new List<VisitorLog>
            {
                new() { Id = 1, SocietyId = 1, VisitorName = "Delivery - Swiggy", Phone = "9333000001", FlatId = 1, Purpose = "Food Delivery", EntryTime = DateTime.UtcNow.AddMinutes(-30), CheckedInBy = 9, IsActive = true },
                new() { Id = 2, SocietyId = 1, VisitorName = "Arun Mehta", Phone = "9333000002", VehicleNumber = "MH-12-XY-7890", FlatId = 2, Purpose = "Guest Visit", EntryTime = DateTime.UtcNow.AddHours(-1), CheckedInBy = 9, IsActive = true },
                new() { Id = 3, SocietyId = 1, VisitorName = "Plumber - City Works", Phone = "9333000003", FlatId = 1, Purpose = "Plumbing Repair", EntryTime = DateTime.UtcNow.AddHours(-3), ExitTime = DateTime.UtcNow.AddHours(-1), CheckedInBy = 9, IsActive = false },
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT VisitorLogs ON");
            context.VisitorLogs.AddRange(visitors);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT VisitorLogs OFF");

            // --- Staff Attendance ---
            var attendanceList = new List<StaffAttendance>
            {
                new() { Id = 1, SocietyId = 1, StaffId = 1, CheckInTime = DateTime.UtcNow.Date.AddHours(8), MarkedBy = 9 },
                new() { Id = 2, SocietyId = 1, StaffId = 2, CheckInTime = DateTime.UtcNow.Date.AddHours(9), CheckOutTime = DateTime.UtcNow.Date.AddHours(13), MarkedBy = 9 }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT StaffAttendances ON");
            context.StaffAttendances.AddRange(attendanceList);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT StaffAttendances OFF");

            // --- Notifications ---
            var notifications = new List<Notification>
            {
                new() { Id = 1, SocietyId = 1, UserId = 4, Title = "New Notice Published", Message = "Annual General Meeting notice has been published.", Type = "Notice" },
                new() { Id = 2, SocietyId = 1, UserId = 4, Title = "Maintenance Due", Message = "Your maintenance invoice for June 2026 is due.", Type = "Maintenance" },
                new() { Id = 3, SocietyId = 1, UserId = 5, Title = "Complaint Update", Message = "Your complaint 'Elevator not working' has been updated to In Progress.", Type = "Complaint" }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Notifications ON");
            context.Notifications.AddRange(notifications);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Notifications OFF");

            // --- Audit Logs ---
            var logs = new List<AuditLog>
            {
                new() { Id = 1, SocietyId = 1, UserId = 2, Action = "Login", EntityType = "User", EntityId = 2, Details = "Society Admin logged in" },
                new() { Id = 2, SocietyId = 1, UserId = 2, Action = "InvoiceGenerated", EntityType = "MaintenanceInvoice", EntityId = 1, Details = "Generated maintenance invoice for Flat A-101" }
            };
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT AuditLogs ON");
            context.AuditLogs.AddRange(logs);
            context.SaveChanges();
            context.Database.ExecuteSqlRaw("SET IDENTITY_INSERT AuditLogs OFF");

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    private static string BCryptHash(string password)
    {
        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes("SocietyManagementPlatformSecretKey2026!"));
        var hash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hash);
    }
}
