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

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
