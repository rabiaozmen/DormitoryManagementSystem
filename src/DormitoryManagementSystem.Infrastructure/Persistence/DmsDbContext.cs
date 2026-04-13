using DormitoryManagementSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DormitoryManagementSystem.Infrastructure.Persistence;

public sealed class DmsDbContext(DbContextOptions<DmsDbContext> options) : DbContext(options)
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<DiningMenu> DiningMenus => Set<DiningMenu>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<EntryExitLog> EntryExitLogs => Set<EntryExitLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseIdentityByDefaultColumns();
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DmsDbContext).Assembly);
        
        modelBuilder.Entity<Announcement>(builder =>
        {
            builder.ToTable("announcements");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Title).IsRequired().HasMaxLength(200);
            builder.Property(a => a.Content).IsRequired();
            builder.Property(a => a.TargetAudience).HasMaxLength(20);
        });

        base.OnModelCreating(modelBuilder);
    }
}
