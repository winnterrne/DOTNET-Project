using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class GymRuleConfiguration : IEntityTypeConfiguration<GymRule>
{
    public void Configure(EntityTypeBuilder<GymRule> builder)
    {
        builder.ToTable("Gym_Rules");
        builder.HasKey(gr => gr.Id);

        builder.Property(gr => gr.BranchId)
            .HasColumnName("Branch_Id");

        builder.Property(gr => gr.CreatedBy)
            .HasColumnName("Created_By");

        builder.Property(gr => gr.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(gr => gr.Content)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(gr => gr.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(gr => gr.IsActive)
            .HasColumnName("Is_Active")
            .HasDefaultValue(true);

        builder.Property(gr => gr.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.Property(gr => gr.UpdatedAt)
            .HasColumnName("Updated_At");

        builder.HasOne(gr => gr.Branch)
            .WithMany(b => b.GymRules)
            .HasForeignKey(gr => gr.BranchId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(gr => gr.Creator)
            .WithMany(u => u.CreatedGymRules)
            .HasForeignKey(gr => gr.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
