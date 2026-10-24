using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class PlanBranchConfiguration : IEntityTypeConfiguration<PlanBranch>
{
    public void Configure(EntityTypeBuilder<PlanBranch> builder)
    {
        builder.ToTable("Plan_Branches");
        builder.HasKey(pb => new { pb.PlanId, pb.BranchId });

        builder.Property(pb => pb.PlanId)
            .HasColumnName("Plan_Id");

        builder.Property(pb => pb.BranchId)
            .HasColumnName("Branch_Id");

        builder.HasOne(pb => pb.Plan)
            .WithMany(mp => mp.PlanBranches)
            .HasForeignKey(pb => pb.PlanId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pb => pb.Branch)
            .WithMany(b => b.PlanBranches)
            .HasForeignKey(pb => pb.BranchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
