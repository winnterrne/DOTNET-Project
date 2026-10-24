using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class MembershipConfiguration : IEntityTypeConfiguration<Membership>
{
    public void Configure(EntityTypeBuilder<Membership> builder)
    {
        builder.ToTable("Memberships");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.MemberId)
            .HasColumnName("Member_Id")
            .IsRequired();

        builder.Property(m => m.PlanId)
            .HasColumnName("Plan_Id")
            .IsRequired();

        builder.Property(m => m.RenewedFromId)
            .HasColumnName("Renewed_From_Id");

        builder.Property(m => m.StartDate)
            .HasColumnName("Start_Date")
            .IsRequired();

        builder.Property(m => m.EndDate)
            .HasColumnName("End_Date")
            .IsRequired();

        builder.Property(m => m.RemainingSessions)
            .HasColumnName("Remaining_Sessions");

        builder.Property(m => m.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(m => m.BranchId)
            .HasColumnName("Branch_Id");

        builder.HasOne(m => m.Member)
            .WithMany(mem => mem.Memberships)
            .HasForeignKey(m => m.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Plan)
            .WithMany(mp => mp.Memberships)
            .HasForeignKey(m => m.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.RenewedFrom)
            .WithMany(m => m.Renewals)
            .HasForeignKey(m => m.RenewedFromId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(m => m.Branch)
            .WithMany(b => b.Memberships)
            .HasForeignKey(m => m.BranchId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
