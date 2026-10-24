using DFGymCenter.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DFGymCenter.Infrastructure.Persistence.Configurations;

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("System_Settings");
        builder.HasKey(ss => ss.Id);

        builder.Property(ss => ss.BranchId)
            .HasColumnName("Branch_Id");

        builder.Property(ss => ss.UpdatedBy)
            .HasColumnName("Updated_By");

        builder.Property(ss => ss.SettingKey)
            .HasColumnName("Setting_Key")
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ss => ss.SettingValue)
            .HasColumnName("Setting_Value")
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(ss => ss.DataType)
            .HasColumnName("Data_Type")
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(ss => ss.Description)
            .HasMaxLength(500);

        builder.Property(ss => ss.UpdatedAt)
            .HasColumnName("Updated_At")
            .IsRequired();

        builder.HasOne(ss => ss.Branch)
            .WithMany(b => b.SystemSettings)
            .HasForeignKey(ss => ss.BranchId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(ss => ss.Updater)
            .WithMany(u => u.UpdatedSystemSettings)
            .HasForeignKey(ss => ss.UpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
