using Microsoft.EntityFrameworkCore;
using SocietyManagement.Domain.Entities;
using SocietyManagement.Domain.Interfaces;
using SocietyManagement.Application.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SocietyManagement.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ICurrentTenantService _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentTenantService tenantService) 
        : base(options) 
    {
        _tenantService = tenantService;
    }

    public DbSet<Society> Societies => Set<Society>();
    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<Flat> Flats => Set<Flat>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ResidentProfile> ResidentProfiles => Set<ResidentProfile>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<MaintenanceInvoice> MaintenanceInvoices => Set<MaintenanceInvoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Complaint> Complaints => Set<Complaint>();
    public DbSet<ComplaintComment> ComplaintComments => Set<ComplaintComment>();
    public DbSet<ComplaintAttachment> ComplaintAttachments => Set<ComplaintAttachment>();
    public DbSet<Notice> Notices => Set<Notice>();
    public DbSet<Poll> Polls => Set<Poll>();
    public DbSet<PollOption> PollOptions => Set<PollOption>();
    public DbSet<PollVote> PollVotes => Set<PollVote>();
    public DbSet<Amenity> Amenities => Set<Amenity>();
    public DbSet<AmenityBooking> AmenityBookings => Set<AmenityBooking>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<StaffAttendance> StaffAttendances => Set<StaffAttendance>();
    public DbSet<ResidentStaffMapping> ResidentStaffMappings => Set<ResidentStaffMapping>();
    public DbSet<VisitorLog> VisitorLogs => Set<VisitorLog>();
    public DbSet<VisitorPass> VisitorPasses => Set<VisitorPass>();
    public DbSet<ParkingAlert> ParkingAlerts => Set<ParkingAlert>();
    public DbSet<EmergencyAlert> EmergencyAlerts => Set<EmergencyAlert>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();

    public override int SaveChanges()
    {
        SetTenantId();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SetTenantId();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void SetTenantId()
    {
        var tenantId = _tenantService.TenantId;
        if (tenantId == null) return;

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity is ITenantEntity tenantEntity && tenantEntity.SocietyId == 0)
                {
                    tenantEntity.SocietyId = tenantId.Value;
                }
                else if (entry.Entity is INullableTenantEntity nullableEntity && nullableEntity.SocietyId == null)
                {
                    nullableEntity.SocietyId = tenantId.Value;
                }
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Society
        modelBuilder.Entity<Society>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.RegistrationNumber).IsUnique();
        });

        // Building
        modelBuilder.Entity<Building>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany(s => s.Buildings).HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
        });

        // Flat
        modelBuilder.Entity<Flat>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany(s => s.Flats).HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Building).WithMany(b => b.Flats).HasForeignKey(e => e.BuildingId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Owner).WithMany().HasForeignKey(e => e.OwnerId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(e => new { e.SocietyId, e.BuildingId, e.FlatNumber }).IsUnique();
        });

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany(s => s.Users).HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // ResidentProfile
        modelBuilder.Entity<ResidentProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithOne(u => u.ResidentProfile).HasForeignKey<ResidentProfile>(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Flat).WithMany(f => f.Residents).HasForeignKey(e => e.FlatId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
        });

        // Vehicle
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.ResidentProfile).WithMany(r => r.Vehicles).HasForeignKey(e => e.ResidentProfileId).OnDelete(DeleteBehavior.Cascade);
        });

        // MaintenanceInvoice
        modelBuilder.Entity<MaintenanceInvoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Flat).WithMany().HasForeignKey(e => e.FlatId).OnDelete(DeleteBehavior.Restrict);
        });

        // Payment
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Invoice).WithOne(i => i.Payment).HasForeignKey<Payment>(e => e.InvoiceId).OnDelete(DeleteBehavior.Restrict);
        });

        // Expense
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Vendor).WithMany().HasForeignKey(e => e.VendorId).OnDelete(DeleteBehavior.SetNull);
        });

        // Vendor
        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
        });

        // Complaint
        modelBuilder.Entity<Complaint>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Flat).WithMany().HasForeignKey(e => e.FlatId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Resident).WithMany().HasForeignKey(e => e.ResidentId).OnDelete(DeleteBehavior.Restrict);
        });

        // ComplaintComment
        modelBuilder.Entity<ComplaintComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Complaint).WithMany(c => c.Comments).HasForeignKey(e => e.ComplaintId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        // ComplaintAttachment
        modelBuilder.Entity<ComplaintAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Complaint).WithMany(c => c.Attachments).HasForeignKey(e => e.ComplaintId).OnDelete(DeleteBehavior.Cascade);
        });

        // Notice
        modelBuilder.Entity<Notice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Creator).WithMany().HasForeignKey(e => e.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // Poll
        modelBuilder.Entity<Poll>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Creator).WithMany().HasForeignKey(e => e.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // PollOption
        modelBuilder.Entity<PollOption>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Poll).WithMany(p => p.Options).HasForeignKey(e => e.PollId).OnDelete(DeleteBehavior.Cascade);
        });

        // PollVote
        modelBuilder.Entity<PollVote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Poll).WithMany(p => p.Votes).HasForeignKey(e => e.PollId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PollOption).WithMany().HasForeignKey(e => e.PollOptionId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.PollId, e.UserId }).IsUnique(); // One vote per user per poll
        });

        // Amenity
        modelBuilder.Entity<Amenity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
        });

        // AmenityBooking
        modelBuilder.Entity<AmenityBooking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Amenity).WithMany(a => a.Bookings).HasForeignKey(e => e.AmenityId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Resident).WithMany().HasForeignKey(e => e.ResidentId).OnDelete(DeleteBehavior.Restrict);
            // Prevent duplicate booking for same amenity, date and time slot
            entity.HasIndex(e => new { e.AmenityId, e.BookingDate, e.TimeSlot }).IsUnique();
        });

        // Staff
        modelBuilder.Entity<Staff>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
        });

        // StaffAttendance
        modelBuilder.Entity<StaffAttendance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Staff).WithMany(s => s.AttendanceRecords).HasForeignKey(e => e.StaffId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.MarkedByUser).WithMany().HasForeignKey(e => e.MarkedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // ResidentStaffMapping
        modelBuilder.Entity<ResidentStaffMapping>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.ResidentProfile).WithMany().HasForeignKey(e => e.ResidentProfileId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Staff).WithMany(s => s.ResidentMappings).HasForeignKey(e => e.StaffId).OnDelete(DeleteBehavior.Cascade);
        });

        // VisitorLog
        modelBuilder.Entity<VisitorLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Flat).WithMany().HasForeignKey(e => e.FlatId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.CheckedInByUser).WithMany().HasForeignKey(e => e.CheckedInBy).OnDelete(DeleteBehavior.Restrict);
        });

        // VisitorPass
        modelBuilder.Entity<VisitorPass>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Flat).WithMany().HasForeignKey(e => e.FlatId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.Passcode).IsUnique();
        });

        // ParkingAlert
        modelBuilder.Entity<ParkingAlert>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ReportedByUser).WithMany().HasForeignKey(e => e.ReportedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // EmergencyAlert
        modelBuilder.Entity<EmergencyAlert>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ReportedByUser).WithMany().HasForeignKey(e => e.ReportedBy).OnDelete(DeleteBehavior.Restrict);
        });

        // Notification
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // SupportTicket
        modelBuilder.Entity<SupportTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Society).WithMany().HasForeignKey(e => e.SocietyId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.SubmittedByUser).WithMany().HasForeignKey(e => e.SubmittedById).OnDelete(DeleteBehavior.Restrict);
        });

        // Global Query Filters for Multi-Tenant Isolation
        modelBuilder.Entity<Building>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Flat>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<ResidentProfile>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Vehicle>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<MaintenanceInvoice>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Payment>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Expense>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Vendor>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Complaint>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<ComplaintComment>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<ComplaintAttachment>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Notice>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Poll>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<PollOption>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<PollVote>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Amenity>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<AmenityBooking>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Staff>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<StaffAttendance>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<ResidentStaffMapping>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<VisitorLog>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<VisitorPass>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<ParkingAlert>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<EmergencyAlert>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));
        modelBuilder.Entity<Notification>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == (_tenantService.TenantId ?? -1));

        modelBuilder.Entity<User>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == _tenantService.TenantId);
        modelBuilder.Entity<AuditLog>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == _tenantService.TenantId);
        modelBuilder.Entity<SupportTicket>().HasQueryFilter(e => _tenantService.IsSuperAdmin || e.SocietyId == _tenantService.TenantId);
    }
}
