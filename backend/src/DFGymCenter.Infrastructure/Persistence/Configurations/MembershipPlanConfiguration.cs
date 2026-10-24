using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MembershipPlanConfiguration : IEntityTypeConfiguration<MembershipPlan>
{
    public void Configure(EntityTypeBuilder<MembershipPlan> builder)
    {
        builder.ToTable("Membership_Plans");
        builder.HasKey(mp => mp.Id);

        builder.Property(mp => mp.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(mp => mp.DurationDays)
            .HasColumnName("Duration_Days")
            .IsRequired();

        builder.Property(mp => mp.Price)
            .HasPrecision(18, 2)
            .IsRequired();

        builder.Property(mp => mp.PriorityLevel)
            .HasColumnName("Priority_Level");

        builder.Property(mp => mp.MaxBookingsPerMonth)
            .HasColumnName("Max_Bookings_Per_Month");

        builder.Property(mp => mp.MaxFreezeTimes)
            .HasColumnName("Max_Freeze_Times");

        builder.Property(mp => mp.MaxFreezeDays)
            .HasColumnName("Max_Freeze_Days");

        builder.Property(mp => mp.IsAllBranches)
            .HasColumnName("Is_All_Branches");

        builder.Property(mp => mp.PlanType)
            .HasColumnName("Plan_Type")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(mp => mp.PtSessions)
            .HasColumnName("Pt_Sessions");
    }
}
