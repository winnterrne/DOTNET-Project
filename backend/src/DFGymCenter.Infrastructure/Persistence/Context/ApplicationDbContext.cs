using System.Reflection;
using DFGymCenter.Application.Common.Interfaces;
using DFGymCenter.Domain.Common;
using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Infrastructure.Persistence.Context;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<MemberCard> MemberCards => Set<MemberCard>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<MembershipPlan> MembershipPlans => Set<MembershipPlan>();
    public DbSet<PlanBranch> PlanBranches => Set<PlanBranch>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<FreezeRequest> FreezeRequests => Set<FreezeRequest>();
    public DbSet<GymClass> Classes => Set<GymClass>();
    public DbSet<ClassSession> ClassSessions => Set<ClassSession>();
    public DbSet<TrainerAvailability> TrainerAvailabilities => Set<TrainerAvailability>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<WaitlistEntry> WaitlistEntries => Set<WaitlistEntry>();
    public DbSet<Checkin> Checkins => Set<Checkin>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<EquipmentIssue> EquipmentIssues => Set<EquipmentIssue>();
    public DbSet<EquipmentIssueLog> EquipmentIssueLogs => Set<EquipmentIssueLog>();
    public DbSet<BodyMetric> BodyMetrics => Set<BodyMetric>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Notification> Notifications => Set<Notification>();

    // Thực thể mới bổ sung từ sơ đồ ERD cập nhật
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<NutritionPlan> NutritionPlans => Set<NutritionPlan>();
    public DbSet<BodyMeasurement> BodyMeasurements => Set<BodyMeasurement>();
    public DbSet<MetricType> MetricTypes => Set<MetricType>();
    public DbSet<MeasurementValue> MeasurementValues => Set<MeasurementValue>();
    public DbSet<GymNews> GymNews => Set<GymNews>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
