using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DFGymCenter.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Staff> Staff { get; }
    DbSet<Trainer> Trainers { get; }
    DbSet<Member> Members { get; }
    DbSet<MemberCard> MemberCards { get; }
    DbSet<Branch> Branches { get; }
    DbSet<MembershipPlan> MembershipPlans { get; }
    DbSet<PlanBranch> PlanBranches { get; }
    DbSet<Membership> Memberships { get; }
    DbSet<Payment> Payments { get; }
    DbSet<FreezeRequest> FreezeRequests { get; }
    DbSet<GymClass> Classes { get; }
    DbSet<ClassSession> ClassSessions { get; }
    DbSet<TrainerAvailability> TrainerAvailabilities { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<WaitlistEntry> WaitlistEntries { get; }
    DbSet<Checkin> Checkins { get; }
    DbSet<Equipment> Equipments { get; }
    DbSet<EquipmentIssue> EquipmentIssues { get; }
    DbSet<EquipmentIssueLog> EquipmentIssueLogs { get; }
    DbSet<BodyMetric> BodyMetrics { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Notification> Notifications { get; }

    // Thực thể mới bổ sung từ sơ đồ ERD cập nhật
    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<NutritionPlan> NutritionPlans { get; }
    DbSet<BodyMeasurement> BodyMeasurements { get; }
    DbSet<MetricType> MetricTypes { get; }
    DbSet<MeasurementValue> MeasurementValues { get; }
    DbSet<GymNews> GymNews { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
