using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class EquipmentIssueConfiguration : IEntityTypeConfiguration<EquipmentIssue>
{
    public void Configure(EntityTypeBuilder<EquipmentIssue> builder)
    {
        builder.ToTable("Equipment_Issues");
        builder.HasKey(ei => ei.Id);

        builder.Property(ei => ei.EquipmentId)
            .HasColumnName("Equipment_Id")
            .IsRequired();

        builder.Property(ei => ei.ReportedBy)
            .HasColumnName("Reported_By")
            .IsRequired();

        builder.Property(ei => ei.HandledBy)
            .HasColumnName("Handled_By");

        builder.Property(ei => ei.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(ei => ei.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(ei => ei.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.HasOne(ei => ei.Equipment)
            .WithMany(e => e.Issues)
            .HasForeignKey(ei => ei.EquipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ei => ei.Reporter)
            .WithMany(m => m.ReportedIssues)
            .HasForeignKey(ei => ei.ReportedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ei => ei.Handler)
            .WithMany(s => s.HandledIssues)
            .HasForeignKey(ei => ei.HandledBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
