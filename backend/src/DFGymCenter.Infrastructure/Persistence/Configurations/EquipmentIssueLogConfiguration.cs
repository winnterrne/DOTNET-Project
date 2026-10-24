using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class EquipmentIssueLogConfiguration : IEntityTypeConfiguration<EquipmentIssueLog>
{
    public void Configure(EntityTypeBuilder<EquipmentIssueLog> builder)
    {
        builder.ToTable("Equipment_Issues_Logs");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.IssueId)
            .HasColumnName("Issue_Id")
            .IsRequired();

        builder.Property(l => l.StaffId)
            .HasColumnName("Staff_Id")
            .IsRequired();

        builder.Property(l => l.Note)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(l => l.StatusAfter)
            .HasColumnName("Status_After")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(l => l.CreatedAt)
            .HasColumnName("Created_At")
            .IsRequired();

        builder.HasOne(l => l.Issue)
            .WithMany(ei => ei.Logs)
            .HasForeignKey(l => l.IssueId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.Staff)
            .WithMany(s => s.IssueLogs)
            .HasForeignKey(l => l.StaffId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
